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
// Load Attendance
// =====================================

async function loadAttendance() {

    const today =
    new Date();

const year =
    today.getFullYear();

const month =
    String(today.getMonth() + 1).padStart(2, "0");

const day =
    String(today.getDate()).padStart(2, "0");

const todayDateKey =
    `${year}-${month}-${day}`;

const attendanceQuery =
    query(
        collection(db, "attendance"),
        where("dateKey", "==", todayDateKey)
    );

const snapshot =
    await getDocs(attendanceQuery);

    const tableBody = document.getElementById("attendanceTableBody");

    tableBody.innerHTML = "";

    // Statistics
    let checkedIn = 0;
    let lateToday = 0;

    snapshot.forEach((doc) => {

        const data = doc.data();

        checkedIn++;

        if (data.locationStatus === "Late") {
            lateToday++;
        }

        tableBody.innerHTML += `
    <tr>
        <td>${data.name ?? "-"}</td>
        <td>${data.employeeNumber ?? "-"}</td>
        <td>${data.department ?? "-"}</td>
        <td>${data.time ?? "-"}</td>
        <td>${data.status ?? "Checked In"}</td>
    </tr>
`;

    });

        document.getElementById("checkedIn").textContent = checkedIn;
    document.getElementById("lateToday").textContent = lateToday;

}

loadAttendance();
