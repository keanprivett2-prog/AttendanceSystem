// =====================================
// R-E-D Attendance
// Reports
// =====================================

import { db, auth } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const startDateInput =
    document.getElementById("reportStartDate");

const endDateInput =
    document.getElementById("reportEndDate");

const employeeFilter =
    document.getElementById("employeeFilter");

const generateReportButton =
    document.getElementById("generateReportButton");

const exportCsvButton =
    document.getElementById("exportCsvButton");

const reportTableBody =
    document.getElementById("reportTableBody");

const totalRecords =
    document.getElementById("totalRecords");

const onTimeCount =
    document.getElementById("onTimeCount");

const lateCount =
    document.getElementById("lateCount");

const absentCount =
    document.getElementById("absentCount");

const attendanceRate =
    document.getElementById("attendanceRate");

const logoutButton =
    document.getElementById("logoutButton");

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    await loadEmployeeFilter();

});

generateReportButton.addEventListener(
    "click",
    generateReport
);

exportCsvButton.addEventListener(
    "click",
    exportReportToCsv
);

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href = "index.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);

async function generateReport() {

    const startDate =
        startDateInput.value;

    const endDate =
        endDateInput.value;

    if (!startDate || !endDate) {

        showTableMessage(
            "Please select both a start date and an end date."
        );

        return;

    }

    if (startDate > endDate) {

        showTableMessage(
            "The start date cannot be after the end date."
        );

        return;

    }

    showTableMessage(
        "Loading attendance records..."
    );

    try {

        const attendanceQuery = query(
            collection(db, "attendance"),
            where("dateKey", ">=", startDate),
            where("dateKey", "<=", endDate),
            orderBy("dateKey", "desc")
        );

        const snapshot =
            await getDocs(attendanceQuery);

        const records = [];

        snapshot.forEach((documentSnapshot) => {

            records.push({
                id: documentSnapshot.id,
                ...documentSnapshot.data()
            });

        });

        displayReport(records);

    } catch (error) {

        console.error(
            "Report error:",
            error
        );

        showTableMessage(
            "The report could not be loaded. Check the browser console."
        );

    }

}

function updateSummaryCards(records) {

    const total =
        records.length;

    const onTime =
        records.filter((record) =>
            String(record.status).toLowerCase() === "on time"
        ).length;

    const late =
        records.filter((record) =>
            String(record.status).toLowerCase() === "late"
        ).length;

    const absent =
        records.filter((record) =>
            String(record.status).toLowerCase() === "absent"
        ).length;

    const attended =
        onTime + late;

    const rate =
        total === 0
            ? 0
            : Math.round((attended / total) * 100);

    totalRecords.textContent =
        total;

    onTimeCount.textContent =
        onTime;

    lateCount.textContent =
        late;

    absentCount.textContent =
        absent;

    attendanceRate.textContent =
        `${rate}%`;

}

function displayReport(records) {

    reportTableBody.innerHTML = "";

    if (records.length === 0) {

        showTableMessage(
            "No attendance records were found for that date range."
        );

        return;

    }

    records.forEach((record) => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHtml(record.dateKey ?? record.date ?? "-")}</td>
            <td>${escapeHtml(record.employeeNumber ?? "-")}</td>
            <td>${escapeHtml(record.name ?? "-")}</td>
            <td>${escapeHtml(record.department ?? "-")}</td>
            <td>${escapeHtml(record.time ?? "-")}</td>
            <td>${escapeHtml(record.status ?? "Checked In")}</td>
        `;

        reportTableBody.appendChild(row);

    });

    updateSummaryCards(records);
    
}

function showTableMessage(message) {

    reportTableBody.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="empty-row"
            >
                ${escapeHtml(message)}
            </td>
        </tr>
    `;

}

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
function exportReportToCsv() {

    const rows =
        reportTableBody.querySelectorAll("tr");

    if (
        rows.length === 0 ||
        rows[0].querySelector(".empty-row")
    ) {

        alert("Please generate a report before exporting.");

        return;

    }

    const csvRows = [];

    csvRows.push([
        "Date",
        "Employee Number",
        "Employee Name",
        "Department",
        "Check-in Time",
        "Status"
    ]);

    rows.forEach((row) => {

        const cells =
            row.querySelectorAll("td");

        const rowData =
            Array.from(cells).map((cell) => {

                const value =
                    cell.textContent.trim();

                return `"${value.replaceAll('"', '""')}"`;

            });

        csvRows.push(rowData);

    });

    const csvContent =
        csvRows
            .map((row) => row.join(";"))
            .join("\n");

    const blob =
        new Blob(
            [csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

    const downloadUrl =
        URL.createObjectURL(blob);

    const downloadLink =
        document.createElement("a");

    downloadLink.href =
        downloadUrl;

    downloadLink.download =
        `attendance-report-${startDateInput.value}-to-${endDateInput.value}.csv`;

    document.body.appendChild(downloadLink);

    downloadLink.click();

    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(downloadUrl);

}
