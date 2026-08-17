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
    getDoc,
    onSnapshot
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

const currentlyAtWorkElement =
    document.getElementById(
        "currentlyAtWork"
    );

const checkedOutTodayElement =
    document.getElementById(
        "checkedOutToday"
    );

const lateTodayElement =
    document.getElementById(
        "lateToday"
    );

const earlyExitsTodayElement =
    document.getElementById(
        "earlyExitsToday"
    );

const absentTodayElement =
    document.getElementById(
        "absentToday"
    );

const totalHoursTodayElement =
    document.getElementById(
        "totalHoursToday"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

    // =====================================
// Attendance Settings
// =====================================

let standardWorkStartTime =
    "08:00";


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

            standardWorkStartTime =
    String(
        settings.standardStartTime ??
        "08:00"
    );

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
// Live Dashboard Attendance Listener
// =====================================

function startAttendanceListener(
    employeeRecords
) {

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

    onSnapshot(
        attendanceQuery,
        function (
            attendanceSnapshot
        ) {

            const attendanceRecords =
                attendanceSnapshot.docs.map(
                    (
                        attendanceDocument
                    ) => ({

                        id:
                            attendanceDocument.id,

                        ...attendanceDocument.data()

                    })
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

        },
        function (
            error
        ) {

            console.error(
                "Live attendance listener error:",
                error
            );

            showDashboardErrorState();

        }
    );

}


// =====================================
// Load Dashboard Attendance
// =====================================

async function loadAttendance() {

    try {

        showDashboardLoadingState();

        const employeeSnapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );

        const employeeRecords =
            employeeSnapshot.docs.map(
                (
                    employeeDocument
                ) => ({

                    id:
                        employeeDocument.id,

                    ...employeeDocument.data()

                })
            );

        displayDepartmentSummary(
            employeeRecords
        );

        startAttendanceListener(
            employeeRecords
        );

    } catch (
        error
    ) {

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
        attendanceRecords.length ===
        0
    ) {

        recentActivity.innerHTML = `
            <p class="empty-row">
                No recent activity.
            </p>
        `;

        return;

    }

    const activityRecords =
        [];

    attendanceRecords.forEach(
        (record) => {

            if (
                record.time
            ) {

                let checkInDescription =
                    "Checked in";

                if (
                    normalizeStatus(
                        record.status
                    ) ===
                    "late"
                ) {

                    checkInDescription =
                        "Checked in late";

                }

                activityRecords.push({

                    time:
                        record.time,

                    name:
                        record.name ??
                        "Unknown Employee",

                    description:
                        checkInDescription

                });

            }

            if (
                record.checkOutTime
            ) {

                let checkOutDescription =
                    "Checked out";

                if (
                    record.earlyExit ===
                    true
                ) {

                    checkOutDescription =
                        "Checked out early";

                }

                activityRecords.push({

                    time:
                        record.checkOutTime,

                    name:
                        record.name ??
                        "Unknown Employee",

                    description:
                        checkOutDescription

                });

            }

        }
    );

    activityRecords.sort(
        (firstActivity, secondActivity) => {

            return String(
                secondActivity.time ??
                ""
            ).localeCompare(
                String(
                    firstActivity.time ??
                    ""
                )
            );

        }
    );

    activityRecords
        .slice(
            0,
            10
        )
        .forEach(
            (activity) => {

                const activityItem =
                    document.createElement(
                        "div"
                    );

                activityItem.className =
                    "activity-item";

                activityItem.innerHTML = `

                    <strong>
                        ${escapeHtml(
                            activity.time
                        )}
                    </strong>

                    <br>

                    ${escapeHtml(
                        activity.name
                    )}

                    <br>

                    <span>
                        ${escapeHtml(
                            activity.description
                        )}
                    </span>

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
// Calculate Hours Worked
// =====================================

function calculateHoursWorked(
    record
) {

    if (
        !record.checkOutTime
    ) {

        return "In progress";

    }


    // Use Firestore timestamps where available.

    const checkInTimestamp =
        record.scanTimestamp;

    const checkOutTimestamp =
        record.checkOutTimestamp;

    if (
        checkInTimestamp &&
        checkOutTimestamp &&
        typeof checkInTimestamp.toDate ===
            "function" &&
        typeof checkOutTimestamp.toDate ===
            "function"
    ) {

       const actualCheckInDate =
    checkInTimestamp.toDate();

const checkOutDate =
    checkOutTimestamp.toDate();

const standardStartParts =
    String(
        standardWorkStartTime
    )
        .split(":")
        .map(Number);

const standardStartDate =
    new Date(
        actualCheckInDate
    );

standardStartDate.setHours(
    standardStartParts[0],
    standardStartParts[1],
    0,
    0
);

const effectiveCheckInDate =
    actualCheckInDate <
    standardStartDate
        ?
        standardStartDate
        :
        actualCheckInDate;

const differenceMilliseconds =
    checkOutDate.getTime()
    -
    effectiveCheckInDate.getTime();

        if (
            differenceMilliseconds >=
            0
        ) {

            const totalMinutes =
                Math.floor(
                    differenceMilliseconds /
                    60000
                );

            const hours =
                Math.floor(
                    totalMinutes /
                    60
                );

            const minutes =
                totalMinutes %
                60;

            return (
                hours
                +
                "h "
                +
                String(
                    minutes
                ).padStart(
                    2,
                    "0"
                )
                +
                "m"
            );

        }

    }


    // Fallback for older records.

    if (
        record.time &&
        record.checkOutTime
    ) {

        const checkInParts =
            String(
                record.time
            )
                .split(":")
                .map(Number);

        const checkOutParts =
            String(
                record.checkOutTime
            )
                .split(":")
                .map(Number);

        if (
            checkInParts.length >=
            2 &&
            checkOutParts.length >=
            2
        ) {

            const actualCheckInMinutes =
    (
        checkInParts[0] *
        60
    )
    +
    checkInParts[1];

const standardStartParts =
    String(
        standardWorkStartTime
    )
        .split(":")
        .map(Number);

const standardStartMinutes =
    (
        standardStartParts[0] *
        60
    )
    +
    standardStartParts[1];

const checkInMinutes =
    Math.max(
        actualCheckInMinutes,
        standardStartMinutes
    );

            const checkOutMinutes =
                (
                    checkOutParts[0] *
                    60
                )
                +
                checkOutParts[1];

            const totalMinutes =
                checkOutMinutes -
                checkInMinutes;

            if (
                totalMinutes >=
                0
            ) {

                const hours =
                    Math.floor(
                        totalMinutes /
                        60
                    );

                const minutes =
                    totalMinutes %
                    60;

                return (
                    hours
                    +
                    "h "
                    +
                    String(
                        minutes
                    ).padStart(
                        2,
                        "0"
                    )
                    +
                    "m"
                );

            }

        }

    }

    return "Not available";

}


// =====================================
// Display Attendance Table
// =====================================

function displayAttendanceTable(
    attendanceRecords
) {

    if (
        !attendanceTableBody
    ) {

        return;

    }

    attendanceTableBody.innerHTML =
        "";

    if (
        attendanceRecords.length ===
        0
    ) {

        attendanceTableBody.innerHTML = `
            <tr>

                <td
                    colspan="8"
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

            const checkInTime =
                record.time ??
                "-";

            const checkOutTime =
                record.checkOutTime ??
                "Still at work";

            const hoursWorked =
                calculateHoursWorked(
                    record
                );

            let earlyExitDisplay =
                "-";

            if (
                record.checkOutTime
            ) {

                earlyExitDisplay =
                    record.earlyExit ===
                    true
                        ?
                        "Yes"
                        :
                        "No";

            }

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
                        checkInTime
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        checkOutTime
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        hoursWorked
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        earlyExitDisplay
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
// Calculate Total Worked Minutes
// =====================================

function calculateWorkedMinutes(
    record
) {

    if (
        !record.checkOutTime
    ) {

        return 0;

    }

    const checkInTimestamp =
        record.scanTimestamp;

    const checkOutTimestamp =
        record.checkOutTimestamp;

    if (
        checkInTimestamp &&
        checkOutTimestamp &&
        typeof checkInTimestamp.toDate ===
            "function" &&
        typeof checkOutTimestamp.toDate ===
            "function"
    ) {

       const actualCheckInDate =
    checkInTimestamp.toDate();

const checkOutDate =
    checkOutTimestamp.toDate();

const standardStartParts =
    String(
        standardWorkStartTime
    )
        .split(":")
        .map(Number);

const standardStartDate =
    new Date(
        actualCheckInDate
    );

standardStartDate.setHours(
    standardStartParts[0],
    standardStartParts[1],
    0,
    0
);

const effectiveCheckInDate =
    actualCheckInDate <
    standardStartDate
        ?
        standardStartDate
        :
        actualCheckInDate;

const differenceMilliseconds =
    checkOutDate.getTime()
    -
    effectiveCheckInDate.getTime();

        if (
            differenceMilliseconds >=
            0
        ) {

            return Math.floor(
                differenceMilliseconds /
                60000
            );

        }

    }

    return 0;

}


// =====================================
// Format Worked Minutes
// =====================================

function formatWorkedMinutes(
    totalMinutes
) {

    const hours =
        Math.floor(
            totalMinutes /
            60
        );

    const minutes =
        totalMinutes %
        60;

    return (
        hours
        +
        "h "
        +
        String(
            minutes
        ).padStart(
            2,
            "0"
        )
        +
        "m"
    );

}


// =====================================
// Update Dashboard Statistics
// =====================================

function updateDashboardStatistics(
    attendanceRecords,
    employeeRecords
) {

    const currentlyAtWorkCount =
        attendanceRecords.filter(
            (record) => {

                return (
                    isPresentStatus(
                        record.status
                    )
                    &&
                    !record.checkOutTime
                );

            }
        ).length;

    const checkedOutCount =
        attendanceRecords.filter(
            (record) => {

                return Boolean(
                    record.checkOutTime
                );

            }
        ).length;

    const lateCount =
        attendanceRecords.filter(
            (record) => {

                return (
                    normalizeStatus(
                        record.status
                    ) ===
                    "late"
                );

            }
        ).length;

    const earlyExitCount =
        attendanceRecords.filter(
            (record) => {

                return (
                    record.earlyExit ===
                    true
                );

            }
        ).length;

    const absentCount =
        attendanceRecords.filter(
            (record) => {

                return (
                    normalizeStatus(
                        record.status
                    ) ===
                    "absent"
                );

            }
        ).length;

        const totalWorkedMinutes =
    attendanceRecords.reduce(
        (
            total,
            record
        ) => {

            return (
                total
                +
                calculateWorkedMinutes(
                    record
                )
            );

        },
        0
    );


    if (
        totalEmployeesElement
    ) {

        totalEmployeesElement.textContent =
            employeeRecords.length;

    }


    if (
        currentlyAtWorkElement
    ) {

        currentlyAtWorkElement.textContent =
            currentlyAtWorkCount;

    }


    if (
        checkedOutTodayElement
    ) {

        checkedOutTodayElement.textContent =
            checkedOutCount;

    }


    if (
        lateTodayElement
    ) {

        lateTodayElement.textContent =
            lateCount;

    }


    if (
        earlyExitsTodayElement
    ) {

        earlyExitsTodayElement.textContent =
            earlyExitCount;

    }


    if (
        absentTodayElement
    ) {

        absentTodayElement.textContent =
            absentCount;

    }

    if (
    totalHoursTodayElement
) {

    totalHoursTodayElement.textContent =
        formatWorkedMinutes(
            totalWorkedMinutes
        );

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
                    colspan="8"
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
                    colspan="8"
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
