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

    const snapshot = await getDocs(collection(db, "attendance"));

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
