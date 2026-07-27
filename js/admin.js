import { db } from "../firebase/firebase.js";
import {
    protectAdminPage,
    logoutAdmin,
    getAdminProfile
} from "../firebase/auth.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

let attendanceRecords = [];


// =====================================
// Page Elements
// =====================================

const tableBody =
    document.getElementById("attendanceTableBody");

const searchInput =
    document.getElementById("searchInput");

const departmentFilter =
    document.getElementById("departmentFilter");

const exportButton =
    document.getElementById("exportButton");

const logoutButton =
    document.getElementById("logoutButton");


// =====================================
// Check Admin Authentication
// =====================================

protectAdminPage();


// =====================================
// Live Attendance from Firebase
// =====================================

function loadAttendanceFromFirebase() {

    const attendanceQuery = query(
        collection(db, "attendance"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(
        attendanceQuery,

        snapshot => {

            attendanceRecords =
                snapshot.docs.map(document => ({
                    id: document.id,
                    ...document.data()
                }));

            applyFilters();
            updateStatistics();
            updateMonthlyStatistics();

            console.log(
                "Live attendance updated:",
                attendanceRecords
            );
        },

        error => {

            console.error(
                "Could not load live attendance:",
                error
            );

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Unable to load attendance records.
                    </td>
                </tr>
            `;
        }
    );
}


// =====================================
// Filter Attendance Records
// =====================================

function getFilteredAttendance() {

    const search =
        searchInput.value.trim().toLowerCase();

    const department =
        departmentFilter.value;

    return attendanceRecords.filter(record => {

        const employeeNumber =
            String(
                record.employeeNumber || ""
            ).toLowerCase();

        const employeeName =
            String(
                record.name || ""
            ).toLowerCase();

        const matchesSearch =
            employeeNumber.includes(search) ||
            employeeName.includes(search);

        const matchesDepartment =
            department === "" ||
            record.department === department;

        return (
            matchesSearch &&
            matchesDepartment
        );
    });
}


// =====================================
// Display Attendance Records
// =====================================

function displayAttendance(records) {

    tableBody.innerHTML = "";

    if (records.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    No attendance records found.
                </td>
            </tr>
        `;

        return;
    }

    records.forEach(record => {

        const row =
            document.createElement("tr");

        const statusColor =
            record.status === "Late"
                ? "red"
                : "green";

        row.innerHTML = `
            <td>${escapeHtml(record.employeeNumber)}</td>
            <td>${escapeHtml(record.name)}</td>
            <td>${escapeHtml(record.department)}</td>
            <td>${escapeHtml(record.date)}</td>
            <td>${escapeHtml(record.time)}</td>
            <td
                style="
                    color: ${statusColor};
                    font-weight: bold;
                "
            >
                ${escapeHtml(record.status)}
            </td>
        `;

        tableBody.appendChild(row);
    });
}


// =====================================
// Apply Search and Department Filters
// =====================================

function applyFilters() {

    const filteredRecords =
        getFilteredAttendance();

    displayAttendance(
        filteredRecords
    );
}


// =====================================
// Today's Dashboard Statistics
// =====================================

function updateStatistics() {

    const todayKey =
        getLocalDateKey(new Date());

    const todayRecords =
        attendanceRecords.filter(record =>
            getRecordDateKey(record) === todayKey
        );

    const onTimeRecords =
        todayRecords.filter(record =>
            record.status === "On Time"
        );

    const lateRecords =
        todayRecords.filter(record =>
            record.status === "Late"
        );

    document.getElementById(
        "totalEmployees"
    ).textContent =
        todayRecords.length;

    document.getElementById(
        "onTimeCount"
    ).textContent =
        onTimeRecords.length;

    document.getElementById(
        "lateCount"
    ).textContent =
        lateRecords.length;
}


// =====================================
// Monthly Statistics
// =====================================

function updateMonthlyStatistics() {

    const now =
        new Date();

    const currentYear =
        now.getFullYear();

    const currentMonth =
        now.getMonth() + 1;

    const monthlyRecords =
        attendanceRecords.filter(record => {

            const dateKey =
                getRecordDateKey(record);

            if (!dateKey) {
                return false;
            }

            const parts =
                dateKey.split("-");

            const year =
                Number(parts[0]);

            const month =
                Number(parts[1]);

            return (
                year === currentYear &&
                month === currentMonth
            );
        });

    const monthlyLate =
        monthlyRecords.filter(record =>
            record.status === "Late"
        );

    document.getElementById(
        "monthlyTotal"
    ).textContent =
        monthlyRecords.length;

    document.getElementById(
        "monthlyLate"
    ).textContent =
        monthlyLate.length;
}


// =====================================
// Export Visible Attendance to CSV
// =====================================

function exportAttendance() {

    const records =
        getFilteredAttendance();

    if (records.length === 0) {

        alert(
            "There are no attendance records to export."
        );

        return;
    }

    const rows = [
        [
            "Employee Number",
            "Name",
            "Department",
            "Date",
            "Time",
            "Status"
        ]
    ];

    records.forEach(record => {

        rows.push([
            record.employeeNumber || "",
            record.name || "",
            record.department || "",
            record.date || "",
            record.time || "",
            record.status || ""
        ]);
    });

    const csv =
        rows
            .map(row =>
                row
                    .map(value =>
                        escapeCsvValue(value)
                    )
                    .join(",")
            )
            .join("\n");

    const blob =
        new Blob(
            ["\uFEFF" + csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        window.URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "attendance-"
        + getLocalDateKey(new Date())
        + ".csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
}


// =====================================
// Get Record Date Key
// =====================================

function getRecordDateKey(record) {

    if (record.dateKey) {
        return record.dateKey;
    }

    if (!record.date) {
        return "";
    }

    const parts =
        String(record.date)
            .split("/");

    if (parts.length !== 3) {
        return "";
    }

    const day =
        parts[0].padStart(2, "0");

    const month =
        parts[1].padStart(2, "0");

    const year =
        parts[2];

    return (
        year
        + "-"
        + month
        + "-"
        + day
    );
}


// =====================================
// Create Local Date Key
// =====================================

function getLocalDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return (
        year
        + "-"
        + month
        + "-"
        + day
    );
}


// =====================================
// Protect Table Against HTML Injection
// =====================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;
}


// =====================================
// Format CSV Values Safely
// =====================================

function escapeCsvValue(value) {

    const text =
        String(value || "");

    return (
        '"'
        + text.replace(/"/g, '""')
        + '"'
    );
}


// =====================================
// Search and Department Events
// =====================================

searchInput.addEventListener(
    "input",
    applyFilters
);

departmentFilter.addEventListener(
    "change",
    applyFilters
);


// =====================================
// Export Event
// =====================================

exportButton.addEventListener(
    "click",
    exportAttendance
);


// =====================================
// Admin Logout
// =====================================

logoutButton.addEventListener(
    "click",
    async function () {

        await logoutAdmin();

        window.location.href =
            "admin-login.html";
    }
);

// =====================================
// Load Administrator Profile
// =====================================

async function loadAdminProfile() {

    try {

        const adminProfile =
            await getAdminProfile();

        if (!adminProfile) {

            console.error(
                "Administrator profile not found."
            );

            return;
        }

        console.log(
            "Logged-in administrator:",
            adminProfile
        );

    } catch (error) {

        console.error(
            "Could not load administrator profile:",
            error
        );
    }
}

// =====================================
// Start Dashboard
// =====================================

loadAdminProfile();
loadAttendanceFromFirebase();
