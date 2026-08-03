import "./admin-session.js";

// =====================================
// R-E-D Attendance
// Dashboard
// =====================================


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
    applySidebarPermissions,
    protectPage
} from "./role-permissions.js";


// =====================================
// Page Elements
// =====================================

const recentActivity =
    document.getElementById(
        "recentActivity"
    );

const departmentSummary =
    document.getElementById(
        "departmentSummary"
    );

const attendanceTableBody =
    document.getElementById(
        "attendanceTableBody"
    );

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

const totalEmployeesElement =
    document.getElementById(
        "totalEmployees"
    );

const checkedInElement =
    document.getElementById(
        "checkedIn"
    );

const lateTodayElement =
    document.getElementById(
        "lateToday"
    );

const absentTodayElement =
    document.getElementById(
        "absentToday"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// =====================================
// Initialize Dashboard
// =====================================

initializeDashboard();

function initializeDashboard() {

    if (!protectPage("dashboard")) {
        return;
    }

    applySidebarPermissions();

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutAdministrator
        );

    }

    loadCompanyBranding();

    loadAttendance();

}


// =====================================
// Load Company Branding
// =====================================

async function loadCompanyBranding() {

    try {

        const settingsReference =
            doc(
                db,
                "systemSettings",
                "attendance"
            );

        const settingsSnapshot =
            await getDoc(
                settingsReference
            );

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

            if (sidebarLogoFallback) {

                sidebarLogoFallback.style.display =
                    "none";

            }

        }

    } catch (error) {

        console.error(
            "Load company branding error:",
            error
        );

    }

}


// =====================================
// Load Dashboard Attendance
// =====================================

async function loadAttendance() {

    try {

        showDashboardLoadingState();

        const todayDateKey =
            formatLocalDateKey(
                new Date()
            );

        const attendanceQuery =
            query(
                collection(
                    db,
                    "attendance"
                ),
                where(
                    "dateKey",
                    "==",
                    todayDateKey
                )
            );

        const [
            attendanceSnapshot,
            employeeSnapshot
        ] =
            await Promise.all([
                getDocs(
                    attendanceQuery
                ),
                getDocs(
                    collection(
                        db,
                        "employees"
                    )
                )
            ]);

        const attendanceRecords =
            attendanceSnapshot.docs.map(
                (attendanceDocument) => ({
                    id:
                        attendanceDocument.id,

                    ...attendanceDocument.data()
                })
            );

        const employeeRecords =
            employeeSnapshot.docs.map(
                (employeeDocument) => ({
                    id:
                        employeeDocument.id,

                    ...employeeDocument.data()
                })
            );

        displayDepartmentSummary(
            employeeRecords
        );

        displayRecentActivity(
            attendanceRecords
        );

        displayAttendanceTable(
            attendanceRecords
        );

        updateDashboardStatistics(
            attendanceRecords,
            employeeRecords
        );

    } catch (error) {

        console.error(
            "Load dashboard attendance error:",
            error
        );

        showDashboardErrorState();

    }

}


// =====================================
// Format Local Date Key
// =====================================

function formatLocalDateKey(date) {

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

    return `${year}-${month}-${day}`;

}


// =====================================
// Display Department Summary
// =====================================

function displayDepartmentSummary(
    employeeRecords
) {

    if (!departmentSummary) {
        return;
    }

    const departmentCounts = {};

    employeeRecords.forEach(
        (employee) => {

            const department =
                String(
                    employee.department ??
                    "Unassigned"
                ).trim() ||
                "Unassigned";

            if (
                !departmentCounts[
                    department
                ]
            ) {

                departmentCounts[
                    department
                ] = 0;

            }

            departmentCounts[
                department
            ]++;

        }
    );

    departmentSummary.innerHTML =
        "";

    const departments =
        Object.entries(
            departmentCounts
        ).sort(
            (a, b) =>
                a[0].localeCompare(
                    b[0]
                )
        );

    if (departments.length === 0) {

        departmentSummary.innerHTML = `
            <p class="empty-row">
                No department data.
            </p>
        `;

        return;

    }

    departments.forEach(
        ([department, total]) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "department-item";

            item.innerHTML = `
                <span>
                    ${escapeHtml(department)}
                </span>

                <strong>
                    ${total}
                </strong>
            `;

            departmentSummary.appendChild(
                item
            );

        }
    );

}


// =====================================
// Display Recent Activity
// =====================================

function displayRecentActivity(
    attendanceRecords
) {

    if (!recentActivity) {
        return;
    }

    recentActivity.innerHTML =
        "";

    if (
        attendanceRecords.length === 0
    ) {

        recentActivity.innerHTML = `
            <p class="empty-row">
                No recent activity.
            </p>
        `;

        return;

    }

    const sortedRecords =
        [...attendanceRecords].sort(
            compareAttendanceTimesDescending
        );

    sortedRecords
        .slice(0, 10)
        .forEach(
            (record) => {

                const activityItem =
                    document.createElement(
                        "div"
                    );

                activityItem.className =
                    "activity-item";

                activityItem.innerHTML = `
                    <strong>
                        ${escapeHtml(
                            record.time ??
                            "--:--"
                        )}
                    </strong>

                    <br>

                    ${escapeHtml(
                        record.name ??
                        "Unknown Employee"
                    )}
                `;

                recentActivity.appendChild(
                    activityItem
                );

            }
        );

}


// =====================================
// Sort Attendance by Time
// =====================================

function compareAttendanceTimesDescending(
    firstRecord,
    secondRecord
) {

    return String(
        secondRecord.time ?? ""
    ).localeCompare(
        String(
            firstRecord.time ?? ""
        )
    );

}


// =====================================
// Display Attendance Table
// =====================================

function displayAttendanceTable(
    attendanceRecords
) {

    if (!attendanceTableBody) {
        return;
    }

    attendanceTableBody.innerHTML =
        "";

    if (
        attendanceRecords.length === 0
    ) {

        attendanceTableBody.innerHTML = `
            <tr>

                <td
                    colspan="5"
                    class="empty-row"
                >
                    No attendance records yet.
                </td>

            </tr>
        `;

        return;

    }

    const sortedRecords =
        [...attendanceRecords].sort(
            compareAttendanceTimesDescending
        );

    sortedRecords.forEach(
        (record) => {

            const row =
                document.createElement(
                    "tr"
                );

            const statusClass =
                createStatusClass(
                    record.status
                );

            row.innerHTML = `
                <td>
                    ${escapeHtml(
                        record.name ??
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        record.employeeNumber ??
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        record.department ??
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        record.time ??
                        "-"
                    )}
                </td>

                <td>

                    <span
                        class="status-badge ${statusClass}"
                    >
                        ${escapeHtml(
                            record.status ??
                            "Checked In"
                        )}
                    </span>

                </td>
            `;

            attendanceTableBody.appendChild(
                row
            );

        }
    );

}


// =====================================
// Update Dashboard Statistics
// =====================================

function updateDashboardStatistics(
    attendanceRecords,
    employeeRecords
) {

    const checkedInCount =
        attendanceRecords.filter(
            (record) =>
                isPresentStatus(
                    record.status
                )
        ).length;

    const lateCount =
        attendanceRecords.filter(
            (record) =>
                normalizeStatus(
                    record.status
                ) === "late"
        ).length;

    const absentCount =
        attendanceRecords.filter(
            (record) =>
                normalizeStatus(
                    record.status
                ) === "absent"
        ).length;

    if (totalEmployeesElement) {

        totalEmployeesElement.textContent =
            employeeRecords.length;

    }

    if (checkedInElement) {

        checkedInElement.textContent =
            checkedInCount;

    }

    if (lateTodayElement) {

        lateTodayElement.textContent =
            lateCount;

    }

    if (absentTodayElement) {

        absentTodayElement.textContent =
            absentCount;

    }

}


// =====================================
// Present Status Check
// =====================================

function isPresentStatus(status) {

    const normalizedStatus =
        normalizeStatus(status);

    return (
        normalizedStatus ===
            "on time" ||
        normalizedStatus ===
            "late" ||
        normalizedStatus ===
            "checked in"
    );

}


// =====================================
// Normalize Status
// =====================================

function normalizeStatus(status) {

    return String(
        status ?? ""
    )
        .trim()
        .toLowerCase();

}


// =====================================
// Create Status CSS Class
// =====================================

function createStatusClass(status) {

    return `status-${normalizeStatus(
        status || "checked-in"
    )
        .replace(
            /\s+/g,
            "-"
        )
        .replace(
            /[^a-z0-9-]/g,
            ""
        )}`;

}


// =====================================
// Dashboard Loading State
// =====================================

function showDashboardLoadingState() {

    if (recentActivity) {

        recentActivity.innerHTML = `
            <p class="empty-row">
                Loading recent activity...
            </p>
        `;

    }

    if (departmentSummary) {

        departmentSummary.innerHTML = `
            <p class="empty-row">
                Loading department data...
            </p>
        `;

    }

    if (attendanceTableBody) {

        attendanceTableBody.innerHTML = `
            <tr>

                <td
                    colspan="5"
                    class="empty-row"
                >
                    Loading today's attendance...
                </td>

            </tr>
        `;

    }

}


// =====================================
// Dashboard Error State
// =====================================

function showDashboardErrorState() {

    if (recentActivity) {

        recentActivity.innerHTML = `
            <p class="empty-row">
                Recent activity could not be loaded.
            </p>
        `;

    }

    if (departmentSummary) {

        departmentSummary.innerHTML = `
            <p class="empty-row">
                Department data could not be loaded.
            </p>
        `;

    }

    if (attendanceTableBody) {

        attendanceTableBody.innerHTML = `
            <tr>

                <td
                    colspan="5"
                    class="empty-row"
                >
                    Attendance data could not be loaded.
                </td>

            </tr>
        `;

    }

}


// =====================================
// Escape HTML
// =====================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================
// Administrator Logout
// =====================================

async function logoutAdministrator() {

    try {

        if (logoutButton) {

            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "Logging out...";

        }

        await signOut(auth);

        sessionStorage.clear();

        window.location.replace(
            "admin-login.html"
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        if (logoutButton) {

            logoutButton.disabled =
                false;

            logoutButton.textContent =
                "Logout";

        }

        alert(
            "Unable to log out. Please try again."
        );

    }

}
