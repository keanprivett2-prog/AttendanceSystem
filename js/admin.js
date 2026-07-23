import { db } from "./firebase.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
let attendanceRecords = [];
// =====================================
// Check Admin Authentication
// =====================================

if (
    sessionStorage.getItem("adminLoggedIn") !== "true"
) {

    window.location.href = "admin-login.html";

}
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

            attendanceRecords = snapshot.docs.map(document => ({
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
        }
    );
}

// =====================================
// Display Attendance Records
// =====================================

function displayAttendance(search = "", department = "") {

    const tableBody =
        document.getElementById("attendanceTableBody");

    tableBody.innerHTML = "";

    attendanceRecords
        .filter(record => {

            const employeeNumber =
                String(record.employeeNumber || "");

            const employeeName =
                String(record.name || "").toLowerCase();

            const matchesSearch =
                employeeNumber.includes(search) ||
                employeeName.includes(search.toLowerCase());

            const matchesDepartment =
                department === "" ||
                record.department === department;

            return matchesSearch && matchesDepartment;
        })
        .forEach(record => {

            const row = document.createElement("tr");

            const statusColor =
                record.status === "Late"
                    ? "red"
                    : "green";

            row.innerHTML = `
                <td>${record.employeeNumber || ""}</td>
                <td>${record.name || ""}</td>
                <td>${record.department || ""}</td>
                <td>${record.date || ""}</td>
                <td>${record.time || ""}</td>
                <td style="color:${statusColor}; font-weight:bold;">
                    ${record.status || ""}
                </td>
            `;

            tableBody.appendChild(row);
        });
}
// =====================================
// Dashboard Statistics
// =====================================

function updateStatistics() {

    const attendance = JSON.parse(
        localStorage.getItem("attendance")
    ) || [];

    const today = new Date().toLocaleDateString();

    const todayRecords = attendance.filter(record =>
        record.date === today
    );

    const onTimeRecords = todayRecords.filter(record =>
        record.status === "On Time"
    );

    const lateRecords = todayRecords.filter(record =>
        record.status === "Late"
    );

    document.getElementById("totalEmployees").innerHTML =
        todayRecords.length;

    document.getElementById("onTimeCount").innerHTML =
        onTimeRecords.length;

    document.getElementById("lateCount").innerHTML =
        lateRecords.length;
}
loadAttendanceFromFirebase();


const searchInput =
    document.getElementById("searchInput");

const departmentFilter =
    document.getElementById("departmentFilter");

function applyFilters() {

    displayAttendance(
        searchInput.value,
        departmentFilter.value
    );
}

searchInput.addEventListener("input", applyFilters);

departmentFilter.addEventListener("change", applyFilters);
	
	// =====================================
// Export Attendance
// =====================================

function exportAttendance() {

    const attendance = JSON.parse(
        localStorage.getItem("attendance")
    ) || [];

    let csv =
        "Employee Number,Name,Department,Date,Time,Status\n";

    attendance.forEach(record => {

        csv +=
            `${record.employeeNumber},` +
            `${record.name},` +
            `${record.department},` +
            `${record.date},` +
            `${record.time},` +
            `${record.status}\n`;

    });

    const blob = new Blob([csv], {
        type: "text/csv"
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "attendance.csv";

    a.click();

    window.URL.revokeObjectURL(url);
}
document
    .getElementById("exportButton")
    .addEventListener("click", exportAttendance);
	// =====================================
// Admin Logout
// =====================================

document
    .getElementById("logoutButton")
    .addEventListener("click", function () {

        sessionStorage.removeItem("adminLoggedIn");

        window.location.href = "admin-login.html";

    });
	// =====================================
// Monthly Statistics
// =====================================

function updateMonthlyStatistics() {

    const attendance = attendanceRecords;

    const currentMonth =
        new Date().getMonth();

    const monthlyRecords =
        attendance.filter(record => {

            const recordDate =
                new Date(record.date);

            return (
                recordDate.getMonth() ===
                currentMonth
            );
        });

    const monthlyLate =
        monthlyRecords.filter(record =>
            record.status === "Late"
        );

    document.getElementById(
        "monthlyTotal"
    ).innerHTML =
        monthlyRecords.length;

    document.getElementById(
        "monthlyLate"
    ).innerHTML =
        monthlyLate.length;
}
updateMonthlyStatistics();