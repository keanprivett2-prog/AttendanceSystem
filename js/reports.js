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
// Calculate Worked Minutes
// =====================================

function calculateReportWorkedMinutes(
    record
) {

    if (
        !record.checkOutTime
    ) {

        return null;

    }


    const checkInTimestamp =
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

            const elapsedMinutes =
                Math.floor(
                    differenceMilliseconds /
                    60000
                );


            let totalMinutes =
                elapsedMinutes;


            // =====================================
            // Deduct Unpaid Break
            // =====================================

            if (
                elapsedMinutes >=
                360
            ) {

                totalMinutes =
                    Math.max(
                        0,
                        elapsedMinutes -
                        unpaidBreakMinutes
                    );

            }


            return totalMinutes;

        }

    }


    // =====================================
    // Fallback To Stored Times
    // =====================================

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

                let totalMinutes =
                    elapsedMinutes;


                // =====================================
                // Deduct Unpaid Break
                // =====================================

                if (
                    elapsedMinutes >=
                    360
                ) {

                    totalMinutes =
                        Math.max(
                            0,
                            elapsedMinutes -
                            unpaidBreakMinutes
                        );

                }


                return totalMinutes;

            }

        }

    }


    return null;

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

            const checkInTime =
                record.time ??
                "-";

            const checkOutTime =
                record.checkOutTime ??
                "Still at work";

            const hoursWorked =
                calculateReportHoursWorked(
                    record
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


    // =====================================
    // Hours Worked
    // =====================================

    let totalWorkedMinutes =
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

            if (
                workedMinutes ===
                null
            ) {

                return;

            }

            totalWorkedMinutes +=
                workedMinutes;

            completedWorkdays++;

        }
    );


    const averageWorkedMinutes =
        completedWorkdays ===
            0
            ?
            0
            :
            Math.round(
                totalWorkedMinutes /
                completedWorkdays
            );


    // =====================================
    // Attendance Rate
    // =====================================

    const attended =
        onTime +
        late;

    const rate =
        total ===
            0
            ?
            0
            :
            Math.round(
                (
                    attended /
                    total
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

    totalHoursWorked.textContent =
        formatMinutesAsHours(
            totalWorkedMinutes
        );

    averageHoursPerDay.textContent =
        formatMinutesAsHours(
            averageWorkedMinutes
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

            if (
                status ===
                    "on time" ||
                status ===
                    "late"
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


                
            const attendancePercentage =
                data.total ===
                    0
                    ?
                    0
                    :
                    Math.round(
                        (
                            data.attended /
                            data.total
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
    // Employee Data
    // =====================================

    const employeeData =
        {};


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
            // Create Employee Summary
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

                    workedMinutes:
                        0

                };

            }


            const data =
                employeeData[
                    employeeKey
                ];


            // =====================================
            // Total Records
            // =====================================

            data.total++;


            // =====================================
            // Status
            // =====================================

            const status =
                normalizeStatus(
                    record.status
                );


            // =====================================
            // On Time
            // =====================================

            if (
                status ===
                "on time"
            ) {

                data.onTime++;

            }


            // =====================================
            // Late
            // =====================================

            if (
                status ===
                "late"
            ) {

                data.late++;

            }


            // =====================================
            // Absent
            // =====================================

            if (
                status ===
                "absent"
            ) {

                data.absent++;

            }


            // =====================================
            // Sick Leave
            // =====================================

            if (
                status ===
                "sick leave"
            ) {

                data.sickLeave++;

            }


            // =====================================
            // Annual Leave
            // =====================================

            if (
                status ===
                "annual leave"
            ) {

                data.annualLeave++;

            }


            // =====================================
            // Other Leave
            // =====================================

            if (
                status ===
                    "maternity leave" ||
                status ===
                    "family responsibility leave" ||
                status ===
                    "unpaid leave" ||
                status ===
                    "medical appointment"
            ) {

                data.otherLeave++;

            }


            // =====================================
            // Early Exits
            // =====================================

            if (
                record.earlyExit ===
                true
            ) {

                data.earlyExits++;

            }


            // =====================================
            // Hours Worked
            // =====================================

            const workedMinutes =
                calculateReportWorkedMinutes(
                    record
                );

            if (
                workedMinutes !==
                null
            ) {

                data.workedMinutes +=
                    workedMinutes;

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
            // Completed Attendance Days
            // =====================================

            const completedWorkdays =
                employee.onTime +
                employee.late;


            // =====================================
            // Average Hours / Day
            // =====================================

            const averageWorkedMinutes =
                completedWorkdays >
                0
                    ?
                    Math.round(
                        employee.workedMinutes /
                        completedWorkdays
                    )
                    :
                    0;


            // =====================================
            // Attendance Rate
            // =====================================

            const attended =
                employee.onTime +
                employee.late;

            const attendancePercentage =
                employee.total ===
                    0
                    ?
                    0
                    :
                    Math.round(
                        (
                            attended /
                            employee.total
                        )
                        *
                        100
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
    employee.total > 0 &&
    averageWorkedMinutes <
    (
        shortWorkdayHours *
        60
    );


const hasWarning =
    attendancePercentage <
        90 ||
    employee.late >=
        consecutiveLateThreshold ||
    employee.earlyExits >=
        frequentEarlyExitThreshold ||
    hasLowAverageHours;


const needsAttention =
    attendancePercentage <
        80 ||
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
        80 &&
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
            // Create Employee Row
            // =====================================

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "employee-performance-row";


            row.innerHTML = `

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


                <!-- Records -->

                <span>
                    ${employee.total}
                </span>


                <!-- On Time -->

                <span>
                    ${employee.onTime}
                </span>


                <!-- Late -->

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


                <!-- Absent -->

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


                <!-- Sick Leave -->

                <span>
                    ${employee.sickLeave}
                </span>


                <!-- Annual Leave -->

                <span>
                    ${employee.annualLeave}
                </span>


                <!-- Other Leave -->

                <span>
                    ${employee.otherLeave}
                </span>


                <!-- Early Exits -->

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


                <!-- Total Hours Worked -->

                <span>
                    ${escapeHtml(
                        formatMinutesAsHours(
                            employee.workedMinutes
                        )
                    )}
                </span>


                <!-- Average Hours / Day -->

<span
    class="${
        employee.total > 0 &&
        averageWorkedMinutes <
        (
            shortWorkdayHours *
            60
        )
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


                <!-- Attendance Rate -->

<span
    class="attendance-rate-cell ${getAttendanceRateClass(
        attendancePercentage
    )}"
>
    ${attendancePercentage}%
</span>

<!-- Performance Status -->

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
            performanceReasons.length > 0
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
                colspan="11"
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
        currentReportRecords.length === 0
    ) {

        alert(
            "Please generate a report before exporting."
        );

        return;

    }

    const csvRows = [
    [
        "Date",
        "Employee Number",
        "Employee Name",
        "Department",
        "Check In",
        "Check Out",
        "Hours Worked",
        "Status",
        "Late Reason",
        "Early Exit",
        "Early Exit Reason"
    ]
];

    currentReportRecords.forEach(
        (record) => {

            csvRows.push([

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

    record.time ??
        "",

    record.checkOutTime ??
        "",

    calculateReportHoursWorked(
        record
    ),

    record.status ??
        "",

    normalizeStatus(
        record.status
    ) === "late"
        ?
        record.lateReason ??
        ""
        :
        "",

    record.checkOutTime
        ?
        record.earlyExit === true
            ?
            "Yes"
            :
            "No"
        :
        "",

    record.earlyExit === true
        ?
        record.earlyExitReason ??
        ""
        :
        ""

    ]);



        }
    );

    const csvContent =
        csvRows
            .map(
                (row) =>
                    row
                        .map(
                            escapeCsvValue
                        )
                        .join(";")
            )
            .join("\n");

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
        currentReportRecords.length === 0
    ) {

        alert(
            "Please generate a report before printing."
        );

        return;

    }

    window.print();

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
