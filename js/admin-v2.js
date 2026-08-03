// =====================================
// Firebase
// =====================================

import {
    db,
    auth
} from "../firebase/firebase.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    applySidebarPermissions
} from "./role-permissions.js";

const recentActivity =
    document.getElementById("recentActivity");

const departmentSummary =
    document.getElementById("departmentSummary");

const dashboardCompanyName =
    document.getElementById(
        "dashboardCompanyName"
    );

const dashboardCompanyLogo =
    document.getElementById(
        "dashboardCompanyLogo"
    );

const sidebarCompanyLogo =
    document.getElementById(
        "sidebarCompanyLogo"
    );

const sidebarLogoFallback =
    document.getElementById(
        "sidebarLogoFallback"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

// =====================================
// Load Company Branding
// =====================================

async function loadCompanyBranding() {

    try {

        const settingsReference =
            doc(db, "systemSettings", "attendance");

        const settingsSnapshot =
            await getDoc(settingsReference);

        if (!settingsSnapshot.exists()) {
            return;
        }

        const settings =
            settingsSnapshot.data();

        if (
            dashboardCompanyName &&
            settings.companyName
        ) {

            dashboardCompanyName.textContent =
                settings.companyName;

        }

        if (
            dashboardCompanyLogo &&
            settings.companyLogo
        ) {

            dashboardCompanyLogo.src =
                settings.companyLogo;

            dashboardCompanyLogo.hidden =
                false;

        }

        if (
    sidebarCompanyLogo &&
    settings.companyLogo
) {

    sidebarCompanyLogo.src =
        settings.companyLogo;

    sidebarCompanyLogo.hidden =
        false;

    sidebarLogoFallback.style.display =
        "none";

}

    } catch (error) {

        console.error(
            "Load company branding error:",
            error
        );

    }

}

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

    const employeeSnapshot =
    await getDocs(
        collection(db, "employees")
    );

    const departmentCounts = {};

    employeeSnapshot.forEach((employeeDocument) => {

    const employeeData =
        employeeDocument.data();

    const department =
        String(employeeData.department ?? "Unassigned").trim();

    if (!departmentCounts[department]) {
        departmentCounts[department] = 0;
    }

    departmentCounts[department]++;

});

    departmentSummary.innerHTML = "";

Object.entries(departmentCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([department, total]) => {

        departmentSummary.innerHTML += `
            <div class="department-item">
                <span>${department}</span>
                <strong>${total}</strong>
            </div>
        `;

    });
    
    const tableBody = document.getElementById("attendanceTableBody");

    tableBody.innerHTML = "";

    // Statistics
    let checkedIn = 0;
    let lateToday = 0;

recentActivity.innerHTML = "";
    
    snapshot.forEach((doc) => {  

        const data = doc.data();

        recentActivity.innerHTML += `
    <div class="activity-item">
        <strong>${data.time ?? "--:--"}</strong><br>
        ${data.name ?? "Unknown Employee"}
    </div>
`;

        checkedIn++;

        if (
    String(data.status ?? "")
        .trim()
        .toLowerCase() === "late"
) {
    lateToday++;
}

        tableBody.innerHTML += `
    <tr>
        <td>${data.name ?? "-"}</td>
        <td>${data.employeeNumber ?? "-"}</td>
        <td>${data.department ?? "-"}</td>
        <td>${data.time ?? "-"}</td>
        <td>
            <span class="status-badge status-${String(data.status ?? "checked-in")
                .trim()
                .toLowerCase()
                .replaceAll(" ", "-")}">
                ${data.status ?? "Checked In"}
            </span>
        </td>
    </tr>
`;

    });

        document.getElementById("checkedIn").textContent = checkedIn;
    document.getElementById("lateToday").textContent = lateToday;
    document.getElementById("totalEmployees").textContent =
    employeeSnapshot.size;

}

// =====================================
// Administrator Logout
// =====================================

async function logoutAdministrator() {

    try {

        await signOut(auth);

        sessionStorage.clear();

        window.location.href =
            "admin-login.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}


// =====================================
// Logout Event
// =====================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logoutAdministrator
    );

}

protectPage("dashboard");

applySidebarPermissions();

loadCompanyBranding();
loadAttendance();
