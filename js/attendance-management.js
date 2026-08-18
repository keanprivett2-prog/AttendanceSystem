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

    const attendanceWorkLocation =
    document.getElementById(
        "attendanceWorkLocation"
    );

const leaveDurationGroup =
    document.getElementById(
        "leaveDurationGroup"
    );

const leaveDuration =
    document.getElementById(
        "leaveDuration"
    );

const leaveTimeGroup =
    document.getElementById(
        "leaveTimeGroup"
    );

const leaveTime =
    document.getElementById(
        "leaveTime"
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
// Leave Statuses
// =====================================

const LEAVE_STATUSES = [
    "Annual Leave",
    "Sick Leave",
    "Family Responsibility Leave",
    "Maternity Leave",
    "Unpaid Leave"
];

const CHECKOUT_STATUSES = [
    ...LEAVE_STATUSES,
    "Medical Appointment",
    "Half Day"
];


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

    if (
        attendanceDate
    ) {

        attendanceDate.value =
            formatLocalDate(
                new Date()
            );

        attendanceDate.addEventListener(
            "change",
            loadExistingAttendance
        );

    }

    if (
        attendanceManagementForm
    ) {

        attendanceManagementForm.addEventListener(
            "submit",
            saveAttendance
        );

    }

    if (
        employeeSelect
    ) {

        employeeSelect.addEventListener(
            "change",
            handleEmployeeSelection
        );

    }

    if (
        attendanceStatus
    ) {

        attendanceStatus.addEventListener(
            "change",
            handleAttendanceStatusChange
        );

    }

    if (
        leaveDuration
    ) {

        leaveDuration.addEventListener(
            "change",
            handleLeaveDurationChange
        );

    }

    if (
        previousMonthButton
    ) {

        previousMonthButton.addEventListener(
            "click",
            showPreviousMonth
        );

    }

    if (
        nextMonthButton
    ) {

        nextMonthButton.addEventListener(
            "click",
            showNextMonth
        );

    }

    if (
        logoutButton
    ) {

        logoutButton.addEventListener(
            "click",
            logoutAdministrator
        );

    }

    handleAttendanceStatusChange();

    await loadAttendanceSettings();

    await loadEmployees();

    await buildCalendar();

}


// =====================================
// Leave Duration Visibility
// =====================================

function handleAttendanceStatusChange() {

    if (
        !attendanceStatus ||
        !leaveDurationGroup ||
        !leaveDuration
    ) {

        return;

    }

    const selectedStatus =
        attendanceStatus.value;

    const requiresLeaveDuration =
        LEAVE_STATUSES.includes(
            selectedStatus
        );

    if (
        requiresLeaveDuration
    ) {

        leaveDurationGroup.style.display =
            "";

        leaveDuration.required =
            true;

        handleLeaveDurationChange();

        return;

    }

    leaveDurationGroup.style.display =
        "none";

    leaveDuration.required =
        false;

    leaveDuration.value =
        "";

    handleLeaveDurationChange();

}


// =====================================
// Custom Leave Time Visibility
// =====================================

function handleLeaveDurationChange() {

    if (
        !leaveDuration ||
        !leaveTimeGroup ||
        !leaveTime
    ) {

        return;

    }

    const isCustomTime =
        leaveDuration.value ===
        "custom";

    if (
        isCustomTime
    ) {

        leaveTimeGroup.style.display =
            "";

        leaveTime.required =
            true;

        return;

    }

    leaveTimeGroup.style.display =
        "none";

    leaveTime.required =
        false;

    leaveTime.value =
        "";

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

            unpaidBreakMinutes =
                30;

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

        const timeParts =
            standardWorkStartTime
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

        unpaidBreakMinutes =
            30;

    }

}


// =====================================
// Employee Selection
// =====================================

async function handleEmployeeSelection() {

    if (
        employeeSelect &&
        employeeSelect.value &&
        attendanceWorkLocation
    ) {

        const selectedOption =
            employeeSelect.options[
                employeeSelect.selectedIndex
            ];

        const workArrangement =
            String(
                selectedOption.dataset.workArrangement ??
                "Office"
            ).trim();

        if (
            workArrangement ===
            "Remote"
        ) {

            attendanceWorkLocation.value =
                "Remote";

        } else if (
            workArrangement ===
            "Office"
        ) {

            attendanceWorkLocation.value =
                "Office";

        } else {

            // Hybrid employees require
            // the administrator to choose.
            attendanceWorkLocation.value =
                "";

        }

    }

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

    return `${year}-${month}-${day}`;

}


// =====================================
// Load Active Employees
// =====================================

async function loadEmployees() {

    if (
        !employeeSelect
    ) {

        return;

    }

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
                function (
                    employeeDocument
                ) {

                    return {

                        id:
                            employeeDocument.id,

                        ...employeeDocument.data()

                    };

                }
            );

        employees.sort(
            function (
                firstEmployee,
                secondEmployee
            ) {

                return String(
                    firstEmployee.name ??
                    ""
                ).localeCompare(
                    String(
                        secondEmployee.name ??
                        ""
                    )
                );

            }
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

                    option.dataset.workArrangement =
    String(
        employee.workArrangement ??
        "Office"
    ).trim()
    ||
    "Office";

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

    if (
        !employeeSelect
    ) {

        return null;

    }

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
// Reset Attendance Form
// =====================================

function resetAttendanceRecordFields() {

    if (
        attendanceStatus
    ) {

        attendanceStatus.value =
            "";

    }

    if (
    attendanceWorkLocation
) {

    attendanceWorkLocation.value =
        "";

}

    if (
        leaveDuration
    ) {

        leaveDuration.value =
            "";

    }

    if (
        leaveTime
    ) {

        leaveTime.value =
            "";

    }

    handleAttendanceStatusChange();

    handleLeaveDurationChange();

    if (
        attendanceNotes
    ) {

        attendanceNotes.value =
            "";

    }

}


// =====================================
// Load Existing Attendance Record
// =====================================

async function loadExistingAttendance() {

    const selectedDate =
        attendanceDate
            ?
            attendanceDate.value
            :
            "";

    if (
        !employeeSelect ||
        !employeeSelect.value ||
        !selectedDate
    ) {

        resetAttendanceRecordFields();

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

                if (
    attendanceWorkLocation
) {

    attendanceWorkLocation.value =
        String(
            attendance.workLocation ??
            "Office"
        ).trim()
        ||
        "Office";

}

            handleAttendanceStatusChange();

            if (
                leaveDuration
            ) {

                leaveDuration.value =
                    attendance.leaveDuration ??
                    "";

            }

            if (
                leaveTime
            ) {

                leaveTime.value =
                    attendance.leaveTime ??
                    "";

            }

            handleLeaveDurationChange();

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
                "Late"
                &&
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

            resetAttendanceRecordFields();

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
        !attendanceHistory
    ) {

        return;

    }

    if (
        !employeeSelect ||
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
                        attendance.dateKey ??
                        attendance.date
                    );

                const statusClass =
                    createStatusClass(
                        attendance.status
                    );

                const method =
                    attendance.checkInMethod ??
                    "Unknown";

                    const workLocation =
    String(
        attendance.workLocation ??
        "Office"
    ).trim()
    ||
    "Office";

                const notes =
                    String(
                        attendance.notes ??
                        ""
                    ).trim()
                    ||
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

                const storedLeaveDuration =
                    String(
                        attendance.leaveDuration ??
                        ""
                    ).trim();

                const storedLeaveTime =
                    String(
                        attendance.leaveTime ??
                        ""
                    ).trim();

                const leaveDurationDisplay =
                    formatLeaveDuration(
                        storedLeaveDuration
                    );

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

                                ${
                                    leaveDurationDisplay
                                        ?
                                        `
                                        <span>
                                            ${escapeHtml(
                                                leaveDurationDisplay
                                            )}
                                        </span>
                                        `
                                        :
                                        ""
                                }

                            </div>

                        </div>

                        <div class="history-summary-method">
                            ${escapeHtml(
                                method
                            )}
                        </div>

                    </summary>


                    <div class="history-expanded-clean">

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

                        <div class="history-clean-row">

    <span class="history-clean-label">
        Work Location
    </span>

    <span class="history-clean-value">
        ${escapeHtml(
            workLocation
        )}
    </span>

</div>

                        ${
                            leaveDurationDisplay
                                ?
                                `
                                <div class="history-clean-row">

                                    <span class="history-clean-label">
                                        Leave Duration
                                    </span>

                                    <span class="history-clean-value">
                                        ${escapeHtml(
                                            leaveDurationDisplay
                                        )}
                                    </span>

                                </div>
                                `
                                :
                                ""
                        }

                        ${
                            storedLeaveDuration ===
                            "custom"
                            &&
                            storedLeaveTime
                                ?
                                `
                                <div class="history-clean-row">

                                    <span class="history-clean-label">
                                        Leave / Departure Time
                                    </span>

                                    <span class="history-clean-value">
                                        ${escapeHtml(
                                            storedLeaveTime
                                        )}
                                    </span>

                                </div>
                                `
                                :
                                ""
                        }

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
// Format Leave Duration
// =====================================

function formatLeaveDuration(
    value
) {

    switch (
        value
    ) {

        case "full-day":

            return "Full Day";

        case "half-day":

            return "Half Day";

        case "custom":

            return "Custom Time";

        default:

            return "";

    }

}


// =====================================
// Load Attendance Summary
// =====================================

async function loadAttendanceSummary() {

    resetAttendanceSummary();

    if (
        !employeeSelect ||
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
                    case "Half Day":

                        leave++;

                        break;

                }

            }
        );

        if (
            summaryOnTime
        ) {

            summaryOnTime.textContent =
                onTime;

        }

        if (
            summaryLate
        ) {

            summaryLate.textContent =
                late;

        }

        if (
            summaryAbsent
        ) {

            summaryAbsent.textContent =
                absent;

        }

        if (
            summaryLeave
        ) {

            summaryLeave.textContent =
                leave;

        }

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

    if (
        summaryOnTime
    ) {

        summaryOnTime.textContent =
            "0";

    }

    if (
        summaryLate
    ) {

        summaryLate.textContent =
            "0";

    }

    if (
        summaryAbsent
    ) {

        summaryAbsent.textContent =
            "0";

    }

    if (
        summaryLeave
    ) {

        summaryLeave.textContent =
            "0";

    }

}


// =====================================
// Calculate Hours Worked
// =====================================

function calculateHoursWorked(
    attendance
) {

    if (
        !attendance.checkOutTime
        &&
        !attendance.checkOutTimestamp
    ) {

        return "In progress";

    }

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

    const checkInTimestamp =
        attendance.checkInTimestamp ??
        attendance.scanTimestamp;

    const checkOutTimestamp =
        attendance.checkOutTimestamp;

    if (
        checkInTimestamp
        &&
        checkOutTimestamp
        &&
        typeof checkInTimestamp.toDate ===
        "function"
        &&
        typeof checkOutTimestamp.toDate ===
        "function"
    ) {

        const actualCheckInDate =
            checkInTimestamp.toDate();

        const checkOutDate =
            checkOutTimestamp.toDate();

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

        const totalMinutes =
            deductUnpaidBreak(
                elapsedMinutes
            );

        return formatMinutesAsHours(
            totalMinutes
        );

    }

    if (
        attendance.time
        &&
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
            checkInParts.length <
            2
            ||
            checkOutParts.length <
            2
            ||
            checkInParts.some(
                Number.isNaN
            )
            ||
            checkOutParts.some(
                Number.isNaN
            )
        ) {

            return "Not available";

        }

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
            checkOutMinutes -
            effectiveCheckInMinutes;

        if (
            elapsedMinutes <
            0
        ) {

            return "Unable to calculate";

        }

        const totalMinutes =
            deductUnpaidBreak(
                elapsedMinutes
            );

        return formatMinutesAsHours(
            totalMinutes
        );

    }

    return "Not available";

}


// =====================================
// Deduct Unpaid Break
// =====================================

function deductUnpaidBreak(
    elapsedMinutes
) {

    if (
        elapsedMinutes >=
        360
    ) {

        return Math.max(
            0,
            elapsedMinutes -
            unpaidBreakMinutes
        );

    }

    return elapsedMinutes;

}


// =====================================
// Format Minutes As Hours
// =====================================

function formatMinutesAsHours(
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

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateKey
        );

    }

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
        attendanceDate
            ?
            attendanceDate.value
            :
            "";

    const selectedStatus =
        attendanceStatus
            ?
            attendanceStatus.value
            :
            "";

            const selectedWorkLocation =
    attendanceWorkLocation
        ?
        attendanceWorkLocation.value
        :
        "";

    const selectedLeaveDuration =
        leaveDuration
            ?
            leaveDuration.value
            :
            "";

    const selectedLeaveTime =
        leaveTime
            ?
            leaveTime.value
            :
            "";

    const notes =
        attendanceNotes
            ?
            attendanceNotes.value.trim()
            :
            "";


    // =====================================
    // Validation
    // =====================================

    if (
        !employeeSelect ||
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

    if (
    !selectedWorkLocation
) {

    showMessage(
        "Please select a work location.",
        "red"
    );

    return;

}

    if (
        LEAVE_STATUSES.includes(
            selectedStatus
        )
        &&
        !selectedLeaveDuration
    ) {

        showMessage(
            "Please select Full Day, Half Day or Custom Time.",
            "red"
        );

        return;

    }

    if (
        selectedLeaveDuration ===
        "custom"
        &&
        !selectedLeaveTime
    ) {

        showMessage(
            "Please enter the employee's leave / departure time.",
            "red"
        );

        return;

    }

    if (
        saveAttendanceButton
    ) {

        saveAttendanceButton.disabled =
            true;

        saveAttendanceButton.textContent =
            "Saving...";

    }

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

            throw new Error(
                "Employee not found."
            );

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

        const employeeAlreadyCheckedIn =
            Boolean(
                existingAttendance
                &&
                (
                    existingAttendance.time
                    ||
                    existingAttendance.scanTimestamp
                    ||
                    existingAttendance.checkInTimestamp
                )
            );

        const employeeAlreadyCheckedOut =
            Boolean(
                existingAttendance
                &&
                (
                    existingAttendance.checkOutTime
                    ||
                    existingAttendance.checkOutTimestamp
                )
            );

        const isCheckoutStatus =
            CHECKOUT_STATUSES.includes(
                selectedStatus
            );

        const isCustomLeaveTime =
            LEAVE_STATUSES.includes(
                selectedStatus
            )
            &&
            selectedLeaveDuration ===
            "custom"
            &&
            Boolean(
                selectedLeaveTime
            );

        const shouldWriteCheckout =
            recordAlreadyExists
            &&
            employeeAlreadyCheckedIn
            &&
            isCheckoutStatus
            &&
            (
                !employeeAlreadyCheckedOut
                ||
                isCustomLeaveTime
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

                workLocation:
    selectedWorkLocation,

            leaveDuration:
                LEAVE_STATUSES.includes(
                    selectedStatus
                )
                    ?
                    selectedLeaveDuration
                    :
                    "",

            leaveTime:
                LEAVE_STATUSES.includes(
                    selectedStatus
                )
                &&
                selectedLeaveDuration ===
                "custom"
                    ?
                    selectedLeaveTime
                    :
                    "",

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

            attendanceData.createdAt =
                serverTimestamp();

            if (
                !LEAVE_STATUSES.includes(
                    selectedStatus
                )
            ) {

                attendanceData.time =
                    currentTime;

            }

        }


        // =====================================
        // Automatic Checkout For Leave / Exit
        // =====================================

        if (
            shouldWriteCheckout
        ) {

            let effectiveCheckOutDate =
                new Date(
                    now
                );

            let effectiveCheckOutTime =
                currentTime;

            if (
                isCustomLeaveTime
            ) {

                const customDateTime =
                    buildDateTimeFromDateAndTime(
                        selectedDate,
                        selectedLeaveTime
                    );

                if (
                    !customDateTime
                ) {

                    throw new Error(
                        "Invalid custom leave time."
                    );

                }

                effectiveCheckOutDate =
                    customDateTime;

                effectiveCheckOutTime =
                    selectedLeaveTime;

            }

            attendanceData.checkOutTime =
                effectiveCheckOutTime;

            attendanceData.checkOutTimestamp =
                Timestamp.fromDate(
                    effectiveCheckOutDate
                );

            attendanceData.checkOutMethod =
                "Manual Adjustment";

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
                    2
                    &&
                    Number.isFinite(
                        endParts[0]
                    )
                    &&
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

                    const effectiveCheckoutMinutes =
                        (
                            effectiveCheckOutDate.getHours() *
                            60
                        )
                        +
                        effectiveCheckOutDate.getMinutes();

                    const isApprovedLeave =
    LEAVE_STATUSES.includes(
        selectedStatus
    );

if (
    isApprovedLeave
) {

    // Approved leave is not an
    // unauthorised early exit.
    attendanceData.earlyExit =
        false;

    attendanceData.earlyExitReason =
        "";

    attendanceData.earlyExitNote =
        "";

} else {

    const isApprovedLeave =
    LEAVE_STATUSES.includes(
        selectedStatus
    );

if (
    isApprovedLeave
) {

    attendanceData.earlyExit =
        false;

    attendanceData.earlyExitReason =
        "";

    attendanceData.earlyExitNote =
        "";

} else {

    attendanceData.earlyExit =
        effectiveCheckoutMinutes <
        scheduledEndMinutes;

}

}

                }

            }

        }

        // =====================================
// Approved Leave Must Not Count
// As An Early Exit
// =====================================

if (
    LEAVE_STATUSES.includes(
        selectedStatus
    )
) {

    attendanceData.earlyExit =
        false;

    attendanceData.earlyExitReason =
        "";

    attendanceData.earlyExitNote =
        "";

}

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

        await loadExistingAttendance();

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

        if (
            saveAttendanceButton
        ) {

            saveAttendanceButton.disabled =
                false;

            saveAttendanceButton.textContent =
                "Save Attendance";

        }

    }

}


// =====================================
// Build Date + Time
// =====================================

function buildDateTimeFromDateAndTime(
    dateKey,
    timeValue
) {

    const dateParts =
        String(
            dateKey
        )
            .split("-")
            .map(Number);

    const timeParts =
        String(
            timeValue
        )
            .split(":")
            .map(Number);

    if (
        dateParts.length !==
        3
        ||
        timeParts.length <
        2
        ||
        !dateParts.every(
            Number.isFinite
        )
        ||
        !timeParts.slice(
            0,
            2
        ).every(
            Number.isFinite
        )
    ) {

        return null;

    }

    const result =
        new Date(
            dateParts[0],
            dateParts[1] -
            1,
            dateParts[2],
            timeParts[0],
            timeParts[1],
            0,
            0
        );

    if (
        Number.isNaN(
            result.getTime()
        )
    ) {

        return null;

    }

    return result;

}


// =====================================
// Build Attendance Calendar
// =====================================

async function buildCalendar() {

    if (
        !calendarGrid ||
        !calendarTitle
    ) {

        return;

    }

    calendarGrid.innerHTML =
        "";

    if (
        !employeeSelect ||
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

                const recordDate =
    String(
        record.dateKey ??
        ""
    ).trim();

if (
    recordDate &&
    recordDate >= monthStartKey &&
    recordDate <= monthEndKey
) {

    attendanceByDate[
        recordDate
    ] =
        record;

}

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

        let title =
            attendanceRecord.status ??
            "Attendance recorded";

            const workLocation =
    String(
        attendanceRecord.workLocation ??
        "Office"
    ).trim()
    ||
    "Office";

title +=
    ` — ${workLocation}`;

        const durationLabel =
            formatLeaveDuration(
                attendanceRecord.leaveDuration
            );

        if (
            durationLabel
        ) {

            title +=
                ` — ${durationLabel}`;

        }

        if (
            attendanceRecord.leaveDuration ===
            "custom"
            &&
            attendanceRecord.leaveTime
        ) {

            title +=
                ` (${attendanceRecord.leaveTime})`;

        }

        dayCell.title =
            title;

    }

    const today =
        new Date();

    const isToday =
        day ===
        today.getDate()
        &&
        calendarMonth ===
        today.getMonth()
        &&
        calendarYear ===
        today.getFullYear();

    if (
        isToday
    ) {

        dayCell.classList.add(
            "calendar-today"
        );

    }

    let calendarStatusText =
    "";

if (
    attendanceRecord
) {

    calendarStatusText =
        String(
            attendanceRecord.status ??
            ""
        ).trim();

}

dayCell.innerHTML = `
    <strong>
        ${day}
    </strong>

    ${
        calendarStatusText
            ?
            `
                <span class="calendar-day-status">
                    ${escapeHtml(calendarStatusText)}
                </span>
            `
            :
            ""
    }
`;

    dayCell.style.cursor =
        "pointer";

    dayCell.addEventListener(
        "click",
        async function () {

            if (
                attendanceDate
            ) {

                attendanceDate.value =
                    currentDateKey;

            }

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

