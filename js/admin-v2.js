import "./admin-session.js";
import "./admin-branding.js";

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

import {
    writeAuditLog
} from "./audit-logger.js";

import {
    logoutAdministrator
} from "./admin-logout.js";


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

    const currentlyAtWorkCard =
    document.getElementById(
        "currentlyAtWorkCard"
    );

const checkedOutTodayElement =
    document.getElementById(
        "checkedOutToday"
    );

    const checkedOutTodayCard =
    document.getElementById(
        "checkedOutTodayCard"
    );

const lateTodayElement =
    document.getElementById(
        "lateToday"
    );

    const lateTodayCard =
    document.getElementById(
        "lateTodayCard"
    );

const dashboardStatModal =
    document.getElementById(
        "dashboardStatModal"
    );

const dashboardStatModalTitle =
    document.getElementById(
        "dashboardStatModalTitle"
    );

const dashboardStatModalContent =
    document.getElementById(
        "dashboardStatModalContent"
    );

const dashboardStatModalClose =
    document.getElementById(
        "dashboardStatModalClose"
    );

const earlyExitsTodayElement =
    document.getElementById(
        "earlyExitsToday"
    );

    const earlyExitsTodayCard =
    document.getElementById(
        "earlyExitsTodayCard"
    );

const absentTodayElement =
    document.getElementById(
        "absentToday"
    );

    const absentTodayCard =
    document.getElementById(
        "absentTodayCard"
    );

    // =====================================
// Leave Today
// =====================================

const leaveTodayCard =
    document.getElementById(
        "leaveTodayCard"
    );

const leaveTodayCount =
    document.getElementById(
        "leaveTodayCount"
    );

    // =====================================
// Employees Requiring Attention
// =====================================

const employeesAttentionCard =
    document.getElementById(
        "employeesAttentionCard"
    );

const employeesAttentionCount =
    document.getElementById(
        "employeesAttentionCount"
    );

    // =====================================
// Upcoming Leave - Next 7 Days
// =====================================

const upcomingLeaveCard =
    document.getElementById(
        "upcomingLeaveCard"
    );

const upcomingLeaveCount =
    document.getElementById(
        "upcomingLeaveCount"
    );

    const unpaidLeaveCard =
    document.getElementById(
        "unpaidLeaveCard"
    );

const unpaidLeaveCount =
    document.getElementById(
        "unpaidLeaveCount"
    );

    const unpaidLeaveCardTitle =
    document.getElementById(
        "unpaidLeaveCardTitle"
    );

const totalHoursTodayElement =
    document.getElementById(
        "totalHoursToday"
    );

    const adminWelcome =
    document.getElementById(
        "adminWelcome"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );

    

    // =====================================
// Current Dashboard Attendance
// =====================================

let currentDashboardAttendanceRecords =
    [];

    let currentDashboardEmployeeRecords =
    [];

    let currentMonthlyUnpaidLeaveRecords =
    [];

    let currentMonthlyAttentionRecords =
    [];

    // =====================================
// Upcoming Leave Records
// =====================================

let currentUpcomingLeaveRecords =
    [];

    // =====================================
// Today's Attendance Pagination
// =====================================

const DASHBOARD_ATTENDANCE_PAGE_SIZE =
    10;

let currentDashboardAttendancePage =
    1;

    
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


    // =====================================
    // Administrator Welcome Message
    // =====================================

    const administratorName =
        sessionStorage.getItem(
            "adminName"
        );


    if (
        adminWelcome
    ) {

        adminWelcome.textContent =
            administratorName
                ?
                `Welcome, ${administratorName}`
                :
                "Welcome";

    }


    if (
        logoutButton
    ) {

    logoutButton.addEventListener(
        "click",
        function () {

            logoutAdministrator(
                "Dashboard",
                logoutButton
            );

        }
    );

}

       if (
        lateTodayCard
    ) {

        lateTodayCard.addEventListener(
            "click",
            function () {

                const lateRecords =
                    currentDashboardAttendanceRecords.filter(
                        function (
                            record
                        ) {

                            return (
                                normalizeStatus(
                                    record.status
                                ) ===
                                "late"
                            );

                        }
                    );

                openDashboardStatModal(
                    "Late Today",
                    lateRecords
                );

            }
        );

    }

    if (
    currentlyAtWorkCard
) {

    currentlyAtWorkCard.addEventListener(
        "click",
        function () {

            const currentlyAtWorkRecords =
                currentDashboardAttendanceRecords.filter(
                    function (
                        record
                    ) {

                        return (
                            isPresentStatus(
                                record.status
                            )
                            &&
                            !record.checkOutTime
                        );

                    }
                );

            openDashboardStatModal(
                "Currently at Work",
                currentlyAtWorkRecords
            );

        }
    );

}

if (
    checkedOutTodayCard
) {

    checkedOutTodayCard.addEventListener(
        "click",
        function () {

            const checkedOutRecords =
                currentDashboardAttendanceRecords.filter(
                    function (
                        record
                    ) {

                        return Boolean(
                            record.checkOutTime
                        );

                    }
                );

            openDashboardStatModal(
                "Checked Out Today",
                checkedOutRecords
            );

        }
    );

}

if (
    earlyExitsTodayCard
) {

    earlyExitsTodayCard.addEventListener(
        "click",
        function () {

            const earlyExitRecords =
                currentDashboardAttendanceRecords.filter(
                    function (
                        record
                    ) {

                        return (
                            record.earlyExit ===
                            true
                        );

                    }
                );

            openDashboardStatModal(
                "Early Exits Today",
                earlyExitRecords
            );

        }
    );

}

if (
    absentTodayCard
) {

    absentTodayCard.addEventListener(
        "click",
        function () {

            const absentRecords =
                currentDashboardAttendanceRecords.filter(
                    function (
                        record
                    ) {

                        return (
                            normalizeStatus(
                                record.status
                            ) ===
                            "absent"
                        );

                    }
                );

            openDashboardStatModal(
                "Absent",
                absentRecords
            );

        }
    );

}

// =====================================
// Leave Today Card
// =====================================

if (
    leaveTodayCard
) {

    leaveTodayCard.addEventListener(
        "click",
        function () {

            const leaveStatuses = [
                "annual leave",
                "sick leave",
                "family responsibility leave",
                "maternity leave",
                "unpaid leave",
                "half day"
            ];


            const leaveRecords =
    currentDashboardAttendanceRecords.filter(
        function (
            record
        ) {

            // =====================================
            // Current Main Leave Status
            // =====================================

            const hasMainLeaveStatus =
                leaveStatuses.includes(
                    normalizeStatus(
                        record.status
                    )
                );


            // =====================================
            // Historical Leave Sessions
            // =====================================

            const hasLeaveSession =
                Array.isArray(
                    record.leaveSessions
                )
                &&
                record.leaveSessions.some(
                    function (
                        session
                    ) {

                        const sessionLeaveType =
                            normalizeStatus(
                                session?.leaveType
                            );


                        return leaveStatuses.includes(
                            sessionLeaveType
                        );

                    }
                );


            return (
                hasMainLeaveStatus
                ||
                hasLeaveSession
            );

        }
    );


            openLeaveTodayModal(
    leaveRecords
);

        }
    );

}

// =====================================
// Employees Requiring Attention Card
// =====================================

if (
    employeesAttentionCard
) {

    employeesAttentionCard.addEventListener(
        "click",
        function () {

            openEmployeesAttentionModal(
                currentMonthlyAttentionRecords
            );

        }
    );

}

// =====================================
// Upcoming Leave Card
// =====================================

if (
    upcomingLeaveCard
) {

    upcomingLeaveCard.addEventListener(
        "click",
        function () {

            openUpcomingLeaveModal(
                currentUpcomingLeaveRecords
            );

        }
    );

}

// =====================================
// Unpaid Leave Card
// =====================================

if (
    unpaidLeaveCard
) {

    unpaidLeaveCard.addEventListener(
        "click",
        function () {

            openUnpaidLeaveModal(
    currentMonthlyUnpaidLeaveRecords
);

        }
    );

}


    // =====================================
    // Close Dashboard Stat Modal
    // =====================================

    if (
        dashboardStatModalClose
    ) {

        dashboardStatModalClose.addEventListener(
            "click",
            function () {

                dashboardStatModal.hidden =
                    true;

            }
        );

    }


    if (
        dashboardStatModal
    ) {

        dashboardStatModal.addEventListener(
            "click",
            function (
                event
            ) {

                if (
                    event.target ===
                    dashboardStatModal
                ) {

                    dashboardStatModal.hidden =
                        true;

                }

            }
        );

    }


    loadCompanyBranding();

loadAttendance();

loadCurrentMonthUnpaidLeave();

loadCurrentMonthAttentionRecords();

loadUpcomingLeave();

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

                currentDashboardAttendanceRecords =
    attendanceRecords;

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

            currentDashboardEmployeeRecords =
    employeeRecords;

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
// Load Current Month Unpaid Leave
// =====================================

async function loadCurrentMonthUnpaidLeave() {

    const currentMonthName =
    new Date().toLocaleDateString(
        "en-ZA",
        {
            month:
                "long"
        }
    );


if (
    unpaidLeaveCardTitle
) {

    unpaidLeaveCardTitle.textContent =
        `Unpaid Leave - ${currentMonthName}`;

}

    if (!unpaidLeaveCount) {
        return;
    }

    try {

        const today =
            new Date();

        const monthStart =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

        const monthEnd =
            new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                0
            );

        const startDateKey =
            formatLocalDateKey(
                monthStart
            );

        const endDateKey =
            formatLocalDateKey(
                monthEnd
            );


        const unpaidLeaveQuery =
            query(
                collection(
                    db,
                    "attendance"
                ),
                where(
                    "dateKey",
                    ">=",
                    startDateKey
                ),
                where(
                    "dateKey",
                    "<=",
                    endDateKey
                )
            );


        const snapshot =
            await getDocs(
                unpaidLeaveQuery
            );


        currentMonthlyUnpaidLeaveRecords =
            snapshot.docs
                .map(
                    function (
                        attendanceDocument
                    ) {

                        return {
                            id:
                                attendanceDocument.id,

                            ...attendanceDocument.data()
                        };

                    }
                )
                .filter(
    function (
        record
    ) {

        // =====================================
        // Legacy / Current Main Status
        // =====================================

        const hasMainUnpaidLeaveStatus =
            normalizeStatus(
                record.status
            ) ===
            "unpaid leave";


        // =====================================
        // Historical Unpaid Leave Sessions
        // =====================================
        //
        // An employee may have started the day
        // on unpaid leave and later checked in.
        //
        // Their main status may now be:
        // On Time / Late
        //
        // but the unpaid leave must remain part
        // of the monthly payroll history.
        //
        // =====================================

        const hasUnpaidLeaveSession =
            Array.isArray(
                record.leaveSessions
            )
            &&
            record.leaveSessions.some(
                function (
                    session
                ) {

                    return (
                        normalizeStatus(
                            session?.leaveType
                        ) ===
                        "unpaid leave"
                    );

                }
            );


        return (
            hasMainUnpaidLeaveStatus
            ||
            hasUnpaidLeaveSession
        );

    }
);


        // =====================================
        // Count Unique Employees
        // =====================================

        unpaidLeaveCount.textContent =
    currentMonthlyUnpaidLeaveRecords.length;


    } catch (
        error
    ) {

        console.error(
            "Unable to load monthly unpaid leave:",
            error
        );

        currentMonthlyUnpaidLeaveRecords =
            [];

        unpaidLeaveCount.textContent =
            "0";

    }

}

// =====================================
// Load Current Month Attention Records
// =====================================

async function loadCurrentMonthAttentionRecords() {

    if (
        !employeesAttentionCount
    ) {

        return;

    }

    try {

        const today =
            new Date();

        const monthStart =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

        const monthEnd =
            new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                0
            );

        const startDateKey =
            formatLocalDateKey(
                monthStart
            );

        const endDateKey =
            formatLocalDateKey(
                monthEnd
            );


        const attentionQuery =
            query(
                collection(
                    db,
                    "attendance"
                ),
                where(
                    "dateKey",
                    ">=",
                    startDateKey
                ),
                where(
                    "dateKey",
                    "<=",
                    endDateKey
                )
            );


        const snapshot =
            await getDocs(
                attentionQuery
            );


        const monthlyRecords =
            snapshot.docs.map(
                function (
                    attendanceDocument
                ) {

                    return {
                        id:
                            attendanceDocument.id,

                        ...attendanceDocument.data()
                    };

                }
            );


        const employeeMap =
            {};


        monthlyRecords.forEach(
            function (
                record
            ) {

                const employeeNumber =
                    String(
                        record.employeeNumber ??
                        "Unknown"
                    );

                const employeeName =
                    String(
                        record.name ??
                        "Unknown Employee"
                    );

                const employeeKey =
                    employeeNumber;


                if (
                    !employeeMap[
                        employeeKey
                    ]
                ) {

                    employeeMap[
                        employeeKey
                    ] = {

                        employeeNumber:
                            employeeNumber,

                        name:
                            employeeName,

                        department:
                            record.department ??
                            "Unassigned",

                        totalRecords:
    0,

actualNormalMinutes:
    0,

paidLeaveMinutes:
    0,

lateCount:
    0,

absentCount:
    0,

earlyExitCount:
    0,

excludedDays:
    0,

reasons:
    []

                    };

                }


                const employee =
                    employeeMap[
                        employeeKey
                    ];


                employee.totalRecords++;


                const status =
                    normalizeStatus(
                        record.status
                    );


                // Public Holiday excluded
                if (
                    status ===
                    "public holiday"
                ) {

                    employee.excludedDays++;

                    return;

                }


                


                if (
                    status ===
                    "late"
                ) {

                    employee.lateCount++;

                }


                if (
                    status ===
                    "absent"
                ) {

                    employee.absentCount++;

                }


                if (
                    record.earlyExit ===
                    true
                ) {

                    employee.earlyExitCount++;

                }

                // =====================================
// Actual Normal Worked Minutes
// =====================================
//
// Prefer the new workSessions structure.
// This prevents multiple check-in/check-out
// sessions from being treated as one shift.
//
// =====================================

let actualNormalMinutes =
    0;


if (
    Array.isArray(
        record.workSessions
    )
    &&
    record.workSessions.length >
    0
) {

    actualNormalMinutes =
        record.workSessions.reduce(
            function (
                total,
                session
            ) {

                const sessionMinutes =
                    Number(
                        session?.workedMinutes ??
                        0
                    );


                if (
                    !Number.isFinite(
                        sessionMinutes
                    )
                    ||
                    sessionMinutes <
                    0
                ) {

                    return total;

                }


                return (
                    total +
                    Math.floor(
                        sessionMinutes
                    )
                );

            },
            0
        );

} else {

    // =====================================
    // Older Attendance Record Fallback
    // =====================================

    actualNormalMinutes =
        calculateWorkedMinutes(
            record
        );

}


employee.actualNormalMinutes +=
    Math.max(
        0,
        actualNormalMinutes
    );

    // =====================================
// Paid Leave Minutes
// =====================================
//
// Paid leave counts toward the employee's
// attendance credit.
//
// Unpaid Leave must NEVER contribute
// paid leave minutes.
//
// =====================================

let paidLeaveMinutes =
    0;


const paidLeaveStatuses = [

    "annual leave",

    "sick leave",

    "family responsibility leave",

    "maternity leave"

];


// =====================================
// Leave Sessions
// =====================================

if (
    Array.isArray(
        record.leaveSessions
    )
) {

    record.leaveSessions.forEach(
        function (
            session
        ) {

            const leaveType =
                normalizeStatus(
                    session?.leaveType
                );


            if (
                !paidLeaveStatuses.includes(
                    leaveType
                )
            ) {

                return;

            }


            const sessionMinutes =
                Number(
                    session?.durationMinutes ??
                    0
                );


            if (
                Number.isFinite(
                    sessionMinutes
                )
                &&
                sessionMinutes >
                0
            ) {

                paidLeaveMinutes +=
                    Math.floor(
                        sessionMinutes
                    );

            }

        }
    );

}


// =====================================
// Main Attendance Status Fallback
// =====================================
//
// Handles older records where leave was
// stored directly on the attendance record
// rather than inside leaveSessions.
//
// =====================================

if (
    paidLeaveMinutes ===
        0
    &&
    paidLeaveStatuses.includes(
        status
    )
) {

    const leaveDuration =
        String(
            record.leaveDuration ??
            "full-day"
        )
            .trim()
            .toLowerCase();


    if (
        leaveDuration ===
        "full-day"
    ) {

        paidLeaveMinutes =
            480;

    } else if (
        leaveDuration ===
        "half-day"
    ) {

        paidLeaveMinutes =
            240;

    }

}


// =====================================
// Cap Paid Leave To Remaining Normal Day
// =====================================
//
// Normal worked time + paid leave may not
// exceed the standard 480-minute paid day.
//
// Example:
// Worked 300 minutes
// Paid leave may contribute max 180 minutes.
//
// =====================================

const maximumPaidLeaveMinutes =
    Math.max(
        0,
        480 -
        actualNormalMinutes
    );


paidLeaveMinutes =
    Math.min(
        paidLeaveMinutes,
        maximumPaidLeaveMinutes
    );


employee.paidLeaveMinutes +=
    Math.max(
        0,
        paidLeaveMinutes
    );

               

            }
        );


        currentMonthlyAttentionRecords =
            Object.values(
                employeeMap
            )
                .map(
                    function (
                        employee
                    ) {

                        const eligibleDays =
                            Math.max(
                                0,
                                employee.totalRecords -
                                employee.excludedDays
                            );


                        const expectedNormalMinutes =
    eligibleDays *
    480;


const accountedNormalMinutes =
    Math.max(
        0,
        employee.actualNormalMinutes ??
        0
    )
    +
    Math.max(
        0,
        employee.paidLeaveMinutes ??
        0
    );


const attendanceRate =
    expectedNormalMinutes ===
        0
        ?
        100
        :
        Math.min(
            100,
            Math.max(
                0,
                Math.round(
                    (
                        accountedNormalMinutes /
                        expectedNormalMinutes
                    )
                    *
                    100
                )
            )
        );


                        const reasons =
                            [];


                        if (
                            employee.absentCount >=
                            1
                        ) {

                            reasons.push(
                                "Absence recorded"
                            );

                        }


                        if (
                            employee.lateCount >=
                            3
                        ) {

                            reasons.push(
                                "Repeated lateness"
                            );

                        }


                        if (
                            employee.earlyExitCount >=
                            2
                        ) {

                            reasons.push(
                                "Frequent early exits"
                            );

                        }


                        if (
                            attendanceRate <
                            80
                        ) {

                            reasons.push(
                                "Attendance below 80%"
                            );

                        }


                        return {

                            ...employee,

                            attendanceRate:
                                attendanceRate,

                            reasons:
                                reasons

                        };

                    }
                )
                .filter(
                    function (
                        employee
                    ) {

                        return (
                            employee.reasons.length >
                            0
                        );

                    }
                );


        employeesAttentionCount.textContent =
            currentMonthlyAttentionRecords.length;


    } catch (
        error
    ) {

        console.error(
            "Unable to load employee attention records:",
            error
        );


        currentMonthlyAttentionRecords =
            [];


        employeesAttentionCount.textContent =
            "0";

    }

}

// =====================================
// Load Upcoming Leave - Next 7 Days
// =====================================

async function loadUpcomingLeave() {

    if (
        !upcomingLeaveCount
    ) {

        return;

    }

    try {

        const today =
            new Date();


        // Start tomorrow
        const startDate =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() + 1
            );


        // End 7 days from today
        const endDate =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() + 7
            );


        const startDateKey =
            formatLocalDateKey(
                startDate
            );


        const endDateKey =
            formatLocalDateKey(
                endDate
            );


        const upcomingLeaveQuery =
            query(
                collection(
                    db,
                    "attendance"
                ),
                where(
                    "dateKey",
                    ">=",
                    startDateKey
                ),
                where(
                    "dateKey",
                    "<=",
                    endDateKey
                )
            );


        const snapshot =
            await getDocs(
                upcomingLeaveQuery
            );


        const leaveStatuses = [
            "annual leave",
            "sick leave",
            "family responsibility leave",
            "maternity leave",
            "unpaid leave",
            "half day"
        ];


        currentUpcomingLeaveRecords =
            snapshot.docs
                .map(
                    function (
                        attendanceDocument
                    ) {

                        return {

                            id:
                                attendanceDocument.id,

                            ...attendanceDocument.data()

                        };

                    }
                )
                .filter(
                    function (
                        record
                    ) {

                        return leaveStatuses.includes(
                            normalizeStatus(
                                record.status
                            )
                        );

                    }
                )
                .sort(
                    function (
                        firstRecord,
                        secondRecord
                    ) {

                        return String(
                            firstRecord.dateKey ??
                            ""
                        ).localeCompare(
                            String(
                                secondRecord.dateKey ??
                                ""
                            )
                        );

                    }
                );


        upcomingLeaveCount.textContent =
            currentUpcomingLeaveRecords.length;


    } catch (
        error
    ) {

        console.error(
            "Unable to load upcoming leave:",
            error
        );


        currentUpcomingLeaveRecords =
            [];


        upcomingLeaveCount.textContent =
            "0";

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
    "department-item clickable-department-item";

            item.innerHTML = `
                <span>
                    ${escapeHtml(department)}
                </span>
                

                <strong>
                    ${total}
                </strong>
            `;

            item.addEventListener(
    "click",
    function () {

        openDepartmentModal(
            department
        );

    }
);

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

const totalPages =
    Math.max(
        1,
        Math.ceil(
            sortedRecords.length /
            DASHBOARD_ATTENDANCE_PAGE_SIZE
        )
    );

if (
    currentDashboardAttendancePage >
    totalPages
) {

    currentDashboardAttendancePage =
        totalPages;
}

if (
    currentDashboardAttendancePage <
    1
) {

    currentDashboardAttendancePage =
        1;
}

const startIndex =
    (
        currentDashboardAttendancePage -
        1
    )
    *
    DASHBOARD_ATTENDANCE_PAGE_SIZE;

const endIndex =
    startIndex +
    DASHBOARD_ATTENDANCE_PAGE_SIZE;

const pageRecords =
    sortedRecords.slice(
        startIndex,
        endIndex
    );

pageRecords.forEach(
    (record) => {

            const row =
                document.createElement(
                    "tr"
                );

            const statusClass =
                createStatusClass(
                    record.status
                );

            const normalizedStatus =
    normalizeStatus(
        record.status
    );


const nonWorkingStatuses = [

    "absent",

    "annual leave",

    "sick leave",

    "family responsibility leave",

    "maternity leave",

    "unpaid leave",

    "public holiday"

];


const isNonWorkingRecord =
    nonWorkingStatuses.includes(
        normalizedStatus
    );


const hasValidCheckIn =
    Boolean(
        String(
            record.time ??
            ""
        ).trim()
        ||
        record.scanTimestamp
        ||
        record.checkInTimestamp
    );


const checkInTime =
    isNonWorkingRecord
        ?
        "N/A"
        :
        (
            record.time ??
            "-"
        );


const checkOutTime =
    isNonWorkingRecord
        ?
        "N/A"
        :
        (
            hasValidCheckIn
                ?
                (
                    record.checkOutTime ??
                    "Still at work"
                )
                :
                "N/A"
        );


const hoursWorked =
    isNonWorkingRecord
        ?
        "N/A"
        :
        calculateHoursWorked(
            record
        );

            let earlyExitDisplay =
                "N/A";

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


    // =====================================
    // Update Attendance Pagination
    // =====================================

    updateAttendancePagination(
        totalPages
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
// Today's Attendance Pagination
// =====================================

function updateAttendancePagination(
    totalPages
) {

    const attendanceTable =
        attendanceTableBody?.closest(
            "table"
        );


    if (
        !attendanceTable
    ) {

        return;
    }


    let paginationContainer =
        document.getElementById(
            "dashboardAttendancePagination"
        );


    // =====================================
    // Create Pagination Container
    // =====================================

    if (
        !paginationContainer
    ) {

        paginationContainer =
            document.createElement(
                "div"
            );

        paginationContainer.id =
            "dashboardAttendancePagination";

        paginationContainer.className =
            "dashboard-attendance-pagination";


        attendanceTable.insertAdjacentElement(
            "afterend",
            paginationContainer
        );

    }


    // =====================================
    // Hide Pagination When Not Needed
    // =====================================

    if (
        totalPages <=
        1
    ) {

        paginationContainer.innerHTML =
            "";

        paginationContainer.hidden =
            true;

        return;

    }


    paginationContainer.hidden =
        false;


    // =====================================
    // Render Controls
    // =====================================

    paginationContainer.innerHTML = `

        <button
            type="button"
            id="previousDashboardAttendancePage"
            ${
                currentDashboardAttendancePage <= 1
                    ?
                    "disabled"
                    :
                    ""
            }
        >
            Previous
        </button>


        <span class="dashboard-attendance-page-info">
            Page
            ${currentDashboardAttendancePage}
            of
            ${totalPages}
        </span>


        <button
            type="button"
            id="nextDashboardAttendancePage"
            ${
                currentDashboardAttendancePage >= totalPages
                    ?
                    "disabled"
                    :
                    ""
            }
        >
            Next
        </button>

    `;


    // =====================================
    // Previous Page
    // =====================================

    const previousButton =
        document.getElementById(
            "previousDashboardAttendancePage"
        );


    previousButton?.addEventListener(
        "click",
        function () {

            if (
                currentDashboardAttendancePage <=
                1
            ) {

                return;
            }


            currentDashboardAttendancePage--;


            displayAttendanceTable(
                currentDashboardAttendanceRecords
            );

        }
    );


    // =====================================
    // Next Page
    // =====================================

    const nextButton =
        document.getElementById(
            "nextDashboardAttendancePage"
        );


    nextButton?.addEventListener(
        "click",
        function () {

            if (
                currentDashboardAttendancePage >=
                totalPages
            ) {

                return;
            }


            currentDashboardAttendancePage++;


            displayAttendanceTable(
                currentDashboardAttendanceRecords
            );

        }
    );

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
// Open Leave Today Modal
// =====================================

function openLeaveTodayModal(
    records
) {

    if (
        !dashboardStatModal ||
        !dashboardStatModalTitle ||
        !dashboardStatModalContent
    ) {

        return;

    }


    dashboardStatModalTitle.textContent =
        "Leave Today";


    dashboardStatModalContent.innerHTML =
        "";


    if (
        records.length ===
        0
    ) {

        dashboardStatModalContent.innerHTML = `
            <p class="empty-row">
                No employees on leave today.
            </p>
        `;

        dashboardStatModal.hidden =
            false;

        return;

    }


    records.forEach(
        function (
            record
        ) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "dashboard-stat-employee-item";


            const leaveSession =
    Array.isArray(
        record.leaveSessions
    )
        ?
        record.leaveSessions.find(
            function (
                session
            ) {

                return Boolean(
                    String(
                        session?.leaveType ??
                        ""
                    ).trim()
                );

            }
        )
        :
        null;


const leaveType =
    String(
        leaveSession?.leaveType ??
        record.status ??
        "Leave"
    ).trim();


            const leaveDuration =
    String(
        leaveSession?.leaveDuration ??
        record.leaveDuration ??
        "full-day"
    )
        .trim()
        .toLowerCase();


            let durationDisplay =
                "Full Day";


            if (
                leaveDuration ===
                "half-day"
            ) {

                durationDisplay =
                    "Half Day";

            } else if (
                leaveDuration ===
                "custom"
            ) {

                durationDisplay =
                    "Custom";

            }


            const leaveStartTime =
    String(
        leaveSession?.startTime ??
        record.leaveStartTime ??
        ""
    ).trim();


const leaveEndTime =
    String(
        leaveSession?.endTime ??
        record.leaveTime ??
        record.checkOutTime ??
        ""
    ).trim();


let leaveTime =
    "";


if (
    leaveStartTime
    &&
    leaveEndTime
) {

    leaveTime =
        `${leaveStartTime} → ${leaveEndTime}`;

} else if (
    leaveStartTime
) {

    leaveTime =
        `${leaveStartTime} → Active`;

} else {

    leaveTime =
        String(
            record.leaveTime ??
            record.checkOutTime ??
            ""
        ).trim();

}


            let durationWithTime =
    durationDisplay;


if (
    leaveSession
    &&
    leaveTime !==
        ""
) {

    durationWithTime =
        leaveTime;

} else if (
    (
        leaveDuration ===
            "half-day"
        ||
        leaveDuration ===
            "custom"
    )
    &&
    leaveTime !==
        ""
) {

    durationWithTime =
        `${durationDisplay} - From ${leaveTime}`;

}


            item.innerHTML = `

                <strong>
                    ${escapeHtml(
                        record.name ??
                        "Unknown Employee"
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        record.department ??
                        "Unassigned"
                    )}
                </span>

                <div class="upcoming-leave-details">

    <span>
        Leave Type:
        <strong>
            ${escapeHtml(
                leaveType
            )}
        </strong>
    </span>

    <span>
        Duration:
${escapeHtml(
    durationWithTime
)}

    
    </span>

</div>

            `;


            dashboardStatModalContent.appendChild(
                item
            );

        }
    );


    dashboardStatModal.hidden =
        false;

}

// =====================================
// Open Employees Requiring Attention
// =====================================

function openEmployeesAttentionModal(
    records
) {

    if (
        !dashboardStatModal ||
        !dashboardStatModalTitle ||
        !dashboardStatModalContent
    ) {

        return;

    }


    const monthName =
        new Date().toLocaleDateString(
            "en-ZA",
            {
                month:
                    "long",

                year:
                    "numeric"
            }
        );


    dashboardStatModalTitle.textContent =
        `Employees Requiring Attention - ${monthName}`;


    dashboardStatModalContent.innerHTML =
        "";


    if (
        records.length ===
        0
    ) {

        dashboardStatModalContent.innerHTML = `
            <p class="empty-row">
                No employees currently require attention.
            </p>
        `;

        dashboardStatModal.hidden =
            false;

        return;

    }


    records.forEach(
        function (
            employee
        ) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "dashboard-stat-employee-item";


            const reasonsDisplay =
                employee.reasons
                    .map(
                        function (
                            reason
                        ) {

                            return `
                                <span>
                                    • ${escapeHtml(
                                        reason
                                    )}
                                </span>
                            `;

                        }
                    )
                    .join("");


            item.innerHTML = `

                <strong>
                    ${escapeHtml(
                        employee.name ??
                        "Unknown Employee"
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        employee.department ??
                        "Unassigned"
                    )}
                </span>

                <span>
                    Attendance Rate:
                    <strong>
                        ${escapeHtml(
                            String(
                                employee.attendanceRate ??
                                0
                            )
                        )}%
                    </strong>
                </span>

                <span>
                    Late:
                    ${escapeHtml(
                        String(
                            employee.lateCount ??
                            0
                        )
                    )}
                </span>

                <span>
                    Absent:
                    ${escapeHtml(
                        String(
                            employee.absentCount ??
                            0
                        )
                    )}
                </span>

                <span>
                    Early Exits:
                    ${escapeHtml(
                        String(
                            employee.earlyExitCount ??
                            0
                        )
                    )}
                </span>

                <br>

                <strong>
                    Reasons:
                </strong>

                ${reasonsDisplay}

            `;


            dashboardStatModalContent.appendChild(
                item
            );

        }
    );


    dashboardStatModal.hidden =
        false;

}

// =====================================
// Open Upcoming Leave Modal
// =====================================

function openUpcomingLeaveModal(
    records
) {

    if (
        !dashboardStatModal ||
        !dashboardStatModalTitle ||
        !dashboardStatModalContent
    ) {

        return;

    }


    dashboardStatModalTitle.textContent =
        "Upcoming Leave - Next 7 Days";


    dashboardStatModalContent.innerHTML =
        "";


    if (
        records.length ===
        0
    ) {

        dashboardStatModalContent.innerHTML = `
            <p class="empty-row">
                No upcoming leave in the next 7 days.
            </p>
        `;

        dashboardStatModal.hidden =
            false;

        return;

    }


    records.forEach(
        function (
            record
        ) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "dashboard-stat-employee-item";


            let leaveDate =
                record.dateKey ??
                "Unknown Date";


            if (
                record.dateKey
            ) {

                const date =
                    new Date(
                        `${record.dateKey}T00:00:00`
                    );


                leaveDate =
                    date.toLocaleDateString(
                        "en-ZA",
                        {
                            day:
                                "2-digit",

                            month:
                                "short",

                            year:
                                "numeric"
                        }
                    );

            }


            const leaveType =
                String(
                    record.status ??
                    "Leave"
                ).trim();


            const leaveDuration =
                String(
                    record.leaveDuration ??
                    "full-day"
                )
                    .trim()
                    .toLowerCase();


            let durationDisplay =
                "Full Day";


            if (
                leaveDuration ===
                "half-day"
            ) {

                durationDisplay =
                    "Half Day";

            } else if (
                leaveDuration ===
                "custom"
            ) {

                durationDisplay =
                    "Custom";

            }


            const leaveTime =
    String(
        record.leaveTime ??
        record.leaveStartTime ??
        record.customLeaveTime ??
        record.halfDayTime ??
        record.checkOutTime ??
        ""
    ).trim();


            let durationWithTime =
                durationDisplay;


            if (
                (
                    leaveDuration ===
                        "half-day"
                    ||
                    leaveDuration ===
                        "custom"
                )
                &&
                leaveTime !==
                    ""
            ) {

                durationWithTime =
                    `${durationDisplay} - From ${leaveTime}`;

            }


            item.innerHTML = `

                <strong>
                    ${escapeHtml(
                        record.name ??
                        "Unknown Employee"
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        record.department ??
                        "Unassigned"
                    )}
                </span>

                <span>
    Date:
    <strong>
        ${escapeHtml(
            leaveDate
        )}
    </strong>
</span>

<div class="upcoming-leave-details">

    <span>
        Leave Type:
        <strong>
            ${escapeHtml(
                leaveType
            )}
        </strong>
    </span>

    <span>
        Duration:
        ${escapeHtml(
            durationDisplay
        )}

        ${
            leaveTime !==
                ""
                ?
                ` - From ${escapeHtml(
                    leaveTime
                )}`
                :
                ""
        }
    </span>

</div>

            `;


            dashboardStatModalContent.appendChild(
                item
            );

        }
    );


    dashboardStatModal.hidden =
        false;

}

// =====================================
// Open Dashboard Stat Modal
// =====================================

function openDashboardStatModal(
    title,
    records
) {

    if (
        !dashboardStatModal ||
        !dashboardStatModalTitle ||
        !dashboardStatModalContent
    ) {

        return;

    }

    dashboardStatModalTitle.textContent =
        title;

    dashboardStatModalContent.innerHTML =
        "";

    if (
        records.length ===
        0
    ) {

        dashboardStatModalContent.innerHTML = `
            <p class="empty-row">
                No employees found.
            </p>
        `;

    } else {

        records.forEach(
            function (
                record
            ) {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "dashboard-stat-employee-item";

                item.innerHTML = `

    <strong>
        ${escapeHtml(
            record.name ??
            "Unknown Employee"
        )}
    </strong>

    <span>
        ${escapeHtml(
            record.department ??
            "Unassigned"
        )}
    </span>

    <span>
        Check In:
        ${escapeHtml(
            record.time ||
            "N/A"
        )}
    </span>

    <span>
        Check Out:
        ${escapeHtml(
            record.checkOutTime ||
            "N/A"
        )}
    </span>

`;

                dashboardStatModalContent.appendChild(
                    item
                );

            }
        );

    }

    dashboardStatModal.hidden =
        false;

}

// =====================================
// Calculate Unpaid Leave Deduction
// =====================================

function calculateUnpaidLeaveDeductionMinutes(
    record
) {

    const STANDARD_START_MINUTES =
        8 * 60;

    const STANDARD_END_MINUTES =
        (16 * 60) + 30;

    const STANDARD_PAID_DAY_MINUTES =
        8 * 60;

    const BREAK_MINUTES =
        30;


    const leaveDuration =
        String(
            record.leaveDuration ??
            "full-day"
        )
            .trim()
            .toLowerCase();


    // =====================================
    // Full Day
    // =====================================

    if (
        leaveDuration ===
            "full-day"
        ||
        leaveDuration ===
            ""
    ) {

        return STANDARD_PAID_DAY_MINUTES;

    }


    // =====================================
    // Leave Time
    // =====================================

    const leaveTime =
        String(
            record.leaveTime ??
            record.checkOutTime ??
            ""
        ).trim();


    if (
        !leaveTime.includes(":")
    ) {

        // Half Day fallback.
        if (
            leaveDuration ===
            "half-day"
        ) {

            return 240;

        }

        return 0;

    }


    const timeParts =
        leaveTime
            .split(":")
            .map(Number);


    if (
        timeParts.length <
            2
        ||
        !Number.isFinite(
            timeParts[0]
        )
        ||
        !Number.isFinite(
            timeParts[1]
        )
    ) {

        return 0;

    }


    const leaveMinutes =
        (
            timeParts[0] *
            60
        )
        +
        timeParts[1];


    // =====================================
    // Clamp To Normal Workday
    // =====================================

    const effectiveLeaveMinutes =
        Math.min(
            STANDARD_END_MINUTES,
            Math.max(
                STANDARD_START_MINUTES,
                leaveMinutes
            )
        );


    // =====================================
    // Minutes At Work Before Leave
    // =====================================

    let workedMinutes =
        effectiveLeaveMinutes -
        STANDARD_START_MINUTES;


    // Deduct the normal unpaid 30-minute
    // break once the employee has worked
    // beyond the first four hours.

    if (
        workedMinutes >
        240
    ) {

        workedMinutes -=
            BREAK_MINUTES;

    }


    workedMinutes =
        Math.max(
            0,
            Math.min(
                STANDARD_PAID_DAY_MINUTES,
                workedMinutes
            )
        );


    // =====================================
    // Payroll Deduction
    // =====================================

    return Math.max(
        0,
        STANDARD_PAID_DAY_MINUTES -
        workedMinutes
    );

}

// =====================================
// Open Unpaid Leave Modal
// =====================================

function openUnpaidLeaveModal(
    records
) {

    if (
        !dashboardStatModal ||
        !dashboardStatModalTitle ||
        !dashboardStatModalContent
    ) {

        return;

    }


    const monthName =
        new Date().toLocaleDateString(
            "en-ZA",
            {
                month:
                    "long",

                year:
                    "numeric"
            }
        );


    dashboardStatModalTitle.textContent =
        `Unpaid Leave - ${monthName}`;


    dashboardStatModalContent.innerHTML =
        "";


    if (
        records.length ===
        0
    ) {

        dashboardStatModalContent.innerHTML = `
            <p class="empty-row">
                No employees with unpaid leave this month.
            </p>
        `;

        dashboardStatModal.hidden =
            false;

        return;

    }


    records.forEach(
        function (
            record
        ) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "dashboard-stat-employee-item";


            // =====================================
            // Format Leave Date
            // =====================================

            let leaveDate =
                record.dateKey ??
                "Unknown Date";


            if (
                record.dateKey
            ) {

                const date =
                    new Date(
                        `${record.dateKey}T00:00:00`
                    );


                leaveDate =
                    date.toLocaleDateString(
                        "en-ZA",
                        {
                            day:
                                "2-digit",

                            month:
                                "short",

                            year:
                                "numeric"
                        }
                    );

            }


            // =====================================
            // Format Leave Duration
            // =====================================

            // =====================================
// Unpaid Leave Session
// =====================================

const unpaidLeaveSession =
    Array.isArray(
        record.leaveSessions
    )
        ?
        record.leaveSessions.find(
            function (
                session
            ) {

                return (
                    normalizeStatus(
                        session?.leaveType
                    ) ===
                    "unpaid leave"
                );

            }
        )
        :
        null;

            const leaveDuration =
                String(
                    record.leaveDuration ??
                    "full-day"
                )
                    .trim()
                    .toLowerCase();


            let durationDisplay =
    "Full Day";


if (
    leaveDuration ===
    "half-day"
) {

    durationDisplay =
        "Half Day";

} else if (
    leaveDuration ===
    "custom"
) {

    durationDisplay =
        "Custom";

}


// =====================================
// Partial Leave Time
// =====================================

const leaveStartTime =
    String(
        unpaidLeaveSession?.startTime ??
        record.leaveStartTime ??
        ""
    ).trim();


const leaveEndTime =
    String(
        unpaidLeaveSession?.endTime ??
        record.leaveTime ??
        record.checkOutTime ??
        ""
    ).trim();

    // =====================================
// Unpaid Leave Duration Minutes
// =====================================

let unpaidLeaveMinutes =
    Number(
        unpaidLeaveSession?.durationMinutes ??
        0
    );


if (
    !Number.isFinite(
        unpaidLeaveMinutes
    )
    ||
    unpaidLeaveMinutes <
    0
) {

    unpaidLeaveMinutes =
        0;

}



const deductionMinutes =
    unpaidLeaveSession
        ?
        unpaidLeaveMinutes
        :
        calculateUnpaidLeaveDeductionMinutes(
            record
        );


const deductionDisplay =
    formatWorkedMinutes(
        deductionMinutes
    );

    // =====================================
// Unpaid Leave Display
// =====================================

let unpaidLeaveDurationDisplay =
    durationDisplay;


if (
    unpaidLeaveSession
) {

    const formattedDuration =
        formatWorkedMinutes(
            unpaidLeaveMinutes
        );


    if (
        leaveStartTime
        &&
        leaveEndTime
    ) {

        unpaidLeaveDurationDisplay =
            `${leaveStartTime} → ${leaveEndTime}`;

    } else if (
        leaveStartTime
    ) {

        unpaidLeaveDurationDisplay =
            `${leaveStartTime} → Active`;

    } else {

        unpaidLeaveDurationDisplay =
            formattedDuration;

    }

}


            item.innerHTML = `

                <strong>
                    ${escapeHtml(
                        record.name ??
                        "Unknown Employee"
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        record.department ??
                        "Unassigned"
                    )}
                </span>

                <span>
                    Date:
                    ${escapeHtml(
                        leaveDate
                    )}
                </span>

               <div class="unpaid-leave-duration-details">

    <span>
        Duration:
        <strong>
            ${escapeHtml(
                unpaidLeaveDurationDisplay
            )}
        </strong>
    </span>

    <span>
        Hours to Deduct from Pay:
        <strong>
            ${escapeHtml(
                deductionDisplay
            )}
        </strong>
    </span>

</div>

            `;


            dashboardStatModalContent.appendChild(
                item
            );

        }
    );


    dashboardStatModal.hidden =
        false;

}

// =====================================
// Open Department Modal
// =====================================

function openDepartmentModal(
    department
) {

    const departmentEmployees =
        currentDashboardEmployeeRecords.filter(
            function (
                employee
            ) {

                return (
                    String(
                        employee.department ??
                        "Unassigned"
                    ).trim() ===
                    department
                );

            }
        );


    const departmentRecords =
        departmentEmployees.map(
            function (
                employee
            ) {

                const attendanceRecord =
                    currentDashboardAttendanceRecords.find(
                        function (
                            record
                        ) {

                            return (
                                String(
                                    record.employeeNumber ??
                                    ""
                                ) ===
                                String(
                                    employee.employeeNumber ??
                                    ""
                                )
                            );

                        }
                    );


                return {

                    name:
                        employee.name ??
                        "Unknown Employee",

                    department:
                        department,

                    time:
                        attendanceRecord
                            ?
                            (
                                attendanceRecord.time ||
                                "N/A"
                            )
                            :
                            "N/A",

                    checkOutTime:
                        attendanceRecord
                            ?
                            (
                                attendanceRecord.checkOutTime ||
                                "N/A"
                            )
                            :
                            "N/A",

                    status:
                        attendanceRecord
                            ?
                            (
                                attendanceRecord.status ||
                                "Unknown"
                            )
                            :
                            "Not Checked In"

                };

            }
        );


    openDashboardStatModal(
        department,
        departmentRecords
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

        // =====================================
// Leave Today Count
// =====================================

const leaveStatuses = [
    "annual leave",
    "sick leave",
    "family responsibility leave",
    "maternity leave",
    "unpaid leave",
    "half day"
];


const leaveTodayTotal =
    attendanceRecords.filter(
        function (
            record
        ) {

            const hasMainLeaveStatus =
                leaveStatuses.includes(
                    normalizeStatus(
                        record.status
                    )
                );


            const hasLeaveSession =
                Array.isArray(
                    record.leaveSessions
                )
                &&
                record.leaveSessions.some(
                    function (
                        session
                    ) {

                        return leaveStatuses.includes(
                            normalizeStatus(
                                session?.leaveType
                            )
                        );

                    }
                );


            return (
                hasMainLeaveStatus
                ||
                hasLeaveSession
            );

        }
    ).length;

        const totalWorkedMinutes =
    attendanceRecords.reduce(
        function (
            total,
            record
        ) {

            let recordWorkedMinutes =
                0;


            // =====================================
            // New Work Sessions
            // =====================================

            if (
                Array.isArray(
                    record.workSessions
                )
                &&
                record.workSessions.length >
                0
            ) {

                recordWorkedMinutes =
                    record.workSessions.reduce(
                        function (
                            sessionTotal,
                            session
                        ) {

                            let sessionMinutes =
    Number(
        session?.workedMinutes ??
        0
    );


const sessionCheckOutTime =
    String(
        session?.checkOutTime ??
        ""
    ).trim();


if (
    !sessionCheckOutTime
) {

    let sessionStartDate =
        null;


    if (
        session?.checkInTimestamp
    ) {

        if (
            session.checkInTimestamp instanceof
            Date
        ) {

            sessionStartDate =
                new Date(
                    session.checkInTimestamp
                );

        } else if (
            typeof session.checkInTimestamp.toDate ===
            "function"
        ) {

            sessionStartDate =
                session.checkInTimestamp.toDate();

        }

    }


    if (
        sessionStartDate
    ) {

        const now =
            new Date();


        sessionMinutes =
            Math.max(
                0,
                Math.floor(
                    (
                        now.getTime()
                        -
                        sessionStartDate.getTime()
                    )
                    /
                    60000
                )
            );

    }

}


if (
    !Number.isFinite(
        sessionMinutes
    )
    ||
    sessionMinutes <
    0
) {

    return sessionTotal;

}


return (
    sessionTotal +
    Math.floor(
        sessionMinutes
    )
);


                            

                        },
                        0
                    );

            } else {

                // =====================================
                // Older Record Fallback
                // =====================================

                recordWorkedMinutes =
                    calculateWorkedMinutes(
                        record
                    );

            }


            return (
                total +
                Math.max(
                    0,
                    recordWorkedMinutes
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
    leaveTodayCount
) {

    leaveTodayCount.textContent =
        leaveTodayTotal;

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



