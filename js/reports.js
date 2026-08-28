import "./admin-session.js";

// =====================================
// R-E-D Attendance
// Reports
// =====================================


// =====================================
// Firebase
// =====================================

import {
    db,
    auth
} from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    applySidebarPermissions,
    protectPage
} from "./role-permissions.js";


// =====================================
// Page Elements
// =====================================

const startDateInput =
    document.getElementById(
        "reportStartDate"
    );

const endDateInput =
    document.getElementById(
        "reportEndDate"
    );

const employeeFilter =
    document.getElementById(
        "employeeFilter"
    );

const departmentFilter =
    document.getElementById(
        "departmentFilter"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

    const workLocationFilter =
    document.getElementById(
        "workLocationFilter"
    );

const generateReportButton =
    document.getElementById(
        "generateReportButton"
    );

const exportCsvButton =
    document.getElementById(
        "exportCsvButton"
    );

const printReportButton =
    document.getElementById(
        "printReportButton"
    );

const reportTableBody =
    document.getElementById(
        "reportTableBody"
    );

const totalRecords =
    document.getElementById(
        "totalRecords"
    );

const onTimeCount =
    document.getElementById(
        "onTimeCount"
    );

const lateCount =
    document.getElementById(
        "lateCount"
    );

const absentCount =
    document.getElementById(
        "absentCount"
    );

    const currentlyAtWorkCount =
    document.getElementById(
        "currentlyAtWorkCount"
    );

const checkedOutCount =
    document.getElementById(
        "checkedOutCount"
    );

const earlyExitCount =
    document.getElementById(
        "earlyExitCount"
    );

    const officeDaysCount =
    document.getElementById(
        "officeDaysCount"
    );

const remoteDaysCount =
    document.getElementById(
        "remoteDaysCount"
    );

const totalHoursWorked =
    document.getElementById(
        "totalHoursWorked"
    );

const averageHoursPerDay =
    document.getElementById(
        "averageHoursPerDay"
    );

const attendanceRate =
    document.getElementById(
        "attendanceRate"
    );

    const statusBreakdown =
    document.getElementById(
        "statusBreakdown"
    );

    const departmentBreakdown =
    document.getElementById(
        "departmentBreakdown"
    );

    const employeePerformanceSummary =
    document.getElementById(
        "employeePerformanceSummary"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

    const sectionToggleButtons =
    document.querySelectorAll(
        ".section-toggle-btn"
    );

    const reportPagination =
    document.getElementById(
        "reportPagination"
    );

const reportPageInfo =
    document.getElementById(
        "reportPageInfo"
    );

const previousReportPageButton =
    document.getElementById(
        "previousReportPageButton"
    );

const nextReportPageButton =
    document.getElementById(
        "nextReportPageButton"
    );


// =====================================
// Current Report Records
// =====================================

let currentReportRecords = [];

let consecutiveLateThreshold =
    3;

    let frequentEarlyExitThreshold =
    3;

    let shortWorkdayHours =
    6;

    let standardWorkStartTime =
    "08:00";

let unpaidBreakMinutes =
    30;

let currentReportPage =
    1;

const REPORT_RECORDS_PER_PAGE =
    6;


// =====================================
// Initialize Reports Page
// =====================================

initializeReportsPage();

function initializeReportsPage() {

    if (!protectPage("reports")) {
        return;
    }

    applySidebarPermissions();

    setDefaultDates();

    loadEmployeeFilter();

    loadDepartmentFilter();

    loadReportSettings();

    if (generateReportButton) {

        generateReportButton.addEventListener(
            "click",
            generateReport
        );

    }

    if (exportCsvButton) {

        exportCsvButton.addEventListener(
            "click",
            exportReportToCsv
        );

    }

    if (printReportButton) {

        printReportButton.addEventListener(
            "click",
            printReport
        );

    }

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutAdministrator
        );

    }

    

// =====================================
// Report Pagination Buttons
// =====================================

if (
    previousReportPageButton
) {

    previousReportPageButton.addEventListener(
        "click",
        function () {

            if (
                currentReportPage >
                1
            ) {

                currentReportPage--;

                displayReport(
                    currentReportRecords
                );

            }

        }
    );

}


if (
    nextReportPageButton
) {

    nextReportPageButton.addEventListener(
        "click",
        function () {

            const totalPages =
                Math.ceil(
                    currentReportRecords.length /
                    REPORT_RECORDS_PER_PAGE
                );

            if (
                currentReportPage <
                totalPages
            ) {

                currentReportPage++;

                displayReport(
                    currentReportRecords
                );

            }

        }
    );

}

}



// =====================================
// Load Report Settings
// =====================================

async function loadReportSettings() {

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

        if (
            !settingsSnapshot.exists()
        ) {

            return;

        }

        const settings =
            settingsSnapshot.data();

        consecutiveLateThreshold =
            Number(
                settings.consecutiveLateThreshold ??
                3
            );

            frequentEarlyExitThreshold =
    Number(
        settings.frequentEarlyExitThreshold ??
        3
    );

        if (
            !Number.isFinite(
                consecutiveLateThreshold
            )
            ||
            consecutiveLateThreshold <
            1
        ) {

            consecutiveLateThreshold =
                3;

        }

        shortWorkdayHours =
    Number(
        settings.shortWorkdayHours ??
        6
    );

    standardWorkStartTime =
    String(
        settings.standardStartTime ??
        "08:00"
    );

    unpaidBreakMinutes =
    Number(
        settings.unpaidBreakMinutes ??
        30
    );

if (
    !Number.isFinite(
        unpaidBreakMinutes
    )
    ||
    unpaidBreakMinutes <
    0
) {

    unpaidBreakMinutes =
        30;

}

        if (
    !Number.isFinite(
        frequentEarlyExitThreshold
    )
    ||
    frequentEarlyExitThreshold <
    1
) {

    frequentEarlyExitThreshold =
        3;

}

if (
    !Number.isFinite(
        shortWorkdayHours
    )
    ||
    shortWorkdayHours <=
    0
) {

    shortWorkdayHours =
        6;
        

}



    } catch (
    error
) {

    console.error(
        "Unable to load report settings:",
        error
    );

    consecutiveLateThreshold =
    3;

frequentEarlyExitThreshold =
    3;

shortWorkdayHours =
    6;

standardWorkStartTime =
    "08:00";

unpaidBreakMinutes =
    30;

}

}

// =====================================
// Collapsible Sections
// =====================================

sectionToggleButtons.forEach(
    function (
        button
    ) {

        button.addEventListener(
            "click",
            toggleReportSection
        );

    }
);




// =====================================
// Toggle Report Section
// =====================================

function toggleReportSection(
    event
) {

    const button =
        event.currentTarget;

    const targetId =
        button.dataset.target;

    const content =
        document.getElementById(
            targetId
        );

    if (
        !content
    ) {

        return;

    }

    const isCollapsed =
        content.classList.toggle(
            "collapsed"
        );

    button.textContent =
        isCollapsed
            ?
            "Expand"
            :
            "Collapse";

    button.setAttribute(
        "aria-expanded",
        String(
            !isCollapsed
        )
    );

}


// =====================================
// Default Report Dates
// =====================================

function setDefaultDates() {

    const today =
        new Date();

    const firstDay =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

    startDateInput.value =
        formatLocalDate(firstDay);

    endDateInput.value =
        formatLocalDate(today);

}


// =====================================
// Format Local Date
// =====================================

function formatLocalDate(date) {

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
// Load Employee Filter
// =====================================

async function loadEmployeeFilter() {

    if (!employeeFilter) {
        return;
    }

    employeeFilter.innerHTML = `
        <option value="">
            Loading employees...
        </option>
    `;

    try {

        const employeeSnapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );

        const employees =
            employeeSnapshot.docs.map(
                (employeeDocument) => ({
                    id:
                        employeeDocument.id,

                    ...employeeDocument.data()
                })
            );

        employees.sort(
            (firstEmployee, secondEmployee) =>
                String(
                    firstEmployee.name ?? ""
                ).localeCompare(
                    String(
                        secondEmployee.name ?? ""
                    )
                )
        );

        employeeFilter.innerHTML = `
            <option value="">
                All Employees
            </option>
        `;

        employees.forEach(
            (employee) => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    employee.employeeNumber ?? "";

                option.textContent =
                    `${employee.employeeNumber ?? "-"} - ${employee.name ?? "Unnamed Employee"}`;

                employeeFilter.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Employee filter error:",
            error
        );

        employeeFilter.innerHTML = `
            <option value="">
                Unable to load employees
            </option>
        `;

    }

}


// =====================================
// Load Department Filter
// =====================================

async function loadDepartmentFilter() {

    if (!departmentFilter) {
        return;
    }

    departmentFilter.innerHTML = `
        <option value="">
            Loading departments...
        </option>
    `;

    try {

        const employeeSnapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );

        const departments =
            new Set();

        employeeSnapshot.forEach(
            (employeeDocument) => {

                const employeeData =
                    employeeDocument.data();

                const department =
                    String(
                        employeeData.department ?? ""
                    ).trim();

                if (department !== "") {

                    departments.add(
                        department
                    );

                }

            }
        );

        const sortedDepartments =
            Array.from(
                departments
            ).sort(
                (firstDepartment, secondDepartment) =>
                    firstDepartment.localeCompare(
                        secondDepartment
                    )
            );

        departmentFilter.innerHTML = `
            <option value="">
                All Departments
            </option>
        `;

        sortedDepartments.forEach(
            (department) => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    department;

                option.textContent =
                    department;

                departmentFilter.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Department filter error:",
            error
        );

        departmentFilter.innerHTML = `
            <option value="">
                Unable to load departments
            </option>
        `;

    }

}


// =====================================
// Generate Report
// =====================================

async function generateReport() {

    const startDate =
        startDateInput.value;

    const endDate =
        endDateInput.value;

    const selectedEmployee =
        employeeFilter.value;

    const selectedDepartment =
        departmentFilter.value;

    const selectedStatus =
        statusFilter.value;

        const selectedWorkLocation =
    workLocationFilter
        ?
        workLocationFilter.value
        :
        "";


    if (
        !startDate ||
        !endDate
    ) {

        showTableMessage(
            "Please select both a start date and an end date."
        );

        resetSummaryCards();

        return;

    }


    if (startDate > endDate) {

        showTableMessage(
            "The start date cannot be after the end date."
        );

        resetSummaryCards();

        return;

    }


    setGenerateButtonState(
        true
    );

    showTableMessage(
        "Loading attendance records..."
    );


    try {

        const attendanceQuery =
            query(
                collection(
                    db,
                    "attendance"
                ),
                where(
                    "dateKey",
                    ">=",
                    startDate
                ),
                where(
                    "dateKey",
                    "<=",
                    endDate
                ),
                orderBy(
                    "dateKey",
                    "desc"
                )
            );

        const attendanceSnapshot =
            await getDocs(
                attendanceQuery
            );

        let records =
            attendanceSnapshot.docs.map(
                (attendanceDocument) => ({
                    id:
                        attendanceDocument.id,

                    ...attendanceDocument.data()
                })
            );


        if (selectedEmployee !== "") {

            records =
                records.filter(
                    (record) =>
                        String(
                            record.employeeNumber ?? ""
                        ) ===
                        selectedEmployee
                );

        }


        if (selectedDepartment !== "") {

            records =
                records.filter(
                    (record) =>
                        String(
                            record.department ?? ""
                        ).trim() ===
                        selectedDepartment
                );

        }


        if (selectedStatus !== "") {

            records =
                records.filter(
                    (record) =>
                        normalizeStatus(
                            record.status
                        ) ===
                        normalizeStatus(
                            selectedStatus
                        )
                );

        }

        if (
    selectedWorkLocation !==
    ""
) {

    records =
        records.filter(
            (record) => {

                const recordWorkLocation =
                    String(
                        record.workLocation ??
                        "Office"
                    ).trim()
                    ||
                    "Office";

                return (
                    recordWorkLocation ===
                    selectedWorkLocation
                );

            }
        );

}


        currentReportRecords =
    records;

currentReportPage =
    1;

displayReport(
    records
);
    } catch (error) {

        console.error(
            "Report error:",
            error
        );

        currentReportRecords =
            [];

        showTableMessage(
            "The report could not be loaded. Check the browser console."
        );

        resetSummaryCards();

    } finally {

        setGenerateButtonState(
            false
        );

    }

}


// =====================================
// Generate Button State
// =====================================

function setGenerateButtonState(
    loading
) {

    if (!generateReportButton) {
        return;
    }

    generateReportButton.disabled =
        loading;

    generateReportButton.textContent =
        loading
            ? "Generating..."
            : "Generate Report";

}

// =====================================
// Calculate Paid Leave Credit Minutes
// =====================================

function calculatePaidLeaveCreditMinutes(
    record
) {

    if (
        !record
    ) {

        return 0;

    }


    const status =
        normalizeStatus(
            record.status
        );


    // =====================================
    // Unpaid / Non-Credited Statuses
    // =====================================

    if (
        status ===
            "unpaid leave"
        ||
        status ===
            "absent"
    ) {

        return 0;

    }


    // =====================================
    // Paid Leave Statuses
    // =====================================

    const paidLeaveStatuses = [
        "annual leave",
        "sick leave",
        "family responsibility leave",
        "maternity leave"
    ];


    const isPublicHoliday =
        status ===
        "public holiday";


    const isPaidLeave =
        paidLeaveStatuses.includes(
            status
        );


    if (
        !isPaidLeave
        &&
        !isPublicHoliday
    ) {

        return 0;

    }


    // =====================================
    // Standard Paid Workday
    // =====================================
    //
    // 08:00 - 16:30
    // less 30-minute unpaid break
    // = 8 paid hours / 480 minutes.
    // =====================================

    const standardPaidDayMinutes =
        480;


    // Public Holidays and Maternity Leave
    // are treated as full paid days.

    if (
        isPublicHoliday
        ||
        status ===
            "maternity leave"
    ) {

        return standardPaidDayMinutes;

    }


    // =====================================
    // Leave Duration
    // =====================================

    const leaveDuration =
        String(
            record.leaveDuration ??
            "full-day"
        )
            .trim()
            .toLowerCase();


    // =====================================
    // Full-Day Paid Leave
    // =====================================

    if (
        leaveDuration ===
            "full-day"
        ||
        leaveDuration ===
            ""
    ) {

        return standardPaidDayMinutes;

    }


    // =====================================
    // Actual Worked Minutes
    // =====================================
    //
    // Partial paid leave only credits the
    // missing portion of the normal day.
    // =====================================

    const totalWorkedMinutes =
        calculateReportWorkedMinutes(
            record
        );


    let afterHoursMinutes =
        Number(
            record.afterHoursWorkedMinutes ??
            0
        );


    if (
        !Number.isFinite(
            afterHoursMinutes
        )
        ||
        afterHoursMinutes <
            0
    ) {

        afterHoursMinutes =
            0;

    }


    if (
        afterHoursMinutes ===
            0
        &&
        Array.isArray(
            record.afterHoursSessions
        )
    ) {

        afterHoursMinutes =
            record.afterHoursSessions.reduce(
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

    }


    const normalWorkedMinutes =
        totalWorkedMinutes ===
            null
            ?
            0
            :
            Math.max(
                0,
                totalWorkedMinutes -
                afterHoursMinutes
            );


    // =====================================
    // Half-Day / Custom Paid Leave
    // =====================================

    if (
        leaveDuration ===
            "half-day"
        ||
        leaveDuration ===
            "custom"
    ) {

        return Math.max(
            0,
            standardPaidDayMinutes -
            normalWorkedMinutes
        );

    }


    return 0;

}

// =====================================
// Calculate Worked Minutes
// =====================================

function calculateReportWorkedMinutes(
    record
) {

    // =====================================
    // Attendance Status
    // =====================================

    const status =
        normalizeStatus(
            record.status
        );


    // =====================================
// Leave Duration
// =====================================

const leaveDuration =
    String(
        record.leaveDuration ??
        ""
    )
        .trim()
        .toLowerCase();


const partialLeaveStatuses = [
    "annual leave",
    "sick leave",
    "family responsibility leave",
    "unpaid leave"
];


const isPartialLeave =
    partialLeaveStatuses.includes(
        status
    )
    &&
    (
        leaveDuration ===
            "half-day"
        ||
        leaveDuration ===
            "custom"
    );


// =====================================
// Non-Working Statuses
// =====================================

const nonWorkingStatuses = [
    "annual leave",
    "sick leave",
    "family responsibility leave",
    "maternity leave",
    "unpaid leave",
    "public holiday",
    "absent"
];


if (
    nonWorkingStatuses.includes(
        status
    )
    &&
    !isPartialLeave
) {

    return null;

}


    // =====================================
    // After-Hours Worked Minutes
    // =====================================

    let afterHoursWorkedMinutes =
        Number(
            record.afterHoursWorkedMinutes ??
            0
        );


    if (
        !Number.isFinite(
            afterHoursWorkedMinutes
        )
        ||
        afterHoursWorkedMinutes <
        0
    ) {

        afterHoursWorkedMinutes =
            0;

    }


    // =====================================
    // After-Hours Sessions Fallback
    // =====================================
    //
    // Older attendance records may contain
    // afterHoursSessions but may not yet have
    // afterHoursWorkedMinutes stored.
    // =====================================

    if (
        afterHoursWorkedMinutes ===
        0
        &&
        Array.isArray(
            record.afterHoursSessions
        )
    ) {

        afterHoursWorkedMinutes =
            record.afterHoursSessions.reduce(
                function (
                    total,
                    session
                ) {

                    const sessionWorkedMinutes =
                        Number(
                            session?.workedMinutes ??
                            0
                        );


                    if (
                        !Number.isFinite(
                            sessionWorkedMinutes
                        )
                        ||
                        sessionWorkedMinutes <
                        0
                    ) {

                        return total;

                    }


                    return (
                        total +
                        Math.floor(
                            sessionWorkedMinutes
                        )
                    );

                },
                0
            );

    }


    // =====================================
    // Normal Shift Worked Minutes
    // =====================================

    let normalWorkedMinutes =
        null;


    const checkInTimestamp =
        record.checkInTimestamp ??
        record.scanTimestamp;


    const checkOutTimestamp =
        record.checkOutTimestamp;


    // =====================================
    // Preferred Firebase Timestamp Method
    // =====================================

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


        const standardStartHour =
            Number.isFinite(
                standardStartParts[0]
            )
                ?
                standardStartParts[0]
                :
                8;


        const standardStartMinute =
            Number.isFinite(
                standardStartParts[1]
            )
                ?
                standardStartParts[1]
                :
                0;


        const standardStartDate =
            new Date(
                actualCheckInDate
            );


        standardStartDate.setHours(
            standardStartHour,
            standardStartMinute,
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

            const elapsedMinutes =
                Math.floor(
                    differenceMilliseconds /
                    60000
                );


            normalWorkedMinutes =
                elapsedMinutes;


            // =====================================
            // Deduct Unpaid Break
            // =====================================

            if (
                elapsedMinutes >=
                360
            ) {

                normalWorkedMinutes =
                    Math.max(
                        0,
                        elapsedMinutes -
                        unpaidBreakMinutes
                    );

            }

        }

    }


    // =====================================
    // Fallback To Stored Times
    // =====================================

    if (
        normalWorkedMinutes ===
        null
        &&
        record.time
        &&
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
            2
            &&
            checkOutParts.length >=
            2
            &&
            !checkInParts.some(
                Number.isNaN
            )
            &&
            !checkOutParts.some(
                Number.isNaN
            )
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


            const standardStartHour =
                Number.isFinite(
                    standardStartParts[0]
                )
                    ?
                    standardStartParts[0]
                    :
                    8;


            const standardStartMinute =
                Number.isFinite(
                    standardStartParts[1]
                )
                    ?
                    standardStartParts[1]
                    :
                    0;


            const standardStartMinutes =
                (
                    standardStartHour *
                    60
                )
                +
                standardStartMinute;


            const effectiveCheckInMinutes =
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


            const elapsedMinutes =
                checkOutMinutes -
                effectiveCheckInMinutes;


            if (
                elapsedMinutes >=
                0
            ) {

                normalWorkedMinutes =
                    elapsedMinutes;


                // =====================================
                // Deduct Unpaid Break
                // =====================================

                if (
                    elapsedMinutes >=
                    360
                ) {

                    normalWorkedMinutes =
                        Math.max(
                            0,
                            elapsedMinutes -
                            unpaidBreakMinutes
                        );

                }

            }

        }

    }


    // =====================================
    // No Normal Shift Available
    // =====================================

    if (
        normalWorkedMinutes ===
        null
    ) {

        if (
            afterHoursWorkedMinutes >
            0
        ) {

            return afterHoursWorkedMinutes;

        }


        return null;

    }


    // =====================================
    // Normal + After-Hours Total
    // =====================================

    return (
        normalWorkedMinutes +
        afterHoursWorkedMinutes
    );

}


// =====================================
// Format Minutes As Hours
// =====================================

function formatMinutesAsHours(
    totalMinutes
) {

    if (
        !Number.isFinite(
            totalMinutes
        )
        ||
        totalMinutes <
        0
    ) {

        return "0h 00m";

    }

    const hours =
        Math.floor(
            totalMinutes /
            60
        );

    const minutes =
        Math.round(
            totalMinutes %
            60
        );

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
// Calculate Hours Worked
// =====================================

// =====================================
// Calculate Hours Worked
// =====================================

function calculateReportHoursWorked(
    record
) {

    if (
        !record.checkOutTime
    ) {

        return "In progress";

    }


    const workedMinutes =
        calculateReportWorkedMinutes(
            record
        );


    if (
        workedMinutes ===
        null
    ) {

        return "Not available";

    }


    return formatMinutesAsHours(
        workedMinutes
    );

}

// =====================================
// Format Leave Duration
// =====================================

function formatReportLeaveDuration(
    value
) {

    switch (
        String(
            value ??
            ""
        ).trim()
    ) {

        case "full-day":

            return "Full Day";

        case "half-day":

            return "Half Day";

        case "custom":

            return "Custom Time";

        default:

            return "-";

    }

}


// =====================================
// Display Report
// =====================================

function displayReport(
    records
) {

    reportTableBody.innerHTML =
        "";

    if (
        records.length ===
        0
    ) {

        showTableMessage(
            "No attendance records were found for that date range."
        );

        resetSummaryCards();

        return;

    }

    // =====================================
// Report Pagination
// =====================================

const totalPages =
    Math.ceil(
        records.length /
        REPORT_RECORDS_PER_PAGE
    );


if (
    currentReportPage >
    totalPages
) {

    currentReportPage =
        totalPages;

}


if (
    currentReportPage <
    1
) {

    currentReportPage =
        1;

}

// =====================================
// Update Pagination Controls
// =====================================

if (
    reportPagination &&
    reportPageInfo &&
    previousReportPageButton &&
    nextReportPageButton
) {

    reportPagination.hidden =
        totalPages <=
        1;

    reportPageInfo.textContent =
        `Page ${currentReportPage} of ${totalPages}`;

    previousReportPageButton.disabled =
        currentReportPage <=
        1;

    nextReportPageButton.disabled =
        currentReportPage >=
        totalPages;

}


const startIndex =
    (
        currentReportPage -
        1
    ) *
    REPORT_RECORDS_PER_PAGE;


const endIndex =
    startIndex +
    REPORT_RECORDS_PER_PAGE;


const pageRecords =
    records.slice(
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

            const recordStatus =
    normalizeStatus(
        record.status
    );

const reportLeaveDuration =
    String(
        record.leaveDuration ??
        ""
    )
        .trim()
        .toLowerCase();


const reportPartialLeaveStatuses = [
    "annual leave",
    "sick leave",
    "family responsibility leave",
    "unpaid leave"
];


const isPartialLeave =
    reportPartialLeaveStatuses.includes(
        recordStatus
    )
    &&
    (
        reportLeaveDuration ===
            "half-day"
        ||
        reportLeaveDuration ===
            "custom"
    );


const isLeaveRecord =
    (
        recordStatus ===
            "annual leave"
        ||
        recordStatus ===
            "sick leave"
        ||
        recordStatus ===
            "maternity leave"
        ||
        recordStatus ===
            "family responsibility leave"
        ||
        recordStatus ===
            "unpaid leave"
        ||
        recordStatus ===
            "public holiday"
    )
    &&
    !isPartialLeave;


const checkInTime =
    isLeaveRecord
        ?
        "N/A"
        :
        (
            record.time ??
            "-"
        );


const checkOutTime =
    isLeaveRecord
        ?
        "N/A"
        :
        (
            record.checkOutTime ??
            "Still at work"
        );


const hoursWorked =
    isLeaveRecord
        ?
        "N/A"
        :
        calculateReportHoursWorked(
            record
        );

                const workLocation =
    isLeaveRecord
        ?
        "Out of Office"
        :
        (
            String(
                record.workLocation ??
                "Office"
            ).trim()
            ||
            "Office"
        );

            const isLate =
                normalizeStatus(
                    record.status
                ) ===
                "late";

            const isEarlyExit =
                record.earlyExit ===
                true;

            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        formatReportDate(
                            record.dateKey ??
                            record.date
                        )
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
                        record.name ??
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
        workLocation
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

                    <span
                        class="status-badge ${statusClass}"
                    >
                        ${escapeHtml(
                            record.status ??
                            "Unknown"
                        )}
                    </span>

                </td>

                <td>
    ${escapeHtml(
        formatReportLeaveDuration(
            record.leaveDuration
        )
    )}
</td>

                <td>
                    ${
                        isLate
                            ?
                            escapeHtml(
                                record.lateReason ??
                                "No reason recorded"
                            )
                            :
                            "-"
                    }
                </td>

                <td>
                    ${
                        record.checkOutTime
                            ?
                            isEarlyExit
                                ?
                                "Yes"
                                :
                                "No"
                            :
                            "-"
                    }
                </td>

                <td>
                    ${
                        isEarlyExit
                            ?
                            escapeHtml(
                                record.earlyExitReason ??
                                "No reason recorded"
                            )
                            :
                            "-"
                    }
                </td>

            `;

            reportTableBody.appendChild(
                row
            );

        }
    );

    updateSummaryCards(
        records
    );

    updateStatusBreakdown(
    records
);

updateDepartmentBreakdown(
    records
);

updateEmployeePerformanceSummary(
    records
);

}


// =====================================
// Update Summary Cards
// =====================================

function updateSummaryCards(
    records
) {

    const total =
        records.length;


    // =====================================
    // Attendance Status Counts
    // =====================================

    const onTime =
        records.filter(
            function (
                record
            ) {

                return (
                    normalizeStatus(
                        record.status
                    ) ===
                    "on time"
                );

            }
        ).length;


    const late =
        records.filter(
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
        ).length;


    const absent =
        records.filter(
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
        ).length;


    // =====================================
    // Check-Out Information
    // =====================================

    const checkedOut =
        records.filter(
            function (
                record
            ) {

                return Boolean(
                    record.checkOutTime
                );

            }
        ).length;


    const currentlyAtWork =
        records.filter(
            function (
                record
            ) {

                const status =
                    normalizeStatus(
                        record.status
                    );

                const attendanceStatus =
                    (
                        status ===
                            "on time" ||
                        status ===
                            "late" ||
                        status ===
                            "checked in"
                    );

                return (
                    attendanceStatus &&
                    !record.checkOutTime
                );

            }
        ).length;


    const earlyExits =
        records.filter(
            function (
                record
            ) {

                return (
                    record.earlyExit ===
                    true
                );

            }
        ).length;

        const officeDays =
    records.filter(
        function (
            record
        ) {

            const workLocation =
                String(
                    record.workLocation ??
                    "Office"
                ).trim()
                ||
                "Office";

            return (
                workLocation ===
                "Office"
            );

        }
    ).length;

const remoteDays =
    records.filter(
        function (
            record
        ) {

            const workLocation =
                String(
                    record.workLocation ??
                    "Office"
                ).trim()
                ||
                "Office";

            return (
                workLocation ===
                "Remote"
            );

        }
    ).length;


    // =====================================
// Hours Worked + Paid Leave Credit
// =====================================

let totalWorkedMinutes =
    0;

let totalPaidLeaveMinutes =
    0;

let completedWorkdays =
    0;


records.forEach(
    function (
        record
    ) {

        const workedMinutes =
            calculateReportWorkedMinutes(
                record
            );


        const paidLeaveMinutes =
            calculatePaidLeaveCreditMinutes(
                record
            );

            

        if (
            workedMinutes !==
            null
        ) {

            totalWorkedMinutes +=
                workedMinutes;

        }


        totalPaidLeaveMinutes +=
            paidLeaveMinutes;


        if (
            workedMinutes !==
                null
            ||
            paidLeaveMinutes >
                0
        ) {

            completedWorkdays++;

        }

    }
);

const totalAccountedMinutes =
    totalWorkedMinutes +
    totalPaidLeaveMinutes;


    const averageWorkedMinutes =
    completedWorkdays ===
        0
        ?
        0
        :
        Math.round(
            totalAccountedMinutes /
            completedWorkdays
        );


    // =====================================
// Attendance Rate
// =====================================

let excludedPublicHolidays =
    0;

let partialWorkedDays =
    0;


records.forEach(
    function (
        record
    ) {

        const status =
            normalizeStatus(
                record.status
            );


        if (
            status ===
            "public holiday"
        ) {

            excludedPublicHolidays++;

            return;

        }


        const leaveDuration =
            String(
                record.leaveDuration ??
                ""
            )
                .trim()
                .toLowerCase();


        const partialLeaveStatuses = [
            "annual leave",
            "sick leave",
            "family responsibility leave",
            "unpaid leave"
        ];


        const isPartialLeave =
            partialLeaveStatuses.includes(
                status
            )
            &&
            (
                leaveDuration ===
                    "half-day"
                ||
                leaveDuration ===
                    "custom"
            );


        const workedMinutes =
            calculateReportWorkedMinutes(
                record
            );


        if (
            (
                isPartialLeave
                ||
                status ===
                    "half day"
            )
            &&
            workedMinutes !==
                null
            &&
            workedMinutes >
                0
        ) {

            partialWorkedDays++;

        }

    }
);


const attendanceEligibleDays =
    Math.max(
        0,
        total -
        excludedPublicHolidays
    );


const attendedDays =
    Math.min(
        attendanceEligibleDays,
        onTime +
        late +
        partialWorkedDays
    );


const rate =
    attendanceEligibleDays ===
        0
        ?
        100
        :
        Math.round(
            (
                attendedDays /
                attendanceEligibleDays
            )
            *
            100
        );


    // =====================================
    // Display Values
    // =====================================

    totalRecords.textContent =
        total;

    onTimeCount.textContent =
        onTime;

    lateCount.textContent =
        late;

    absentCount.textContent =
        absent;

    currentlyAtWorkCount.textContent =
        currentlyAtWork;

    checkedOutCount.textContent =
        checkedOut;

    earlyExitCount.textContent =
        earlyExits;

        if (
    officeDaysCount
) {

    officeDaysCount.textContent =
        officeDays;

}

if (
    remoteDaysCount
) {

    remoteDaysCount.textContent =
        remoteDays;

}

    totalHoursWorked.textContent =
    formatMinutesAsHours(
        totalAccountedMinutes
    );

        attendanceRate.textContent =
        `${rate}%`;

}

// =====================================
// Update Status Breakdown
// =====================================

function updateStatusBreakdown(
    records
) {

    if (
        !statusBreakdown
    ) {

        return;

    }

    statusBreakdown.innerHTML =
        "";

    if (
        records.length ===
        0
    ) {

        statusBreakdown.innerHTML = `
            <p class="empty-row">
                No attendance records available.
            </p>
        `;

        return;

    }

    const statusCounts =
        {};

    records.forEach(
        function (
            record
        ) {

            const rawStatus =
                String(
                    record.status ??
                    "Unknown"
                ).trim();

            const status =
                rawStatus ===
                    ""
                    ?
                    "Unknown"
                    :
                    rawStatus;

            if (
                !statusCounts[
                    status
                ]
            ) {

                statusCounts[
                    status
                ] = 0;

            }

            statusCounts[
                status
            ]++;

        }
    );

    const sortedStatuses =
        Object.entries(
            statusCounts
        ).sort(
            function (
                first,
                second
            ) {

                return (
                    second[1] -
                    first[1]
                );

            }
        );

    sortedStatuses.forEach(
        function (
            statusEntry
        ) {

            const [
                status,
                count
            ] =
                statusEntry;

            const percentage =
                (
                    count /
                    records.length
                )
                *
                100;

            const breakdownRow =
                document.createElement(
                    "div"
                );

            breakdownRow.className =
                "status-breakdown-row";

            breakdownRow.innerHTML = `

                <span class="status-breakdown-name">
                    ${escapeHtml(
                        status
                    )}
                </span>

                <span class="status-breakdown-count">
                    ${count}
                </span>

                <span class="status-breakdown-percentage">
                    ${percentage.toFixed(
                        1
                    )}%
                </span>

            `;

            statusBreakdown.appendChild(
                breakdownRow
            );

        }
    );

}

// =====================================
// Update Department Breakdown
// =====================================

function updateDepartmentBreakdown(
    records
) {

    if (
        !departmentBreakdown
    ) {

        return;

    }

    departmentBreakdown.innerHTML =
        "";

    if (
        records.length ===
        0
    ) {

        departmentBreakdown.innerHTML = `
            <p class="empty-row">
                No department data available.
            </p>
        `;

        return;

    }

    const departmentData =
        {};

    records.forEach(
        function (
            record
        ) {

            const department =
                String(
                    record.department ??
                    "Unassigned"
                ).trim() ||
                "Unassigned";

            if (
                !departmentData[
                    department
                ]
            ) {

                departmentData[
    department
] = {

    total:
        0,

    attended:
        0,

    excluded:
        0

};

            }

            departmentData[
                department
            ].total++;

            const status =
                normalizeStatus(
                    record.status
                );

                // =====================================
// Leave Duration
// =====================================

const leaveDuration =
    String(
        record.leaveDuration ??
        ""
    )
        .trim()
        .toLowerCase();


// =====================================
// Partial Leave Statuses
// =====================================

const departmentLeaveStatuses = [
    "annual leave",
    "sick leave",
    "family responsibility leave",
    "unpaid leave"
];


const isPartialLeave =
    departmentLeaveStatuses.includes(
        status
    )
    &&
    (
        leaveDuration ===
            "half-day"
        ||
        leaveDuration ===
            "custom"
    );


// =====================================
// Attendance Rate Exclusions
// =====================================
//
// IMPORTANT:
// Only Public Holidays are excluded.
//
// Full-day employee leave is NOT
// excluded. It therefore lowers the
// attendance percentage.
//
// Partial leave counts as attended
// when the employee actually worked.
// =====================================

if (
    status ===
    "public holiday"
) {

    departmentData[
        department
    ].excluded++;

}


// =====================================
// Worked Minutes
// =====================================

const workedMinutes =
    calculateReportWorkedMinutes(
        record
    );


// =====================================
// Counts As Attended
// =====================================

const countsAsAttended =
    status ===
        "on time"
    ||
    status ===
        "late"
    ||
    (
        isPartialLeave
        &&
        workedMinutes !==
            null
        &&
        workedMinutes >
            0
    )
    ||
    (
        status ===
            "half day"
        &&
        workedMinutes !==
            null
        &&
        workedMinutes >
            0
    );


if (
    countsAsAttended
) {

    departmentData[
        department
    ].attended++;

}

        }
    );

    const departments =
        Object.entries(
            departmentData
        ).sort(
            function (
                first,
                second
            ) {

                return first[0]
                    .localeCompare(
                        second[0]
                    );

            }
        );

    departments.forEach(
        function (
            departmentEntry
        ) {

            const [
                department,
                data
            ] =
                departmentEntry;


                
           const eligibleDays =
    Math.max(
        0,
        data.total -
        data.excluded
    );


const attendancePercentage =
    eligibleDays ===
        0
        ?
        100
        :
        Math.round(
            (
                data.attended /
                eligibleDays
            )
            *
            100
        );

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "department-breakdown-row";

            row.innerHTML = `

                <span class="department-breakdown-name">
                    ${escapeHtml(
                        department
                    )}
                </span>

                <span>
                    ${data.total} records
                </span>

                <span>
                    ${data.attended} attended
                </span>

                <span>
                    ${attendancePercentage}%
                </span>

            `;

            departmentBreakdown.appendChild(
                row
            );

        }
    );

}

// =====================================
// Update Employee Performance Summary
// =====================================

function updateEmployeePerformanceSummary(
    records
) {

    if (
        !employeePerformanceSummary
    ) {

        return;

    }


    employeePerformanceSummary.innerHTML =
        "";


    if (
        !Array.isArray(
            records
        )
        ||
        records.length ===
            0
    ) {

        employeePerformanceSummary.innerHTML = `
            <p class="empty-row">
                No employee performance data available.
            </p>
        `;

        return;

    }


    // =====================================
    // Standard Paid Working Day
    // =====================================
    //
    // 08:00 - 16:30
    // less 30-minute unpaid break
    // = 8 paid hours.
    // =====================================

    const STANDARD_PAID_DAY_MINUTES =
        480;


    // =====================================
    // Get Record After-Hours Minutes
    // =====================================

    function getRecordAfterHoursMinutes(
        record
    ) {

        let minutes =
            Number(
                record.afterHoursWorkedMinutes ??
                0
            );


        if (
            !Number.isFinite(
                minutes
            )
            ||
            minutes <
                0
        ) {

            minutes =
                0;

        }


        // Older records may only contain
        // afterHoursSessions.

        if (
            minutes ===
                0
            &&
            Array.isArray(
                record.afterHoursSessions
            )
        ) {

            minutes =
                record.afterHoursSessions.reduce(
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

        }


        return Math.max(
            0,
            Math.floor(
                minutes
            )
        );

    }


    // =====================================
    // Employee Data
    // =====================================

    const employeeData =
        {};


    // =====================================
    // Process Attendance Records
    // =====================================

    records.forEach(
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


            // =====================================
            // Create Employee
            // =====================================

            if (
                !employeeData[
                    employeeKey
                ]
            ) {

                employeeData[
                    employeeKey
                ] = {

                    employeeNumber:
                        employeeNumber,

                    employeeName:
                        employeeName,

                    total:
                        0,

                    onTime:
                        0,

                    late:
                        0,

                    absent:
                        0,

                    sickLeave:
                        0,

                    annualLeave:
                        0,

                    otherLeave:
                        0,

                    earlyExits:
                        0,

                    actualNormalMinutes:
                        0,

                    paidLeaveMinutes:
                        0,

                    afterHoursMinutes:
                        0,

                    attendanceCredit:
                        0,

                    excludedAttendanceDays:
                        0

                };

            }


            const data =
                employeeData[
                    employeeKey
                ];


            data.total++;


            // =====================================
            // Status
            // =====================================

            const status =
                normalizeStatus(
                    record.status
                );


            // =====================================
            // Leave Duration
            // =====================================

            const leaveDuration =
                String(
                    record.leaveDuration ??
                    ""
                )
                    .trim()
                    .toLowerCase();


            // =====================================
            // Status Counts
            // =====================================

            if (
                status ===
                    "on time"
            ) {

                data.onTime++;

            }


            if (
                status ===
                    "late"
            ) {

                data.late++;

            }


            if (
                status ===
                    "absent"
            ) {

                data.absent++;

            }


            if (
                status ===
                    "sick leave"
            ) {

                data.sickLeave++;

            }


            if (
                status ===
                    "annual leave"
            ) {

                data.annualLeave++;

            }


            if (
                status ===
                    "maternity leave"
                ||
                status ===
                    "family responsibility leave"
                ||
                status ===
                    "unpaid leave"
                ||
                status ===
                    "medical appointment"
            ) {

                data.otherLeave++;

            }


            if (
                record.earlyExit ===
                true
            ) {

                data.earlyExits++;

            }


            // =====================================
            // Public Holiday
            // =====================================
            //
            // Public holidays provide paid hours
            // but are excluded from attendance %.
            // =====================================

            if (
                status ===
                    "public holiday"
            ) {

                data.excludedAttendanceDays++;

            }


            // =====================================
            // Actual Worked Minutes
            // =====================================

            const totalWorkedMinutes =
                calculateReportWorkedMinutes(
                    record
                );


            // =====================================
            // After-Hours Minutes
            // =====================================

            const recordAfterHoursMinutes =
                getRecordAfterHoursMinutes(
                    record
                );


            data.afterHoursMinutes +=
                recordAfterHoursMinutes;


            // =====================================
            // Actual Normal Minutes
            // =====================================

            const recordNormalWorkedMinutes =
                totalWorkedMinutes ===
                    null
                    ?
                    0
                    :
                    Math.max(
                        0,
                        totalWorkedMinutes -
                        recordAfterHoursMinutes
                    );


            data.actualNormalMinutes +=
                recordNormalWorkedMinutes;


            // =====================================
            // Paid Leave Credit
            // =====================================

            let paidLeaveMinutes =
                calculatePaidLeaveCreditMinutes(
                    record
                );


            if (
                !Number.isFinite(
                    paidLeaveMinutes
                )
                ||
                paidLeaveMinutes <
                    0
            ) {

                paidLeaveMinutes =
                    0;

            }


            // =====================================
            // Standalone Half Day
            // =====================================
            //
            // The standalone Half Day status must
            // behave like other paid half-day
            // records unless explicitly unpaid.
            // =====================================

            if (
                status ===
                    "half day"
            ) {

                paidLeaveMinutes =
                    Math.max(
                        0,
                        STANDARD_PAID_DAY_MINUTES -
                        recordNormalWorkedMinutes
                    );

            }


            // =====================================
            // Unpaid Leave
            // =====================================
            //
            // Unpaid leave NEVER receives paid
            // leave credit.
            // =====================================

            if (
                status ===
                    "unpaid leave"
            ) {

                paidLeaveMinutes =
                    0;

            }


            // =====================================
            // Absence
            // =====================================

            if (
                status ===
                    "absent"
            ) {

                paidLeaveMinutes =
                    0;

            }


            data.paidLeaveMinutes +=
                paidLeaveMinutes;


            // =====================================
            // Attendance Credit
            // =====================================
            //
            // On Time / Late = 1 full attendance day
            //
            // Half-day/custom leave uses the
            // physical percentage of the normal
            // 8-hour day actually worked.
            //
            // Full-day leave = 0 attendance
            //
            // Public Holiday = excluded entirely
            // =====================================

            if (
                status ===
                    "on time"
                ||
                status ===
                    "late"
            ) {

                data.attendanceCredit +=
                    1;

            } else {

                const partialLeaveStatuses = [
                    "annual leave",
                    "sick leave",
                    "family responsibility leave",
                    "unpaid leave"
                ];


                const isPartialLeave =
                    partialLeaveStatuses.includes(
                        status
                    )
                    &&
                    (
                        leaveDuration ===
                            "half-day"
                        ||
                        leaveDuration ===
                            "custom"
                    );


                const isStandaloneHalfDay =
                    status ===
                    "half day";


                if (
                    (
                        isPartialLeave
                        ||
                        isStandaloneHalfDay
                    )
                    &&
                    recordNormalWorkedMinutes >
                        0
                ) {

                    const attendanceFraction =
                        Math.min(
                            1,
                            recordNormalWorkedMinutes /
                            STANDARD_PAID_DAY_MINUTES
                        );


                    data.attendanceCredit +=
                        attendanceFraction;

                }

            }

        }
    );


    // =====================================
    // Sort Employees
    // =====================================

    const employees =
        Object.values(
            employeeData
        ).sort(
            function (
                first,
                second
            ) {

                return first.employeeName
                    .localeCompare(
                        second.employeeName
                    );

            }
        );


    // =====================================
    // Display Employees
    // =====================================

    employees.forEach(
        function (
            employee
        ) {

            // =====================================
            // Hours
            // =====================================

            const actualNormalMinutes =
                Math.max(
                    0,
                    employee.actualNormalMinutes
                );


            const paidLeaveMinutes =
                Math.max(
                    0,
                    employee.paidLeaveMinutes
                );


            const normalAccountedMinutes =
                actualNormalMinutes +
                paidLeaveMinutes;


            const afterHoursMinutes =
                Math.max(
                    0,
                    employee.afterHoursMinutes
                );


            const totalEmployeeMinutes =
                normalAccountedMinutes +
                afterHoursMinutes;


            // =====================================
            // Attendance Eligible Days
            // =====================================
            //
            // ONLY Public Holidays are excluded.
            //
            // Annual Leave, Sick Leave,
            // Family Responsibility Leave,
            // Maternity Leave, Unpaid Leave and
            // Absence remain in the denominator.
            // =====================================

            const attendanceEligibleDays =
                Math.max(
                    0,
                    employee.total -
                    employee.excludedAttendanceDays
                );


            // =====================================
            // Attendance Percentage
            // =====================================

            const attendancePercentage =
                attendanceEligibleDays ===
                    0
                    ?
                    100
                    :
                    Math.round(
                        (
                            employee.attendanceCredit /
                            attendanceEligibleDays
                        )
                        *
                        100
                    );


            // =====================================
            // Average Accounted Hours / Day
            // =====================================
            //
            // This deliberately uses the eligible
            // working days as the denominator.
            //
            // Paid leave preserves scheduled hours.
            // Unpaid leave reduces the average.
            // Public Holidays are excluded.
            // After-hours are NOT included here.
            // =====================================

            const averageWorkedMinutes =
                attendanceEligibleDays ===
                    0
                    ?
                    0
                    :
                    Math.round(
                        normalAccountedMinutes /
                        attendanceEligibleDays
                    );


            // =====================================
            // Performance Status
            // =====================================

            let performanceStatus =
                "Good";


            let performanceStatusClass =
                "performance-status-good";


            const performanceReasons =
                [];


            const hasLowAverageHours =
                attendanceEligibleDays >
                    0
                &&
                averageWorkedMinutes <
                    (
                        shortWorkdayHours *
                        60
                    );


            const hasWarning =
                attendancePercentage <
                    90
                ||
                employee.late >=
                    consecutiveLateThreshold
                ||
                employee.earlyExits >=
                    frequentEarlyExitThreshold
                ||
                hasLowAverageHours;


            const needsAttention =
                attendancePercentage <
                    80
                ||
                employee.absent >
                    0;


            if (
                attendancePercentage <
                80
            ) {

                performanceReasons.push(
                    "Attendance rate below 80%"
                );

            }


            if (
                employee.absent >
                0
            ) {

                performanceReasons.push(
                    `${employee.absent} absence${employee.absent === 1 ? "" : "s"} recorded`
                );

            }


            if (
                employee.late >=
                consecutiveLateThreshold
            ) {

                performanceReasons.push(
                    `${employee.late} late record${employee.late === 1 ? "" : "s"}`
                );

            }


            if (
                employee.earlyExits >=
                frequentEarlyExitThreshold
            ) {

                performanceReasons.push(
                    `${employee.earlyExits} early exit${employee.earlyExits === 1 ? "" : "s"}`
                );

            }


            if (
                hasLowAverageHours
            ) {

                performanceReasons.push(
                    "Average hours below target"
                );

            }


            if (
                attendancePercentage >=
                    80
                &&
                attendancePercentage <
                    90
            ) {

                performanceReasons.push(
                    "Attendance rate below 90%"
                );

            }


            if (
                needsAttention
            ) {

                performanceStatus =
                    "Needs Attention";

                performanceStatusClass =
                    "performance-status-danger";

            } else if (
                hasWarning
            ) {

                performanceStatus =
                    "Watch";

                performanceStatusClass =
                    "performance-status-watch";

            }


            // =====================================
            // Employee Row
            // =====================================

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "employee-performance-row";


            row.innerHTML = `

                <!-- 1. Employee -->

                <span class="employee-performance-name">

                    ${escapeHtml(
                        employee.employeeName
                    )}

                    <small>
                        ${escapeHtml(
                            employee.employeeNumber
                        )}
                    </small>

                </span>


                <!-- 2. Records -->

                <span>
                    ${employee.total}
                </span>


                <!-- 3. On Time -->

                <span>
                    ${employee.onTime}
                </span>


                <!-- 4. Late -->

                <span
                    class="${
                        employee.late >=
                        consecutiveLateThreshold
                            ?
                            "performance-warning-cell"
                            :
                            ""
                    }"
                >
                    ${employee.late}
                </span>


                <!-- 5. Absent -->

                <span
                    class="${
                        employee.absent >
                        0
                            ?
                            "performance-danger-cell"
                            :
                            ""
                    }"
                >
                    ${employee.absent}
                </span>


                <!-- 6. Sick Leave -->

                <span>
                    ${employee.sickLeave}
                </span>


                <!-- 7. Annual Leave -->

                <span>
                    ${employee.annualLeave}
                </span>


                <!-- 8. Other Leave -->

                <span>
                    ${employee.otherLeave}
                </span>


                <!-- 9. Early Exits -->

                <span
                    class="${
                        employee.earlyExits >=
                        frequentEarlyExitThreshold
                            ?
                            "performance-warning-cell"
                            :
                            ""
                    }"
                >
                    ${employee.earlyExits}
                </span>


                <!-- 10. Actual Normal Hours -->

                <span>
                    ${escapeHtml(
                        formatMinutesAsHours(
                            actualNormalMinutes
                        )
                    )}
                </span>


                <!-- 11. Paid Leave Hours -->

                <span>
                    ${escapeHtml(
                        formatMinutesAsHours(
                            paidLeaveMinutes
                        )
                    )}
                </span>


                <!-- 12. Normal Accounted Hours -->

                <span>
                    ${escapeHtml(
                        formatMinutesAsHours(
                            normalAccountedMinutes
                        )
                    )}
                </span>


                <!-- 13. After-Hours Worked -->

                <span>
                    ${escapeHtml(
                        formatMinutesAsHours(
                            afterHoursMinutes
                        )
                    )}
                </span>


                <!-- 14. Total Hours -->

                <span>
                    ${escapeHtml(
                        formatMinutesAsHours(
                            totalEmployeeMinutes
                        )
                    )}
                </span>


                <!-- 15. Average Hours / Day -->

                <span
                    class="${
                        hasLowAverageHours
                            ?
                            "performance-warning-cell"
                            :
                            ""
                    }"
                >
                    ${escapeHtml(
                        formatMinutesAsHours(
                            averageWorkedMinutes
                        )
                    )}
                </span>


                <!-- 16. Attendance Rate -->

                <span
                    class="attendance-rate-cell ${getAttendanceRateClass(
                        attendancePercentage
                    )}"
                >
                    ${attendancePercentage}%
                </span>


                <!-- 17. Performance Status -->

                <span
                    class="performance-status-wrapper"
                >

                    <span
                        class="performance-status-cell ${performanceStatusClass}"
                    >
                        ${performanceStatus}
                    </span>

                    <span class="performance-status-tooltip">

                        ${
                            performanceReasons.length >
                            0
                                ?
                                performanceReasons
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
                                    .join("")
                                :
                                `
                                    <span>
                                        No performance concerns detected
                                    </span>
                                `
                        }

                    </span>

                </span>

            `;


            employeePerformanceSummary.appendChild(
                row
            );

        }
    );

}

// =====================================
// Attendance Rate Class
// =====================================

function getAttendanceRateClass(
    attendancePercentage
) {

    if (
        attendancePercentage >=
        90
    ) {

        return "attendance-rate-good";

    }

    if (
        attendancePercentage >=
        80
    ) {

        return "attendance-rate-watch";

    }

    return "attendance-rate-poor";

}

    
// =====================================
// Reset Summary Cards
// =====================================

function resetSummaryCards() {

    totalRecords.textContent =
        "0";

    onTimeCount.textContent =
        "0";

    lateCount.textContent =
        "0";

    absentCount.textContent =
        "0";

    currentlyAtWorkCount.textContent =
        "0";

    checkedOutCount.textContent =
        "0";

    earlyExitCount.textContent =
        "0";

    totalHoursWorked.textContent =
        "0h 00m";

    averageHoursPerDay.textContent =
        "0h 00m";

    attendanceRate.textContent =
        "0%";

        if (
    statusBreakdown
) {

    statusBreakdown.innerHTML = `
        <p class="empty-row">
            Generate a report to view the status breakdown.
        </p>
    `;

}

// Reset Department Breakdown

if (
    departmentBreakdown
) {

    departmentBreakdown.innerHTML = `
        <p class="empty-row">
            Generate a report to view the department breakdown.
        </p>
    `;

}

// Reset Employee Performance Summary

if (
    employeePerformanceSummary
) {

    employeePerformanceSummary.innerHTML = `
        <p class="empty-row">
            Generate a report to view employee performance.
        </p>
    `;

}


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
// Format Report Date
// =====================================

function formatReportDate(dateKey) {

    if (!dateKey) {
        return "-";
    }

    const date =
        new Date(
            `${dateKey}T00:00:00`
        );

    return date.toLocaleDateString(
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
// Create Status CSS Class
// =====================================

function createStatusClass(status) {

    return `status-${normalizeStatus(
        status || "unknown"
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
// Show Table Message
// =====================================

function showTableMessage(message) {

    reportTableBody.innerHTML = `
        <tr>

            <td
                colspan="13"
                class="empty-row"
            >
                ${escapeHtml(message)}
            </td>

        </tr>
    `;

}


// =====================================
// Export Report to CSV
// =====================================

function exportReportToCsv() {

    if (
        currentReportRecords.length ===
        0
    ) {

        alert(
            "Please generate a report before exporting."
        );

        return;

    }


    // =====================================
    // CSV Header
    // =====================================

    const csvRows = [
        [
            "Date",
            "Employee Number",
            "Employee Name",
            "Department",
            "Work Location",
            "Check In",
            "Check Out",
            "Hours Worked",
            "After-Hours Worked",
            "Status",
            "Leave Duration",
            "Late Reason",
            "Early Exit",
            "Early Exit Reason"
        ]
    ];


    // =====================================
    // Report Totals
    // =====================================

    let totalWorkedMinutes =
        0;

    let totalAfterHoursWorkedMinutes =
        0;


    // =====================================
    // Add Report Records
    // =====================================

    currentReportRecords.forEach(
        function (
            record
        ) {

            // =====================================
            // Total Hours Worked
            // =====================================

            const workedMinutes =
                calculateReportWorkedMinutes(
                    record
                );


            if (
                workedMinutes !==
                null
            ) {

                totalWorkedMinutes +=
                    workedMinutes;

            }


            // =====================================
            // After-Hours Worked
            // =====================================

            let afterHoursWorkedMinutes =
                Number(
                    record.afterHoursWorkedMinutes ??
                    0
                );


            if (
                !Number.isFinite(
                    afterHoursWorkedMinutes
                )
                ||
                afterHoursWorkedMinutes <
                0
            ) {

                afterHoursWorkedMinutes =
                    0;

            }


            // =====================================
            // Older Record Fallback
            // =====================================

            if (
                afterHoursWorkedMinutes ===
                0
                &&
                Array.isArray(
                    record.afterHoursSessions
                )
            ) {

                afterHoursWorkedMinutes =
                    record.afterHoursSessions.reduce(
                        function (
                            total,
                            session
                        ) {

                            const sessionWorkedMinutes =
                                Number(
                                    session?.workedMinutes ??
                                    0
                                );


                            if (
                                !Number.isFinite(
                                    sessionWorkedMinutes
                                )
                                ||
                                sessionWorkedMinutes <
                                0
                            ) {

                                return total;

                            }


                            return (
                                total +
                                Math.floor(
                                    sessionWorkedMinutes
                                )
                            );

                        },
                        0
                    );

            }


            totalAfterHoursWorkedMinutes +=
                afterHoursWorkedMinutes;


            // =====================================
            // Add CSV Row
            // =====================================

            csvRows.push(
                [

                    formatReportDate(
                        record.dateKey ??
                        record.date
                    ),

                    record.employeeNumber ??
                        "",

                    record.name ??
                        "",

                    record.department ??
                        "",

                    String(
                        record.workLocation ??
                        "Office"
                    ).trim()
                    ||
                    "Office",

                    record.time ??
                        "",

                    record.checkOutTime ??
                        "",

                    calculateReportHoursWorked(
                        record
                    ),

                    formatMinutesAsHours(
                        afterHoursWorkedMinutes
                    ),

                    record.status ??
                        "",

                    formatReportLeaveDuration(
                        record.leaveDuration
                    ),

                    normalizeStatus(
                        record.status
                    ) ===
                    "late"
                        ?
                        record.lateReason ??
                        ""
                        :
                        "",

                    record.checkOutTime
                        ?
                        record.earlyExit ===
                        true
                            ?
                            "Yes"
                            :
                            "No"
                        :
                        "",

                    record.earlyExit ===
                    true
                        ?
                        record.earlyExitReason ??
                        ""
                        :
                        ""

                ]
            );

        }
    );


    // =====================================
    // Calculate Normal Hours
    // =====================================

    const totalNormalWorkedMinutes =
        Math.max(
            0,
            totalWorkedMinutes -
            totalAfterHoursWorkedMinutes
        );


    // =====================================
    // Blank Row Before Summary
    // =====================================

    csvRows.push(
        [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ]
    );


    // =====================================
    // Hours Summary Heading
    // =====================================

    csvRows.push(
        [
            "HOURS SUMMARY",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ]
    );


    // =====================================
    // Total Normal Hours Worked
    // =====================================

    csvRows.push(
        [
            "Total Normal Hours Worked",
            formatMinutesAsHours(
                totalNormalWorkedMinutes
            ),
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ]
    );


    // =====================================
    // Total After-Hours Worked
    // =====================================

    csvRows.push(
        [
            "Total After-Hours Worked",
            formatMinutesAsHours(
                totalAfterHoursWorkedMinutes
            ),
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ]
    );


    // =====================================
    // Grand Total Hours Worked
    // =====================================

    csvRows.push(
        [
            "TOTAL HOURS WORKED",
            formatMinutesAsHours(
                totalWorkedMinutes
            ),
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ]
    );


    // =====================================
    // Create CSV
    // =====================================

    const csvContent =
        csvRows
            .map(
                function (
                    row
                ) {

                    return row
                        .map(
                            escapeCsvValue
                        )
                        .join(";");

                }
            )
            .join("\n");


    // =====================================
    // Create Download
    // =====================================

    const blob =
        new Blob(
            [
                "\uFEFF" +
                csvContent
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const downloadUrl =
        URL.createObjectURL(
            blob
        );


    const downloadLink =
        document.createElement(
            "a"
        );


    downloadLink.href =
        downloadUrl;


    downloadLink.download =
        `attendance-report-${startDateInput.value}-to-${endDateInput.value}.csv`;


    document.body.appendChild(
        downloadLink
    );


    downloadLink.click();


    document.body.removeChild(
        downloadLink
    );


    URL.revokeObjectURL(
        downloadUrl
    );

}


// =====================================
// Escape CSV Value
// =====================================

function escapeCsvValue(value) {

    const safeValue =
        String(
            value ?? ""
        ).replaceAll(
            '"',
            '""'
        );

    return `"${safeValue}"`;

}


// =====================================
// Print Report
// =====================================

function printReport() {

    if (
        currentReportRecords.length ===
        0
    ) {

        alert(
            "Please generate a report before printing."
        );

        return;

    }


    // =====================================
// Report Filter Information
// =====================================

const startDate =
    startDateInput?.value ??
    "";

const endDate =
    endDateInput?.value ??
    "";


// =====================================
// Selected Employee
// =====================================

const selectedEmployeeNumber =
    String(
        employeeFilter?.value ??
        ""
    ).trim();


const isSingleEmployeeReport =
    selectedEmployeeNumber !==
    "";


const selectedEmployeeText =
    employeeFilter &&
    employeeFilter.selectedOptions &&
    employeeFilter.selectedOptions.length >
    0
        ?
        employeeFilter.selectedOptions[0].textContent
        :
        "All Employees";


// =====================================
// Department
// =====================================

let selectedDepartmentText =
    "All Departments";


if (
    isSingleEmployeeReport
) {

    const employeeDepartments =
        [
            ...new Set(
                currentReportRecords
                    .map(
                        function (
                            record
                        ) {

                            return String(
                                record.department ??
                                ""
                            ).trim();

                        }
                    )
                    .filter(
                        function (
                            department
                        ) {

                            return (
                                department !==
                                ""
                            );

                        }
                    )
            )
        ];


    if (
        employeeDepartments.length ===
        1
    ) {

        selectedDepartmentText =
            employeeDepartments[0];

    } else if (
        employeeDepartments.length >
        1
    ) {

        selectedDepartmentText =
            employeeDepartments.join(
                " / "
            );

    } else {

        selectedDepartmentText =
            "Not Assigned";

    }

} else if (
    departmentFilter &&
    departmentFilter.value !==
    ""
) {

    selectedDepartmentText =
        departmentFilter
            .selectedOptions[0]
            ?.textContent ??
        departmentFilter.value;

}


// =====================================
// Work Location
// =====================================

let selectedWorkLocationText =
    "All Locations";


if (
    isSingleEmployeeReport
) {

    const employeeWorkLocations =
        [
            ...new Set(
                currentReportRecords
                    .filter(
                        function (
                            record
                        ) {

                            const status =
                                normalizeStatus(
                                    record.status
                                );


                            const isLeaveRecord =
                                status ===
                                    "annual leave" ||
                                status ===
                                    "sick leave" ||
                                status ===
                                    "maternity leave" ||
                                status ===
                                    "family responsibility leave" ||
                                status ===
                                    "unpaid leave" ||
                                status ===
                                    "public holiday" ||
                                status ===
                                    "absent";


                            return (
                                !isLeaveRecord
                            );

                        }
                    )
                    .map(
                        function (
                            record
                        ) {

                            return (
                                String(
                                    record.workLocation ??
                                    "Office"
                                ).trim()
                                ||
                                "Office"
                            );

                        }
                    )
            )
        ];


    if (
        employeeWorkLocations.length ===
        1
    ) {

        selectedWorkLocationText =
            employeeWorkLocations[0];

    } else if (
        employeeWorkLocations.length >
        1
    ) {

        selectedWorkLocationText =
            employeeWorkLocations.join(
                " / "
            );

    } else {

        selectedWorkLocationText =
            "No Work Location Recorded";

    }

} else if (
    workLocationFilter &&
    workLocationFilter.value !==
    ""
) {

    selectedWorkLocationText =
        workLocationFilter
            .selectedOptions[0]
            ?.textContent ??
        workLocationFilter.value;

}


// =====================================
// Selected Status
// =====================================

const selectedStatusText =
    statusFilter &&
    statusFilter.selectedOptions &&
    statusFilter.selectedOptions.length >
    0
        ?
        statusFilter.selectedOptions[0].textContent
        :
        "All Statuses";


    // =====================================
    // Report Totals
    // =====================================

    let totalWorkedMinutes =
        0;

    let totalAfterHoursWorkedMinutes =
        0;

    let onTimeTotal =
        0;

    let lateTotal =
        0;

    let absentTotal =
        0;

    let leaveTotal =
        0;


    // =====================================
    // Build Report Rows
    // =====================================

    const reportRows =
        currentReportRecords
            .map(
                function (
                    record
                ) {

                    const status =
                        normalizeStatus(
                            record.status
                        );


                    const leaveDurationValue =
    String(
        record.leaveDuration ??
        ""
    )
        .trim()
        .toLowerCase();


const partialLeaveStatuses = [
    "annual leave",
    "sick leave",
    "family responsibility leave",
    "unpaid leave"
];


const isPartialLeave =
    partialLeaveStatuses.includes(
        status
    )
    &&
    (
        leaveDurationValue ===
            "half-day"
        ||
        leaveDurationValue ===
            "custom"
    );


const isLeaveRecord =
    (
        status ===
            "annual leave"
        ||
        status ===
            "sick leave"
        ||
        status ===
            "maternity leave"
        ||
        status ===
            "family responsibility leave"
        ||
        status ===
            "unpaid leave"
        ||
        status ===
            "public holiday"
    )
    &&
    !isPartialLeave;


                    // =====================================
                    // Attendance Counters
                    // =====================================

                    if (
                        status ===
                        "on time"
                    ) {

                        onTimeTotal++;

                    }


                    if (
                        status ===
                        "late"
                    ) {

                        lateTotal++;

                    }


                    if (
                        status ===
                        "absent"
                    ) {

                        absentTotal++;

                    }


                    if (
                        isLeaveRecord
                    ) {

                        leaveTotal++;

                    }


                    // =====================================
                    // Worked Minutes
                    // =====================================

                    const workedMinutes =
                        calculateReportWorkedMinutes(
                            record
                        );


                    if (
                        workedMinutes !==
                        null
                    ) {

                        totalWorkedMinutes +=
                            workedMinutes;

                    }


                    // =====================================
                    // After-Hours Minutes
                    // =====================================

                    let afterHoursWorkedMinutes =
                        Number(
                            record.afterHoursWorkedMinutes ??
                            0
                        );


                    if (
                        !Number.isFinite(
                            afterHoursWorkedMinutes
                        )
                        ||
                        afterHoursWorkedMinutes <
                        0
                    ) {

                        afterHoursWorkedMinutes =
                            0;

                    }


                    // =====================================
                    // Older Record Fallback
                    // =====================================

                    if (
                        afterHoursWorkedMinutes ===
                        0
                        &&
                        Array.isArray(
                            record.afterHoursSessions
                        )
                    ) {

                        afterHoursWorkedMinutes =
                            record.afterHoursSessions.reduce(
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

                    }


                    totalAfterHoursWorkedMinutes +=
                        afterHoursWorkedMinutes;


                    // =====================================
                    // Display Values
                    // =====================================

                    const checkInTime =
                        isLeaveRecord
                            ?
                            "N/A"
                            :
                            (
                                record.time ??
                                "-"
                            );


                    const checkOutTime =
                        isLeaveRecord
                            ?
                            "N/A"
                            :
                            (
                                record.checkOutTime ??
                                "Still at work"
                            );


                    const hoursWorked =
                        isLeaveRecord
                            ?
                            "N/A"
                            :
                            calculateReportHoursWorked(
                                record
                            );


                    const afterHoursWorked =
                        isLeaveRecord
                            ?
                            "N/A"
                            :
                            formatMinutesAsHours(
                                afterHoursWorkedMinutes
                            );


                    const workLocation =
                        isLeaveRecord
                            ?
                            "Out of Office"
                            :
                            (
                                String(
                                    record.workLocation ??
                                    "Office"
                                ).trim()
                                ||
                                "Office"
                            );


                    const leaveDuration =
    (
        isLeaveRecord
        ||
        isPartialLeave
    )
        ?
        formatReportLeaveDuration(
            record.leaveDuration
        )
        :
        "-";


                    const lateReason =
                        status ===
                            "late"
                            ?
                            (
                                record.lateReason ??
                                "-"
                            )
                            :
                            "-";


                    return `
                        <tr>

                            <td>
                                ${escapeHtml(
                                    formatReportDate(
                                        record.dateKey ??
                                        record.date
                                    )
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
                                    record.name ??
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
                                    workLocation
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
                                    afterHoursWorked
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.status ??
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    leaveDuration
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    lateReason
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");


    // =====================================
    // Normal Worked Minutes
    // =====================================

    const totalNormalWorkedMinutes =
        Math.max(
            0,
            totalWorkedMinutes -
            totalAfterHoursWorkedMinutes
        );


    // =====================================
    // Generated Date
    // =====================================

    const generatedDate =
        new Date()
            .toLocaleString(
                "en-ZA",
                {
                    dateStyle:
                        "medium",

                    timeStyle:
                        "short"
                }
            );


    // =====================================
    // Build Printable Report
    // =====================================

    const reportHtml = `
        <!DOCTYPE html>

        <html lang="en">

        <head>

            <meta charset="UTF-8">

            <title>
                R-E-D Attendance Report
            </title>

            <style>

                @page {
                    size: landscape;
                    margin: 12mm;
                }

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    padding: 0;

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    color: #1f2937;

                    background: #ffffff;
                }

                .report-container {
                    width: 100%;
                }

                .report-header {
                    border-bottom:
                        3px solid #0b2a4a;

                    padding-bottom:
                        12px;

                    margin-bottom:
                        18px;
                }

                .report-title {
                    margin: 0;

                    font-size: 24px;
                    font-weight: 800;

                    color: #0b2a4a;
                }

                .report-subtitle {
                    margin-top: 5px;

                    font-size: 13px;
                    color: #64748b;
                }

                .report-filter-grid {
                    display: grid;

                    grid-template-columns:
                        repeat(
                            4,
                            1fr
                        );

                    gap: 8px;

                    margin-bottom:
                        18px;
                }

                .filter-item {
                    border:
                        1px solid #dbe2ea;

                    border-radius:
                        6px;

                    padding:
                        8px 10px;

                    background:
                        #f8fafc;
                }

                .filter-label {
                    display: block;

                    margin-bottom:
                        3px;

                    font-size:
                        9px;

                    font-weight:
                        700;

                    text-transform:
                        uppercase;

                    color:
                        #64748b;
                }

                .filter-value {
                    font-size:
                        11px;

                    font-weight:
                        700;
                }

                .summary-grid {
                    display: grid;

                    grid-template-columns:
                        repeat(
                            4,
                            1fr
                        );

                    gap:
                        8px;

                    margin-bottom:
                        18px;
                }

                .summary-card {
                    border:
                        1px solid #dbe2ea;

                    border-radius:
                        6px;

                    padding:
                        10px;

                    text-align:
                        center;
                }

                .summary-card span {
                    display:
                        block;

                    font-size:
                        9px;

                    font-weight:
                        700;

                    text-transform:
                        uppercase;

                    color:
                        #64748b;
                }

                .summary-card strong {
                    display:
                        block;

                    margin-top:
                        5px;

                    font-size:
                        16px;

                    color:
                        #0b2a4a;
                }

                .hours-summary {
                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            3,
                            1fr
                        );

                    gap:
                        8px;

                    margin-bottom:
                        20px;
                }

                .hours-card {
                    border:
                        2px solid #dbe2ea;

                    border-radius:
                        6px;

                    padding:
                        12px;

                    text-align:
                        center;
                }

                .hours-card span {
                    display:
                        block;

                    font-size:
                        10px;

                    font-weight:
                        700;

                    text-transform:
                        uppercase;

                    color:
                        #475569;
                }

                .hours-card strong {
                    display:
                        block;

                    margin-top:
                        5px;

                    font-size:
                        18px;

                    font-weight:
                        800;

                    color:
                        #0b2a4a;
                }

                .grand-total {
                    border:
                        3px solid #0b2a4a;
                }

                table {
                    width:
                        100%;

                    border-collapse:
                        collapse;

                    font-size:
                        9px;
                }

                thead {
                    display:
                        table-header-group;
                }

                th {
                    padding:
                        7px 5px;

                    border:
                        1px solid #cbd5e1;

                    background:
                        #e8eef5;

                    font-size:
                        8px;

                    font-weight:
                        800;

                    text-align:
                        left;

                    text-transform:
                        uppercase;

                    color:
                        #0b2a4a;
                }

                td {
                    padding:
                        6px 5px;

                    border:
                        1px solid #dbe2ea;

                    vertical-align:
                        top;
                }

                tr {
                    page-break-inside:
                        avoid;
                }

                tbody tr:nth-child(even) {
                    background:
                        #f8fafc;
                }

                .report-footer {
                    margin-top:
                        15px;

                    padding-top:
                        8px;

                    border-top:
                        1px solid #cbd5e1;

                    font-size:
                        9px;

                    color:
                        #64748b;

                    display:
                        flex;

                    justify-content:
                        space-between;
                }

                @media print {

                    body {
                        print-color-adjust:
                            exact;

                        -webkit-print-color-adjust:
                            exact;
                    }

                }

            </style>

        </head>

        <body>

            <div class="report-container">


                <div class="report-header">

                    <h1 class="report-title">
                        R-E-D Attendance Report
                    </h1>

                    <div class="report-subtitle">
                        Attendance and Hours Worked Report
                    </div>

                </div>


                <div class="report-filter-grid">

                    <div class="filter-item">

                        <span class="filter-label">
                            Report Period
                        </span>

                        <span class="filter-value">
                            ${escapeHtml(
                                startDate
                            )}
                            to
                            ${escapeHtml(
                                endDate
                            )}
                        </span>

                    </div>


                    <div class="filter-item">

                        <span class="filter-label">
                            Employee
                        </span>

                        <span class="filter-value">
                            ${escapeHtml(
                                selectedEmployeeText
                            )}
                        </span>

                    </div>


                    <div class="filter-item">

                        <span class="filter-label">
                            Department
                        </span>

                        <span class="filter-value">
                            ${escapeHtml(
                                selectedDepartmentText
                            )}
                        </span>

                    </div>


                    <div class="filter-item">

                        <span class="filter-label">
                            Work Location
                        </span>

                        <span class="filter-value">
                            ${escapeHtml(
                                selectedWorkLocationText
                            )}
                        </span>

                    </div>

                </div>


                <div class="summary-grid">

                    <div class="summary-card">

                        <span>
                            Records
                        </span>

                        <strong>
                            ${currentReportRecords.length}
                        </strong>

                    </div>


                    <div class="summary-card">

                        <span>
                            On Time
                        </span>

                        <strong>
                            ${onTimeTotal}
                        </strong>

                    </div>


                    <div class="summary-card">

                        <span>
                            Late
                        </span>

                        <strong>
                            ${lateTotal}
                        </strong>

                    </div>


                    <div class="summary-card">

                        <span>
                            Absent
                        </span>

                        <strong>
                            ${absentTotal}
                        </strong>

                    </div>

                </div>


                <div class="hours-summary">

                    <div class="hours-card">

                        <span>
                            Normal Hours Worked
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatMinutesAsHours(
                                    totalNormalWorkedMinutes
                                )
                            )}
                        </strong>

                    </div>


                    <div class="hours-card">

                        <span>
                            After-Hours Worked
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatMinutesAsHours(
                                    totalAfterHoursWorkedMinutes
                                )
                            )}
                        </strong>

                    </div>


                    <div class="hours-card grand-total">

                        <span>
                            Total Hours Worked
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatMinutesAsHours(
                                    totalWorkedMinutes
                                )
                            )}
                        </strong>

                    </div>

                </div>


                <table>

                    <thead>

                        <tr>

                            <th>Date</th>

                            <th>Employee No.</th>

                            <th>Employee</th>

                            <th>Department</th>

                            <th>Location</th>

                            <th>Check In</th>

                            <th>Check Out</th>

                            <th>Total Hours</th>

                            <th>After-Hours Worked</th>

                            <th>Status</th>

                            <th>Leave</th>

                            <th>Late Reason</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${reportRows}

                    </tbody>

                </table>


                <div class="report-footer">

                    <span>
                        R-E-D Attendance Enterprise System
                    </span>

                    <span>
                        Generated:
                        ${escapeHtml(
                            generatedDate
                        )}
                    </span>

                </div>


            </div>

        </body>

        </html>
    `;


    // =====================================
    // Open Clean Printable Report
    // =====================================

    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1400,height=900"
        );


    if (
        !printWindow
    ) {

        alert(
            "The print report could not be opened. Please allow pop-ups for this site."
        );

        return;

    }


    printWindow.document.open();

    printWindow.document.write(
        reportHtml
    );

    printWindow.document.close();


    // =====================================
    // Print When Report Has Loaded
    // =====================================

    printWindow.onload =
        function () {

            printWindow.focus();

            setTimeout(
                function () {

                    printWindow.print();

                },
                250
            );

        };

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
