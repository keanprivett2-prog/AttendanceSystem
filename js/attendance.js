// =====================================
// Firebase
// =====================================

import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// =====================================
// Elements
// =====================================

const attendanceTableBody =
    document.getElementById("attendanceTableBody");

const attendanceDateText =
    document.getElementById("attendanceDateText");

// =====================================
// Date Helpers
// =====================================

function getTodayDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatTodayDate() {

    const today = new Date();

    return today.toLocaleDateString(
        "en-ZA",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}

// =====================================
// Load Attendance
// =====================================

async function loadAttendance() {

    attendanceDateText.textContent =
        formatTodayDate();

    try {

        const todayDate =
            getTodayDate();

        const employeeSnapshot =
            await getDocs(
                collection(db, "employees")
            );

        const attendanceQuery =
            query(
                collection(db, "attendance"),
                where("date", "==", todayDate)
            );

        const attendanceSnapshot =
            await getDocs(attendanceQuery);

        const attendanceRecords =
            new Map();

        attendanceSnapshot.forEach((attendanceDoc) => {

            const attendance =
                attendanceDoc.data();

            attendanceRecords.set(
                attendance.employeeNumber,
                attendance
            );

        });

        attendanceTableBody.innerHTML = "";

        if (employeeSnapshot.empty) {

            attendanceTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-row">
                        No employees have been added yet.
                    </td>
                </tr>
            `;

            return;
        }

        employeeSnapshot.forEach((employeeDoc) => {

            const employee =
                employeeDoc.data();

            const attendance =
                attendanceRecords.get(
                    employee.employeeNumber
                );

            const status =
                attendance
                    ? "Checked In"
                    : "Not Checked In";

            const checkInTime =
                attendance?.timestamp?.toDate
                    ? attendance.timestamp
                        .toDate()
                        .toLocaleTimeString(
                            "en-ZA",
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )
                    : "-";

            attendanceTableBody.innerHTML += `
                <tr>
                    <td>
                        ${employee.employeeNumber ?? "-"}
                    </td>

                    <td>
                        ${employee.name ?? "-"}
                    </td>

                    <td>
                        ${employee.department ?? "-"}
                    </td>

                    <td>
                        ${status}
                    </td>

                    <td>
                        ${checkInTime}
                    </td>
                </tr>
            `;

        });

    } catch (error) {

        console.error(
            "Error loading attendance:",
            error
        );

        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    Unable to load attendance records.
                </td>
            </tr>
        `;

    }

}

loadAttendance();
