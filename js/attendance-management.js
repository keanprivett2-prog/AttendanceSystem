import "./admin-session.js";


// =====================================
// R-E-D Attendance
// Attendance Management
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
    orderBy,
    limit,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
    applySidebarPermissions,
    protectPage
} from "./role-permissions.js";


// =====================================
// Page Elements
// =====================================

const employeeSelect =
    document.getElementById(
        "employeeSelect"
    );

const attendanceManagementForm =
    document.getElementById(
        "attendanceManagementForm"
    );

const attendanceDate =
    document.getElementById(
        "attendanceDate"
    );

const attendanceStatus =
    document.getElementById(
        "attendanceStatus"
    );

const attendanceNotes =
    document.getElementById(
        "attendanceNotes"
    );

const attendanceMessage =
    document.getElementById(
        "attendanceMessage"
    );

const attendanceHistory =
    document.getElementById(
        "attendanceHistory"
    );

const summaryOnTime =
    document.getElementById(
        "summaryOnTime"
    );

const summaryLate =
    document.getElementById(
        "summaryLate"
    );

const summaryAbsent =
    document.getElementById(
        "summaryAbsent"
    );

const summaryLeave =
    document.getElementById(
        "summaryLeave"
    );

const saveAttendanceButton =
    document.getElementById(
        "saveAttendanceButton"
    );

const calendarTitle =
    document.getElementById(
        "calendarMonthTitle"
    );

const calendarGrid =
    document.getElementById(
        "attendanceCalendarGrid"
    );

const previousMonthButton =
    document.getElementById(
        "previousMonthButton"
    );

const nextMonthButton =
    document.getElementById(
        "nextMonthButton"
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

    let unpaidBreakMinutes =
    30;


// =====================================
// Calendar State
// =====================================

let calendarMonth =
    new Date().getMonth();

let calendarYear =
    new Date().getFullYear();


// =====================================
// Initialize Page
// =====================================

initializeAttendanceManagementPage();

async function initializeAttendanceManagementPage() {

    if (
        !protectPage(
            "attendance"
        )
    ) {

        return;

    }

    applySidebarPermissions();

    attendanceDate.value =
        formatLocalDate(
            new Date()
        );

    attendanceManagementForm.addEventListener(
        "submit",
        saveAttendance
    );

    employeeSelect.addEventListener(
        "change",
        handleEmployeeSelection
    );

    attendanceDate.addEventListener(
        "change",
        loadExistingAttendance
    );

    previousMonthButton.addEventListener(
        "click",
        showPreviousMonth
    );

    nextMonthButton.addEventListener(
        "click",
        showNextMonth
    );

    if (
        logoutButton
    ) {

        logoutButton.addEventListener(
            "click",
            logoutAdministrator
        );

    }


    // =====================================
    // Load Settings First
    // =====================================

    await loadAttendanceSettings();


    // =====================================
    // Load Page Data
    // =====================================

    await loadEmployees();

    await buildCalendar();

}


// =====================================
// Load Attendance Settings
// =====================================

async function loadAttendanceSettings() {

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

            standardWorkStartTime =
                "08:00";

            return;

        }

        const settings =
            settingsSnapshot.data();

        standardWorkStartTime =
            String(
                settings.standardStartTime ??
                "08:00"
            ).trim();

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


        // =====================================
        // Validate Time
        // =====================================

        const timeParts =
            standardWorkStartTime
                .split(":")
                .map(Number);

        if (
            timeParts.length <
                2 ||
            !Number.isFinite(
                timeParts[0]
            ) ||
            !Number.isFinite(
                timeParts[1]
            )
        ) {

            standardWorkStartTime =
                "08:00";

        }

    } catch (
        error
    ) {

        console.error(
            "Unable to load attendance settings:",
            error
        );

        standardWorkStartTime =
            "08:00";

    }

}


// =====================================
// Employee Selection
// =====================================

async function handleEmployeeSelection() {

    await loadExistingAttendance();

    await loadAttendanceHistory();

    await loadAttendanceSummary();

    await buildCalendar();

}


// =====================================
// Message Helper
// =====================================

function showMessage(
    message,
    color
) {

    if (
        !attendanceMessage
    ) {

        return;

    }

    attendanceMessage.textContent =
        message;

    attendanceMessage.style.color =
        color;

}


// =====================================
// Format Local Date
// =====================================

function formatLocalDate(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() +
            1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return (
        `${year}-${month}-${day}`
    );

}


// =====================================
// Load Active Employees
// =====================================

async function loadEmployees() {

    employeeSelect.innerHTML = `
        <option value="">
            Loading employees...
        </option>
    `;

    try {

        const employeesQuery =
            query(
                collection(
                    db,
                    "employees"
                ),
                where(
                    "active",
                    "==",
                    true
                )
            );

        const employeeSnapshot =
            await getDocs(
                employeesQuery
            );

        const employees =
            employeeSnapshot.docs.map(
                (
                    employeeDocument
                ) => ({

                    id:
                        employeeDocument.id,

                    ...employeeDocument.data()

                })
            );

        employees.sort(
            (
                firstEmployee,
                secondEmployee
            ) =>
                String(
                    firstEmployee.name ??
                    ""
                ).localeCompare(
                    String(
                        secondEmployee.name ??
                        ""
                    )
                )
        );

        employeeSelect.innerHTML = `
            <option value="">
                Select an employee
            </option>
        `;

        employees.forEach(
            function (
                employee
            ) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    employee.id;

                option.textContent =
                    `${employee.name ?? "Unnamed Employee"} (${employee.employeeNumber ?? "-"})`;

                option.dataset.employeeNumber =
                    employee.employeeNumber ??
                    "";

                option.dataset.name =
                    employee.name ??
                    "";

                option.dataset.department =
                    employee.department ??
                    "";

                employeeSelect.appendChild(
                    option
                );

            }
        );

    } catch (
        error
    ) {

        console.error(
            "Unable to load employees:",
            error
        );

        employeeSelect.innerHTML = `
            <option value="">
                Unable to load employees
            </option>
        `;

        showMessage(
            "Unable to load employees.",
            "red"
        );

    }

}


// =====================================
// Get Selected Employee
// =====================================

async function getSelectedEmployee() {

    const employeeId =
        employeeSelect.value;

    if (
        !employeeId
    ) {

        return null;

    }

    const employeeReference =
        doc(
            db,
            "employees",
            employeeId
        );

    const employeeSnapshot =
        await getDoc(
            employeeReference
        );

    if (
        !employeeSnapshot.exists()
    ) {

        return null;

    }

    return {

        id:
            employeeSnapshot.id,

        ...employeeSnapshot.data()

    };

}


// =====================================
// Load Existing Attendance Record
// =====================================

async function loadExistingAttendance() {

    const selectedDate =
        attendanceDate.value;

    if (
        !employeeSelect.value ||
        !selectedDate
    ) {

        attendanceStatus.value =
            "";

        attendanceNotes.value =
            "";

        showMessage(
            "",
            ""
        );

        return;

    }

    try {

        const employee =
            await getSelectedEmployee();

        if (
            !employee
        ) {

            showMessage(
                "Employee not found.",
                "red"
            );

            return;

        }

        const attendanceDocumentId =
            `${employee.employeeNumber}_${selectedDate}`;

        const attendanceReference =
            doc(
                db,
                "attendance",
                attendanceDocumentId
            );

        const attendanceSnapshot =
            await getDoc(
                attendanceReference
            );

        if (
            attendanceSnapshot.exists()
        ) {

            const attendance =
                attendanceSnapshot.data();

            attendanceStatus.value =
                attendance.status ??
                "";

            const existingNotes =
                String(
                    attendance.notes ??
                    ""
                ).trim();

            const existingLateReason =
                String(
                    attendance.lateReason ??
                    ""
                ).trim();

            if (
                attendance.status ===
                    "Late" &&
                existingLateReason
            ) {

                attendanceNotes.value =
                    existingNotes
                        ?
                        existingNotes +
                        "\n\nReason for Lateness: " +
                        existingLateReason
                        :
                        "Reason for Lateness: " +
                        existingLateReason;

            } else {

                attendanceNotes.value =
                    existingNotes;

            }

            showMessage(
                "Existing attendance record loaded.",
                "var(--orange-primary)"
            );

        } else {

            attendanceStatus.value =
                "";

            attendanceNotes.value =
                "";

            showMessage(
                "No attendance record exists for this employee and date.",
                "var(--blue-primary)"
            );

        }

    } catch (
        error
    ) {

        console.error(
            "Unable to load attendance:",
            error
        );

        showMessage(
            "Unable to load attendance record.",
            "red"
        );

    }

}


// =====================================
// Load Attendance History
// =====================================

async function loadAttendanceHistory() {

    if (
        !employeeSelect.value
    ) {

        attendanceHistory.innerHTML = `
            <p class="empty-state">
                Select an employee to view attendance history.
            </p>
        `;

        return;

    }

    attendanceHistory.innerHTML = `
        <p class="empty-state">
            Loading attendance history...
        </p>
    `;

    try {

        const employee =
            await getSelectedEmployee();

        if (
            !employee
        ) {

            attendanceHistory.innerHTML = `
                <p class="empty-state">
                    Employee not found.
                </p>
            `;

            return;

        }

        const historyQuery =
            query(
                collection(
                    db,
                    "attendance"
                ),
                where(
                    "employeeNumber",
                    "==",
                    employee.employeeNumber
                ),
                orderBy(
                    "dateKey",
                    "desc"
                ),
                limit(
                    10
                )
            );

        const historySnapshot =
            await getDocs(
                historyQuery
            );

        if (
            historySnapshot.empty
        ) {

            attendanceHistory.innerHTML = `
                <p class="empty-state">
                    No attendance history found.
                </p>
            `;

            return;

        }

        attendanceHistory.innerHTML =
            "";

        historySnapshot.forEach(
            function (
                attendanceDocument
            ) {

                const attendance =
                    attendanceDocument.data();

                const dateDisplay =
                    formatAttendanceDate(
                        attendance.dateKey
                    );

                const statusClass =
                    createStatusClass(
                        attendance.status
                    );

                const method =
                    attendance.checkInMethod ??
                    "Unknown";

                const notes =
                    String(
                        attendance.notes ??
                        ""
                    ).trim() ||
                    "No additional notes.";

                const lateReason =
                    String(
                        attendance.lateReason ??
                        ""
                    ).trim();

                const isLate =
                    String(
                        attendance.status ??
                        ""
                    ).trim() ===
                    "Late";

                const checkInTime =
                    attendance.time ??
                    "Not recorded";

                const checkOutTime =
                    attendance.checkOutTime ??
                    "Still at work";

                const hoursWorked =
                    calculateHoursWorked(
                        attendance
                    );

                const earlyExit =
                    attendance.earlyExit ===
                    true;

                const earlyExitReason =
                    String(
                        attendance.earlyExitReason ??
                        ""
                    ).trim();

                const earlyExitNote =
                    String(
                        attendance.earlyExitNote ??
                        ""
                    ).trim();

                const historyCard =
                    document.createElement(
                        "details"
                    );

                historyCard.className =
                    "attendance-history-card";

                historyCard.innerHTML = `

    <summary class="history-summary">

        <div class="history-summary-main">

            <span
                class="status-badge ${statusClass}"
            >
                ${escapeHtml(
                    attendance.status ??
                    "Unknown"
                )}
            </span>

            <div class="history-summary-date">

                <strong>
                    ${escapeHtml(
                        dateDisplay
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        checkInTime
                    )}
                </span>

            </div>

        </div>

        <div class="history-summary-method">
            ${escapeHtml(
                method
            )}
        </div>

    </summary>


    <div class="history-expanded-clean">


        <!-- =====================================
             Time Summary
        ====================================== -->

        <div class="history-time-grid">

            <div class="history-time-item">

                <span class="history-time-label">
                    Check In
                </span>

                <strong>
                    ${escapeHtml(
                        checkInTime
                    )}
                </strong>

            </div>


            <div class="history-time-item">

                <span class="history-time-label">
                    Check Out
                </span>

                <strong>
                    ${escapeHtml(
                        checkOutTime
                    )}
                </strong>

            </div>


            <div class="history-time-item">

                <span class="history-time-label">
                    Hours Worked
                </span>

                <strong>
                    ${escapeHtml(
                        hoursWorked
                    )}
                </strong>

            </div>

        </div>


        <!-- =====================================
             Early Exit
        ====================================== -->

        <div class="history-clean-row">

            <span class="history-clean-label">
                Early Exit
            </span>

            <span
                class="${
                    earlyExit
                        ?
                        "history-value-badge history-value-warning"
                        :
                        "history-value-badge history-value-normal"
                }"
            >
                ${
                    attendance.checkOutTime
                        ?
                        earlyExit
                            ?
                            "Yes"
                            :
                            "No"
                        :
                        "-"
                }
            </span>

        </div>


        ${
            earlyExit
                ?
                `

                <div class="history-clean-row">

                    <span class="history-clean-label">
                        Early Exit Reason
                    </span>

                    <span class="history-clean-value">
                        ${
                            earlyExitReason
                                ?
                                escapeHtml(
                                    earlyExitReason
                                )
                                :
                                "No reason recorded."
                        }
                    </span>

                </div>


                ${
                    earlyExitNote
                        ?
                        `

                        <div class="history-clean-row">

                            <span class="history-clean-label">
                                Early Exit Details
                            </span>

                            <span class="history-clean-value">
                                ${escapeHtml(
                                    earlyExitNote
                                )}
                            </span>

                        </div>

                        `
                        :
                        ""
                }

                `
                :
                ""
        }


        <!-- =====================================
             Late Reason
        ====================================== -->

        ${
            isLate
                ?
                `

                <div class="history-clean-row history-late-row">

                    <span class="history-clean-label">
                        Reason for Lateness
                    </span>

                    <span class="history-clean-value">
                        ${
                            lateReason
                                ?
                                escapeHtml(
                                    lateReason
                                )
                                :
                                "No late reason was recorded."
                        }
                    </span>

                </div>

                `
                :
                ""
        }


        <!-- =====================================
             Notes
        ====================================== -->

        <div class="history-clean-row history-notes-row">

            <span class="history-clean-label">
                Notes
            </span>

            <span class="history-clean-value">
                ${escapeHtml(
                    notes
                )}
            </span>

        </div>


    </div>

`;

                attendanceHistory.appendChild(
                    historyCard
                );

            }
        );

    } catch (
        error
    ) {

        console.error(
            "Unable to load attendance history:",
            error
        );

        attendanceHistory.innerHTML = `
            <p class="empty-state">
                Unable to load attendance history.
            </p>
        `;

    }

}


// =====================================
// Load Attendance Summary
// =====================================

async function loadAttendanceSummary() {

    resetAttendanceSummary();

    if (
        !employeeSelect.value
    ) {

        return;

    }

    try {

        const employee =
            await getSelectedEmployee();

        if (
            !employee
        ) {

            return;

        }

        const attendanceQuery =
            query(
                collection(
                    db,
                    "attendance"
                ),
                where(
                    "employeeNumber",
                    "==",
                    employee.employeeNumber
                )
            );

        const attendanceSnapshot =
            await getDocs(
                attendanceQuery
            );

        let onTime =
            0;

        let late =
            0;

        let absent =
            0;

        let leave =
            0;

        attendanceSnapshot.forEach(
            function (
                attendanceDocument
            ) {

                const attendance =
                    attendanceDocument.data();

                switch (
                    attendance.status
                ) {

                    case "On Time":

                        onTime++;

                        break;


                    case "Late":

                        late++;

                        break;


                    case "Absent":

                        absent++;

                        break;


                    case "Annual Leave":

                    case "Sick Leave":

                    case "Family Responsibility Leave":

                    case "Maternity Leave":

                    case "Unpaid Leave":

                    case "Public Holiday":

                        leave++;

                        break;

                }

            }
        );

        summaryOnTime.textContent =
            onTime;

        summaryLate.textContent =
            late;

        summaryAbsent.textContent =
            absent;

        summaryLeave.textContent =
            leave;

    } catch (
        error
    ) {

        console.error(
            "Unable to load attendance summary:",
            error
        );

    }

}


// =====================================
// Reset Attendance Summary
// =====================================

function resetAttendanceSummary() {

    summaryOnTime.textContent =
        "0";

    summaryLate.textContent =
        "0";

    summaryAbsent.textContent =
        "0";

    summaryLeave.textContent =
        "0";

}


// =====================================
// Calculate Hours Worked
// =====================================

function calculateHoursWorked(
    attendance
) {

    if (
        !attendance.checkOutTime
    ) {

        return "In progress";

    }


    // =====================================
    // Get Standard Start Time
    // =====================================

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


    // =====================================
    // Firebase Timestamp Method
    // =====================================

    const checkInTimestamp =
        attendance.checkInTimestamp ??
        attendance.scanTimestamp;

    const checkOutTimestamp =
        attendance.checkOutTimestamp;

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


        // =====================================
        // Build Scheduled Start Date
        // =====================================

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


        // =====================================
        // Effective Work Start
        // =====================================

        const effectiveCheckInDate =
            actualCheckInDate <
            standardStartDate
                ?
                standardStartDate
                :
                actualCheckInDate;


        // =====================================
        // Calculate Difference
        // =====================================

        const differenceMilliseconds =
            checkOutDate.getTime()
            -
            effectiveCheckInDate.getTime();

        if (
            differenceMilliseconds <
            0
        ) {

            return "Unable to calculate";

        }

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
    // Fallback for Older Records
    // =====================================

    if (
        attendance.time &&
        attendance.checkOutTime
    ) {

        const checkInParts =
            String(
                attendance.time
            )
                .split(":")
                .map(Number);

        const checkOutParts =
            String(
                attendance.checkOutTime
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
    checkOutMinutes
    -
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
// Format Attendance Date
// =====================================

function formatAttendanceDate(
    dateKey
) {

    if (
        !dateKey
    ) {

        return "Unknown date";

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

function createStatusClass(
    status
) {

    return `status-${String(
        status ??
        "unknown"
    )
        .normalize(
            "NFKC"
        )
        .trim()
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        )}`;

}


// =====================================
// Save Attendance
// =====================================

async function saveAttendance(
    event
) {

    event.preventDefault();

    const selectedDate =
        attendanceDate.value;

    const selectedStatus =
        attendanceStatus.value;

    const notes =
        attendanceNotes.value.trim();

    if (
        !employeeSelect.value
    ) {

        showMessage(
            "Please select an employee.",
            "red"
        );

        return;

    }

    if (
        !selectedDate
    ) {

        showMessage(
            "Please select a date.",
            "red"
        );

        return;

    }

    if (
        !selectedStatus
    ) {

        showMessage(
            "Please select an attendance status.",
            "red"
        );

        return;

    }

    saveAttendanceButton.disabled =
        true;

    saveAttendanceButton.textContent =
        "Saving...";

    showMessage(
        "Saving attendance...",
        "var(--text-secondary)"
    );

    try {

        const employee =
            await getSelectedEmployee();

        if (
            !employee
        ) {

            showMessage(
                "Employee not found.",
                "red"
            );

            return;

        }

        const attendanceDocumentId =
            `${employee.employeeNumber}_${selectedDate}`;

        const attendanceReference =
            doc(
                db,
                "attendance",
                attendanceDocumentId
            );

        const existingSnapshot =
            await getDoc(
                attendanceReference
            );

        const recordAlreadyExists =
    existingSnapshot.exists();

const existingAttendance =
    recordAlreadyExists
        ?
        existingSnapshot.data()
        :
        null;


// =====================================
// Current Date / Time
// =====================================

const now =
    new Date();

const currentTime =
    now.toLocaleTimeString(
        "en-ZA",
        {
            hour:
                "2-digit",

            minute:
                "2-digit",

            hour12:
                false
        }
    );


// =====================================
// Statuses That End The Working Day
// =====================================

const checkoutStatuses = [

    "Annual Leave",
    "Sick Leave",
    "Family Responsibility Leave",
    "Maternity Leave",
    "Unpaid Leave",
    "Medical Appointment",
    "Half Day"

];


// =====================================
// Determine Automatic Checkout
// =====================================

const employeeAlreadyCheckedIn =
    Boolean(
        existingAttendance &&
        (
            existingAttendance.time ||
            existingAttendance.scanTimestamp ||
            existingAttendance.checkInTimestamp
        )
    );

const employeeAlreadyCheckedOut =
    Boolean(
        existingAttendance &&
        (
            existingAttendance.checkOutTime ||
            existingAttendance.checkOutTimestamp
        )
    );

const shouldAutoCheckOut =
    recordAlreadyExists &&
    employeeAlreadyCheckedIn &&
    !employeeAlreadyCheckedOut &&
    checkoutStatuses.includes(
        selectedStatus
    );
                
       const attendanceData = {

    employeeNumber:
        employee.employeeNumber,

    name:
        employee.name,

    department:
        employee.department ??
        "Unassigned",

    date:
        selectedDate,

    dateKey:
        selectedDate,

    status:
        selectedStatus,

    notes:
        notes,

    updatedAt:
        serverTimestamp()

};


// =====================================
// New Manual Attendance Record
// =====================================

if (
    !recordAlreadyExists
) {

    attendanceData.checkInMethod =
        "Manual";

    attendanceData.time =
        currentTime;

    attendanceData.createdAt =
        serverTimestamp();

}


// =====================================
// Automatic Checkout For Leave
// =====================================

if (
    shouldAutoCheckOut
) {

    attendanceData.checkOutTime =
        currentTime;

    attendanceData.checkOutTimestamp =
        Timestamp.fromDate(
            now
        );

    attendanceData.checkOutMethod =
        "Manual Adjustment";


    // =====================================
    // Determine Early Exit
    // =====================================

    const employeeEndTime =
        String(
            employee.endTime ??
            ""
        ).trim();

    if (
        employeeEndTime
    ) {

        const endParts =
            employeeEndTime
                .split(":")
                .map(Number);

        if (
            endParts.length >=
                2 &&
            Number.isFinite(
                endParts[0]
            ) &&
            Number.isFinite(
                endParts[1]
            )
        ) {

            const scheduledEndMinutes =
                (
                    endParts[0] *
                    60
                )
                +
                endParts[1];

            const currentMinutes =
                (
                    now.getHours() *
                    60
                )
                +
                now.getMinutes();

            attendanceData.earlyExit =
                currentMinutes <
                scheduledEndMinutes;

        }

    }

}


// =====================================
// Save Attendance Record
// =====================================

await setDoc(
    attendanceReference,
    attendanceData,
    {
        merge:
            true
    }
);

        showMessage(
            recordAlreadyExists
                ?
                "Attendance record updated."
                :
                "Attendance record created.",

            recordAlreadyExists
                ?
                "var(--orange-primary)"
                :
                "var(--green-primary)"
        );

        await loadAttendanceHistory();

        await loadAttendanceSummary();

        await buildCalendar();

    } catch (
        error
    ) {

        console.error(
            "Unable to save attendance:",
            error
        );

        showMessage(
            "Unable to save attendance.",
            "red"
        );

    } finally {

        saveAttendanceButton.disabled =
            false;

        saveAttendanceButton.textContent =
            "Save Attendance";

    }

}


// =====================================
// Build Attendance Calendar
// =====================================

async function buildCalendar() {

    calendarGrid.innerHTML =
        "";

    if (
        !employeeSelect.value
    ) {

        calendarGrid.innerHTML = `
            <p class="empty-state">
                Select an employee to view the attendance calendar.
            </p>
        `;

        calendarTitle.textContent =
            "Calendar";

        return;

    }

    try {

        const selectedOption =
            employeeSelect.options[
                employeeSelect.selectedIndex
            ];

        const selectedEmployeeNumber =
            selectedOption.dataset.employeeNumber;

        const monthStart =
            new Date(
                calendarYear,
                calendarMonth,
                1
            );

        const monthEnd =
            new Date(
                calendarYear,
                calendarMonth +
                1,
                0
            );

        const monthStartKey =
            formatLocalDate(
                monthStart
            );

        const monthEndKey =
            formatLocalDate(
                monthEnd
            );

        const attendanceQuery =
            query(
                collection(
                    db,
                    "attendance"
                ),
                where(
                    "employeeNumber",
                    "==",
                    selectedEmployeeNumber
                ),
                where(
                    "date",
                    ">=",
                    monthStartKey
                ),
                where(
                    "date",
                    "<=",
                    monthEndKey
                )
            );

        const attendanceSnapshot =
            await getDocs(
                attendanceQuery
            );

        const attendanceByDate =
            {};

        attendanceSnapshot.forEach(
            function (
                attendanceDocument
            ) {

                const record =
                    attendanceDocument.data();

                attendanceByDate[
                    record.date ??
                    record.dateKey
                ] =
                    record;

            }
        );

        displayCalendar(
            attendanceByDate
        );

    } catch (
        error
    ) {

        console.error(
            "Unable to build attendance calendar:",
            error
        );

        calendarGrid.innerHTML = `
            <p class="empty-state">
                Unable to load the attendance calendar.
            </p>
        `;

    }

}


// =====================================
// Display Calendar
// =====================================

function displayCalendar(
    attendanceByDate
) {

    calendarGrid.innerHTML =
        "";

    const monthNames = [

        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"

    ];

    const dayNames = [

        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"

    ];

    calendarTitle.textContent =
        `${monthNames[calendarMonth]} ${calendarYear}`;

    dayNames.forEach(
        function (
            dayName
        ) {

            const dayHeading =
                document.createElement(
                    "div"
                );

            dayHeading.className =
                "calendar-day-header";

            dayHeading.textContent =
                dayName;

            calendarGrid.appendChild(
                dayHeading
            );

        }
    );

    const firstDayOfMonth =
        new Date(
            calendarYear,
            calendarMonth,
            1
        ).getDay();

    const totalDaysInMonth =
        new Date(
            calendarYear,
            calendarMonth +
            1,
            0
        ).getDate();

    for (
        let blankIndex =
            0;
        blankIndex <
            firstDayOfMonth;
        blankIndex++
    ) {

        const blankDay =
            document.createElement(
                "div"
            );

        blankDay.className =
            "calendar-empty";

        calendarGrid.appendChild(
            blankDay
        );

    }

    for (
        let day =
            1;
        day <=
            totalDaysInMonth;
        day++
    ) {

        createCalendarDay(
            day,
            attendanceByDate
        );

    }

}


// =====================================
// Create Calendar Day
// =====================================

function createCalendarDay(
    day,
    attendanceByDate
) {

    const dayCell =
        document.createElement(
            "div"
        );

    const currentDate =
        new Date(
            calendarYear,
            calendarMonth,
            day
        );

    const currentDateKey =
        formatLocalDate(
            currentDate
        );

    const attendanceRecord =
        attendanceByDate[
            currentDateKey
        ];

    dayCell.classList.add(
        "calendar-day"
    );

    if (
        attendanceRecord
    ) {

        const statusClass =
            createStatusClass(
                attendanceRecord.status
            ).replace(
                "status-",
                ""
            );

        dayCell.classList.add(
            `calendar-${statusClass}`
        );

        dayCell.title =
            attendanceRecord.status ??
            "Attendance recorded";

    }

    const today =
        new Date();

    const isToday =
        day ===
            today.getDate() &&
        calendarMonth ===
            today.getMonth() &&
        calendarYear ===
            today.getFullYear();

    if (
        isToday
    ) {

        dayCell.classList.add(
            "calendar-today"
        );

    }

    dayCell.innerHTML = `
        <strong>
            ${day}
        </strong>
    `;

    dayCell.style.cursor =
        "pointer";

    dayCell.addEventListener(
        "click",
        async function () {

            attendanceDate.value =
                currentDateKey;

            await loadExistingAttendance();

        }
    );

    calendarGrid.appendChild(
        dayCell
    );

}


// =====================================
// Previous Calendar Month
// =====================================

function showPreviousMonth() {

    calendarMonth--;

    if (
        calendarMonth <
        0
    ) {

        calendarMonth =
            11;

        calendarYear--;

    }

    buildCalendar();

}


// =====================================
// Next Calendar Month
// =====================================

function showNextMonth() {

    calendarMonth++;

    if (
        calendarMonth >
        11
    ) {

        calendarMonth =
            0;

        calendarYear++;

    }

    buildCalendar();

}


// =====================================
// Escape HTML
// =====================================

function escapeHtml(
    value
) {

    return String(
        value ??
        ""
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

        if (
            logoutButton
        ) {

            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "Logging out...";

        }

        await signOut(
            auth
        );

        sessionStorage.clear();

        window.location.replace(
            "admin-login.html"
        );

    } catch (
        error
    ) {

        console.error(
            "Logout error:",
            error
        );

        if (
            logoutButton
        ) {

            logoutButton.disabled =
                false;

            logoutButton.textContent =
                "Logout";

        }

        showMessage(
            "Unable to log out. Please try again.",
            "red"
        );

    }

}