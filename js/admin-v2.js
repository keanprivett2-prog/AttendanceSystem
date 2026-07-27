// =====================================
// Firebase
// =====================================

import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// =====================================
// Load Attendance
// =====================================

async function loadAttendance() {

    const snapshot = await getDocs(collection(db, "attendance"));

    const tableBody = document.getElementById("attendanceTableBody");

    tableBody.innerHTML = "";

    snapshot.forEach((doc) => {

        const data = doc.data();

        tableBody.innerHTML += `
            <tr>
                <td>${data.employee ?? "-"}</td>
                <td>${data.employeeNo ?? "-"}</td>
                <td>${data.department ?? "-"}</td>
                <td>${data.createdAt?.toDate().toLocaleTimeString() ?? "-"}</td>
                <td>${data.locationStatus ?? "Checked In"}</td>
            </tr>
        `;

    });

}

loadAttendance();
