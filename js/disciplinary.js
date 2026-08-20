// =====================================
// R-E-D Attendance
// Disciplinary Management
// =====================================

import "./admin-session.js";


// =====================================
// Firebase
// =====================================

import {
    db,
    auth
} from "../firebase/firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    applySidebarPermissions,
    protectPage,
    currentAdministratorRole
} from "./role-permissions.js";


// =====================================
// Page Elements
// =====================================

const assignWarningButton =
    document.getElementById(
        "assignWarningButton"
    );

const warningModal =
    document.getElementById(
        "warningModal"
    );

const closeWarningModalButton =
    document.getElementById(
        "closeWarningModalButton"
    );

const cancelWarningButton =
    document.getElementById(
        "cancelWarningButton"
    );

const warningForm =
    document.getElementById(
        "warningForm"
    );

const warningEmployee =
    document.getElementById(
        "warningEmployee"
    );

const warningType =
    document.getElementById(
        "warningType"
    );

const warningDate =
    document.getElementById(
        "warningDate"
    );

const warningReason =
    document.getElementById(
        "warningReason"
    );

const saveWarningButton =
    document.getElementById(
        "saveWarningButton"
    );

const warningMessage =
    document.getElementById(
        "warningMessage"
    );

const disciplinaryTableBody =
    document.getElementById(
        "disciplinaryTableBody"
    );

const attendanceTrends =
    document.getElementById(
        "attendanceTrends"
    );

const notification =
    document.getElementById(
        "notification"
    );

const notificationMessage =
    document.getElementById(
        "notificationMessage"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// =====================================
// Page State
// =====================================

let employees = [];

let managerDepartment =
    "";

let currentAdministratorProfile =
    null;


// =====================================
// Trend Settings
// =====================================

let CONSECUTIVE_LATE_THRESHOLD =
    3;

    let FREQUENT_LATE_DAY_THRESHOLD =
    3;

let FREQUENT_LATE_DAY_LOOKBACK_DAYS =
    30;

let FREQUENT_EARLY_EXIT_THRESHOLD =
    3;

let FREQUENT_EARLY_EXIT_LOOKBACK_DAYS =
    30;

let WEEKDAY_PATTERN_MIN_RECORDS =
    3;

let WEEKDAY_PATTERN_PERCENTAGE =
    50;

let MONDAY_FRIDAY_MIN_RECORDS =
    3;

let MONDAY_FRIDAY_PERCENTAGE =
    60;

let FREQUENT_ABSENCE_THRESHOLD =
    5;

let FREQUENT_ABSENCE_LOOKBACK_DAYS =
    30;

let FREQUENT_SICK_DAY_THRESHOLD =
    3;

let FREQUENT_SICK_DAY_LOOKBACK_DAYS =
    30;

let SHORT_WORKDAY_HOURS =
    6;

let SHORT_WORKDAY_THRESHOLD =
    3;

let SHORT_WORKDAY_LOOKBACK_DAYS =
    30;

    let STANDARD_WORK_START_TIME =
    "08:00";


// =====================================
// Initialize Page
// =====================================

initializeDisciplinaryPage();

function initializeDisciplinaryPage() {

    if (
        !protectPage(
            "disciplinary"
        )
    ) {

        return;

    }

    applySidebarPermissions();

    setDefaultWarningDate();

    if (
        assignWarningButton
    ) {

        assignWarningButton.addEventListener(
            "click",
            openWarningModal
        );

    }

    if (
        closeWarningModalButton
    ) {

        closeWarningModalButton.addEventListener(
            "click",
            closeWarningModal
        );

    }

    if (
        cancelWarningButton
    ) {

        cancelWarningButton.addEventListener(
            "click",
            closeWarningModal
        );

    }

    if (
        warningModal
    ) {

        warningModal.addEventListener(
            "click",
            function (
                event
            ) {

                if (
                    event.target ===
                    warningModal
                ) {

                    closeWarningModal();

                }

            }
        );

    }

    if (
        warningForm
    ) {

        warningForm.addEventListener(
            "submit",
            saveWarning
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

    loadDisciplinaryData();

}


// =====================================
// Load Disciplinary Data
// =====================================

async function loadDisciplinaryData() {

    await loadCurrentAdministratorProfile();

    await loadTrendSettings();

    await loadEmployees();

    await loadAttendanceTrends();

    await loadWarnings();

}


// =====================================
// Administrator Profile
// =====================================

async function loadCurrentAdministratorProfile() {

    try {

        const currentUser =
            auth.currentUser;

        if (
            !currentUser
        ) {

            return;

        }

        const administratorReference =
            doc(
                db,
                "administrators",
                currentUser.uid
            );

        const administratorSnapshot =
            await getDoc(
                administratorReference
            );

        if (
            !administratorSnapshot.exists()
        ) {

            return;

        }

        currentAdministratorProfile =
            administratorSnapshot.data();

        if (
            currentAdministratorRole ===
            "manager"
        ) {

            managerDepartment =
                String(
                    currentAdministratorProfile.department ??
                    ""
                ).trim();

        }

    } catch (
        error
    ) {

        console.error(
            "Load administrator profile error:",
            error
        );

    }

}

// =====================================
// Load Trend Settings
// =====================================

async function loadTrendSettings() {

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


        CONSECUTIVE_LATE_THRESHOLD =
            Number(
                settings.consecutiveLateThreshold ??
                3
            );

            FREQUENT_LATE_DAY_THRESHOLD =
    Number(
        settings.frequentLateDayThreshold ??
        3
    );

FREQUENT_LATE_DAY_LOOKBACK_DAYS =
    Number(
        settings.frequentLateDayLookbackDays ??
        30
    );

        FREQUENT_EARLY_EXIT_THRESHOLD =
            Number(
                settings.frequentEarlyExitThreshold ??
                3
            );

            FREQUENT_EARLY_EXIT_LOOKBACK_DAYS =
    Number(
        settings.frequentEarlyExitLookbackDays ??
        30
    );

        WEEKDAY_PATTERN_MIN_RECORDS =
            Number(
                settings.weekdayPatternMinRecords ??
                3
            );

        WEEKDAY_PATTERN_PERCENTAGE =
            Number(
                settings.weekdayPatternPercentage ??
                50
            );

        MONDAY_FRIDAY_MIN_RECORDS =
            Number(
                settings.mondayFridayMinRecords ??
                3
            );

        MONDAY_FRIDAY_PERCENTAGE =
            Number(
                settings.mondayFridayPercentage ??
                60
            );

        FREQUENT_ABSENCE_THRESHOLD =
            Number(
                settings.frequentAbsenceThreshold ??
                5
            );

        FREQUENT_ABSENCE_LOOKBACK_DAYS =
            Number(
                settings.frequentAbsenceLookbackDays ??
                30
            );

            FREQUENT_SICK_DAY_THRESHOLD =
    Number(
        settings.frequentSickDayThreshold ??
        3
    );

FREQUENT_SICK_DAY_LOOKBACK_DAYS =
    Number(
        settings.frequentSickDayLookbackDays ??
        30
    );

        SHORT_WORKDAY_HOURS =
            Number(
                settings.shortWorkdayHours ??
                6
            );

        SHORT_WORKDAY_THRESHOLD =
            Number(
                settings.shortWorkdayThreshold ??
                3
            );

        SHORT_WORKDAY_LOOKBACK_DAYS =
            Number(
                settings.shortWorkdayLookbackDays ??
                30
            );

            STANDARD_WORK_START_TIME =
    String(
        settings.standardStartTime ??
        "08:00"
    ).trim();

    } catch (
        error
    ) {

        console.error(
            "Load trend settings error:",
            error
        );

    }

}


// =====================================
// Default Warning Date
// =====================================

function setDefaultWarningDate() {

    if (
        !warningDate
    ) {

        return;

    }

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );

    warningDate.value =
        `${year}-${month}-${day}`;

}


// =====================================
// Notification
// =====================================

function showNotification(
    message,
    type = "success"
) {

    if (
        !notification ||
        !notificationMessage
    ) {

        console.log(
            message
        );

        return;

    }

    notificationMessage.textContent =
        message;

    notification.classList.remove(
        "error",
        "warning"
    );

    if (
        type ===
        "error"
    ) {

        notification.classList.add(
            "error"
        );

    }

    if (
        type ===
        "warning"
    ) {

        notification.classList.add(
            "warning"
        );

    }

    notification.classList.add(
        "show"
    );

    setTimeout(
        function () {

            notification.classList.remove(
                "show"
            );

        },
        3000
    );

}


// =====================================
// Open Warning Modal
// =====================================

function openWarningModal() {

    if (
        !warningForm ||
        !warningModal
    ) {

        return;

    }

    warningForm.reset();

    setDefaultWarningDate();

    populateEmployeeDropdown();

    if (
        warningMessage
    ) {

        warningMessage.textContent =
            "";

    }

    warningModal.classList.add(
        "active"
    );

}


// =====================================
// Close Warning Modal
// =====================================

function closeWarningModal() {

    if (
        warningModal
    ) {

        warningModal.classList.remove(
            "active"
        );

    }

    if (
        warningForm
    ) {

        warningForm.reset();

    }

    if (
        warningMessage
    ) {

        warningMessage.textContent =
            "";

    }

}


// =====================================
// Load Employees
// =====================================

async function loadEmployees() {

    try {

        let employeeQuery;

        if (
            currentAdministratorRole ===
            "manager"
        ) {

            employeeQuery =
                query(
                    collection(
                        db,
                        "employees"
                    ),
                    where(
                        "department",
                        "==",
                        managerDepartment
                    )
                );

        } else {

            employeeQuery =
                collection(
                    db,
                    "employees"
                );

        }

        const snapshot =
            await getDocs(
                employeeQuery
            );

        employees =
            snapshot.docs.map(
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

        employees =
            employees.filter(
                function (
                    employee
                ) {

                    const isActive =
                        employee.active !==
                        false;

                    if (
                        !isActive
                    ) {

                        return false;

                    }

                    if (
                        currentAdministratorRole ===
                        "manager"
                    ) {

                        return (
                            String(
                                employee.department ??
                                ""
                            ).trim() ===
                            managerDepartment
                        );

                    }

                    return true;

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

        populateEmployeeDropdown();

    } catch (
        error
    ) {

        console.error(
            "Unable to load employees:",
            error
        );

        showNotification(
            "❌ Employees could not be loaded.",
            "error"
        );

    }

}


// =====================================
// Load Attendance Trends
// =====================================

async function loadAttendanceTrends() {

    if (
        !attendanceTrends
    ) {

        return;

    }

    attendanceTrends.innerHTML = `
        <p class="empty-row">
            Analysing attendance trends...
        </p>
    `;

    try {

        let attendanceQuery;

        if (
            currentAdministratorRole ===
            "manager"
        ) {

            attendanceQuery =
                query(
                    collection(
                        db,
                        "attendance"
                    ),
                    where(
                        "department",
                        "==",
                        managerDepartment
                    )
                );

        } else {

            attendanceQuery =
                collection(
                    db,
                    "attendance"
                );

        }

        const attendanceSnapshot =
            await getDocs(
                attendanceQuery
            );

        const attendanceRecords =
            attendanceSnapshot.docs.map(
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

        const trendFlags =
            [];

        employees.forEach(
            function (
                employee
            ) {

                const employeeRecords =
                    attendanceRecords
                        .filter(
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
                        )
                        .sort(
                            function (
                                firstRecord,
                                secondRecord
                            ) {

                                return String(
                                    firstRecord.dateKey ??
                                    firstRecord.date ??
                                    ""
                                ).localeCompare(
                                    String(
                                        secondRecord.dateKey ??
                                        secondRecord.date ??
                                        ""
                                    )
                                );

                            }
                        );


                // =====================================
                // Consecutive Lateness
                // =====================================

                const consecutiveLateDays =
                    calculateConsecutiveLateDays(
                        employeeRecords
                    );

                    const lateRecords =
    employeeRecords.filter(
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

const recentLateDayCount =
    countRecordsWithinLastDays(
        lateRecords,
        FREQUENT_LATE_DAY_LOOKBACK_DAYS
    );


                // =====================================
                // Early Exit Data
                // =====================================

                const earlyExitRecords =
                    employeeRecords.filter(
                        function (
                            record
                        ) {

                            return (
                                record.earlyExit ===
                                true
                            );

                        }
                    );

                const earlyExitCount =
    countRecordsWithinLastDays(
        earlyExitRecords,
        FREQUENT_EARLY_EXIT_LOOKBACK_DAYS
    );

                const earlyExitDayPattern =
                    detectWeekdayPattern(
                        earlyExitRecords
                    );


                // =====================================
                // Sick Leave Data
                // =====================================

                const sickLeaveRecords =
                    employeeRecords.filter(
                        function (
                            record
                        ) {

                            return (
                                normalizeStatus(
                                    record.status
                                ) ===
                                "sick leave"
                            );

                        }
                    );

                const sickDayPattern =
                    detectWeekdayPattern(
                        sickLeaveRecords
                    );

                    const recentSickDayCount =
    countRecordsWithinLastDays(
        sickLeaveRecords,
        FREQUENT_SICK_DAY_LOOKBACK_DAYS
    );


               // =====================================
// Absent Day Data
// =====================================

const absentRecords =
    employeeRecords.filter(
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

const mondayFridayPattern =
    detectMondayFridayPattern(
        absentRecords
    );

const recentAbsenceCount =
    countRecordsWithinLastDays(
        absentRecords,
        FREQUENT_ABSENCE_LOOKBACK_DAYS
    );


                // =====================================
                // Short Working Days
                // =====================================

                const shortWorkdayCount =
                    countShortWorkdaysWithinLastDays(
                        employeeRecords,
                        SHORT_WORKDAY_LOOKBACK_DAYS,
                        SHORT_WORKDAY_HOURS
                    );


                // =====================================
                // Consecutive Late Flag
                // =====================================

                if (
                    consecutiveLateDays >=
                    CONSECUTIVE_LATE_THRESHOLD
                ) {

                    trendFlags.push({

                        employee:
                            employee,

                        type:
                            "Consecutive Lateness",

                        detail:
                            "Late "
                            +
                            consecutiveLateDays
                            +
                            " attendance days in a row."

                    });

                }

                // =====================================
// Frequent Late Days Flag
// =====================================

if (
    recentLateDayCount >=
    FREQUENT_LATE_DAY_THRESHOLD
) {

    trendFlags.push({

        employee:
            employee,

        type:
            "Frequent Late Days",

        detail:
            recentLateDayCount
            +
            " late attendance days have been recorded "
            +
            "in the last "
            +
            FREQUENT_LATE_DAY_LOOKBACK_DAYS
            +
            " days."

    });

}


                // =====================================
                // Frequent Early Exit Flag
                // =====================================

                if (
                    earlyExitCount >=
                    FREQUENT_EARLY_EXIT_THRESHOLD
                ) {

                    trendFlags.push({

                        employee:
                            employee,

                        type:
    "Frequent Early Check-Outs",

detail:
    earlyExitCount
    +
    " early check-outs have been recorded."

                    });

                }


                // =====================================
                // Early Exit Weekday Pattern
                // =====================================

                if (
                    earlyExitDayPattern
                ) {

                    trendFlags.push({

                        employee:
                            employee,

                        type:
                            "Early Exit Pattern",

                        detail:
                            earlyExitDayPattern.count
                            +
                            " of "
                            +
                            earlyExitDayPattern.total
                            +
                            " early exits occurred on "
                            +
                            earlyExitDayPattern.dayName
                            +
                            "s ("
                            +
                            earlyExitDayPattern.percentage
                            +
                            "%)."

                    });

                }


                // =====================================
                // Sick Leave Weekday Pattern
                // =====================================

                if (
                    sickDayPattern
                ) {

                    trendFlags.push({

                        employee:
                            employee,

                        type:
                            "Sick-Day Pattern",

                        detail:
                            sickDayPattern.count
                            +
                            " of "
                            +
                            sickDayPattern.total
                            +
                            " sick leave records occurred on "
                            +
                            sickDayPattern.dayName
                            +
                            "s ("
                            +
                            sickDayPattern.percentage
                            +
                            "%)."

                    });

                }

                // =====================================
// Frequent Sick Days Flag
// =====================================

if (
    recentSickDayCount >=
    FREQUENT_SICK_DAY_THRESHOLD
) {

    trendFlags.push({

        employee:
            employee,

        type:
            "Frequent Sick Days",

        detail:
            recentSickDayCount
            +
            " sick leave days have been recorded "
            +
            "in the last "
            +
            FREQUENT_SICK_DAY_LOOKBACK_DAYS
            +
            " days."

    });

}


                // =====================================
                // Monday / Friday Absence Pattern
                // =====================================

                if (
                    mondayFridayPattern
                ) {

                    trendFlags.push({

                        employee:
                            employee,

                        type:
                            "Monday / Friday Absence Pattern",

                        detail:
                            mondayFridayPattern.edgeOfWeekCount
                            +
                            " of "
                            +
                            mondayFridayPattern.total
                            +
                            " absence-related records occurred on "
                            +
                            "Mondays or Fridays ("
                            +
                            mondayFridayPattern.percentage
                            +
                            "%)."

                    });

                }


                // =====================================
                // Frequent Absence Flag
                // =====================================

                if (
                    recentAbsenceCount >=
                    FREQUENT_ABSENCE_THRESHOLD
                ) {

                    trendFlags.push({

                        employee:
                            employee,

                        type:
    "Frequent Absent Days",

detail:
    recentAbsenceCount
    +
    " absent days have been recorded "
    +
    "in the last "
    +
    FREQUENT_ABSENCE_LOOKBACK_DAYS
    +
    " days."

                    });

                }


                // =====================================
                // Short Working Day Flag
                // =====================================

                if (
                    shortWorkdayCount >=
                    SHORT_WORKDAY_THRESHOLD
                ) {

                    trendFlags.push({

                        employee:
                            employee,

                        type:
                            "Repeated Short Working Days",

                        detail:
                            shortWorkdayCount
                            +
                            " completed working days in the last "
                            +
                            SHORT_WORKDAY_LOOKBACK_DAYS
                            +
                            " days were shorter than "
                            +
                            SHORT_WORKDAY_HOURS
                            +
                            " hours."

                    });

                }

            }
        );

        displayAttendanceTrends(
            trendFlags
        );

    } catch (
        error
    ) {

        console.error(
            "Attendance trends error:",
            error
        );

        attendanceTrends.innerHTML = `
            <p class="empty-row">
                Attendance trends could not be analysed.
            </p>
        `;

    }

}


// =====================================
// Calculate Consecutive Late Days
// =====================================

function calculateConsecutiveLateDays(
    records
) {

    let currentStreak =
        0;

    let longestStreak =
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
                "late"
            ) {

                currentStreak++;

                if (
                    currentStreak >
                    longestStreak
                ) {

                    longestStreak =
                        currentStreak;

                }

            } else {

                currentStreak =
                    0;

            }

        }
    );

    return longestStreak;

}


// =====================================
// Detect Weekday Pattern
// =====================================

function detectWeekdayPattern(
    records
) {

    if (
        records.length <
        WEEKDAY_PATTERN_MIN_RECORDS
    ) {

        return null;

    }

    const weekdayCounts =
        {};

    let validRecordCount =
        0;

    records.forEach(
        function (
            record
        ) {

            const dateKey =
                record.dateKey ??
                record.date;

            if (
                !dateKey
            ) {

                return;

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

                return;

            }

            const dayName =
                date.toLocaleDateString(
                    "en-ZA",
                    {
                        weekday:
                            "long"
                    }
                );

            if (
                !weekdayCounts[
                    dayName
                ]
            ) {

                weekdayCounts[
                    dayName
                ] = 0;

            }

            weekdayCounts[
                dayName
            ]++;

            validRecordCount++;

        }
    );

    if (
        validRecordCount <
        WEEKDAY_PATTERN_MIN_RECORDS
    ) {

        return null;

    }

    const entries =
        Object.entries(
            weekdayCounts
        );

    if (
        entries.length ===
        0
    ) {

        return null;

    }

    entries.sort(
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

    const [
        dayName,
        count
    ] =
        entries[0];

    const percentage =
        Math.round(
            (
                count /
                validRecordCount
            )
            *
            100
        );

    if (
        percentage <
        WEEKDAY_PATTERN_PERCENTAGE
    ) {

        return null;

    }

    return {

        dayName:
            dayName,

        count:
            count,

        total:
            validRecordCount,

        percentage:
            percentage

    };

}


// =====================================
// Detect Monday / Friday Pattern
// =====================================

function detectMondayFridayPattern(
    records
) {

    if (
        records.length <
        MONDAY_FRIDAY_MIN_RECORDS
    ) {

        return null;

    }

    let edgeOfWeekCount =
        0;

    let validRecordCount =
        0;

    records.forEach(
        function (
            record
        ) {

            const dateKey =
                record.dateKey ??
                record.date;

            if (
                !dateKey
            ) {

                return;

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

                return;

            }

            validRecordCount++;

            const day =
                date.getDay();

            if (
                day === 1 ||
                day === 5
            ) {

                edgeOfWeekCount++;

            }

        }
    );

    if (
        validRecordCount <
        MONDAY_FRIDAY_MIN_RECORDS
    ) {

        return null;

    }

    const percentage =
        Math.round(
            (
                edgeOfWeekCount /
                validRecordCount
            )
            *
            100
        );

    if (
        percentage <
        MONDAY_FRIDAY_PERCENTAGE
    ) {

        return null;

    }

    return {

        edgeOfWeekCount:
            edgeOfWeekCount,

        total:
            validRecordCount,

        percentage:
            percentage

    };

}


// =====================================
// Count Records Within Last Days
// =====================================

function countRecordsWithinLastDays(
    records,
    numberOfDays
) {

    const today =
        new Date();

    today.setHours(
        23,
        59,
        59,
        999
    );

    const startDate =
        new Date(
            today
        );

    startDate.setDate(
        startDate.getDate()
        -
        numberOfDays
        +
        1
    );

    startDate.setHours(
        0,
        0,
        0,
        0
    );

    return records.filter(
        function (
            record
        ) {

            const dateKey =
                record.dateKey ??
                record.date;

            if (
                !dateKey
            ) {

                return false;

            }

            const recordDate =
                new Date(
                    `${dateKey}T00:00:00`
                );

            if (
                Number.isNaN(
                    recordDate.getTime()
                )
            ) {

                return false;

            }

            return (
                recordDate >=
                startDate
                &&
                recordDate <=
                today
            );

        }
    ).length;

}


// =====================================
// Count Short Workdays
// =====================================

function countShortWorkdaysWithinLastDays(
    records,
    numberOfDays,
    shortDayHours
) {

    const today =
        new Date();

    today.setHours(
        23,
        59,
        59,
        999
    );

    const startDate =
        new Date(
            today
        );

    startDate.setDate(
        startDate.getDate()
        -
        numberOfDays
        +
        1
    );

    startDate.setHours(
        0,
        0,
        0,
        0
    );

    return records.filter(
        function (
            record
        ) {

            if (
                !record.checkOutTime
            ) {

                return false;

            }

            const status =
                normalizeStatus(
                    record.status
                );

            if (
                status !== "on time" &&
                status !== "late" &&
                status !== "checked in"
            ) {

                return false;

            }

            const dateKey =
                record.dateKey ??
                record.date;

            if (
                !dateKey
            ) {

                return false;

            }

            const recordDate =
                new Date(
                    `${dateKey}T00:00:00`
                );

            if (
                Number.isNaN(
                    recordDate.getTime()
                )
            ) {

                return false;

            }

            if (
                recordDate <
                startDate ||
                recordDate >
                today
            ) {

                return false;

            }

            const workedMinutes =
                calculateWorkedMinutesForTrend(
                    record
                );

            if (
                workedMinutes ===
                null
            ) {

                return false;

            }

            return (
                workedMinutes <
                shortDayHours *
                60
            );

        }
    ).length;

}


// =====================================
// Calculate Worked Minutes
// =====================================

function calculateWorkedMinutesForTrend(
    record
) {

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
        STANDARD_WORK_START_TIME
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


    // =====================================
    // Fallback to stored times
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
                .map(
                    Number
                );

        const checkOutParts =
            String(
                record.checkOutTime
            )
                .split(":")
                .map(
                    Number
                );

        if (
            checkInParts.length >= 2 &&
            checkOutParts.length >= 2
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
        STANDARD_WORK_START_TIME
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

                return totalMinutes;

            }

        }

    }

    return null;

}


// =====================================
// Normalize Status
// =====================================

function normalizeStatus(
    status
) {

    return String(
        status ??
        ""
    )
        .trim()
        .toLowerCase();

}


// =====================================
// Display Attendance Trends
// =====================================

function displayAttendanceTrends(
    trendFlags
) {

    if (
        !attendanceTrends
    ) {

        return;

    }

    attendanceTrends.innerHTML =
        "";

    if (
        trendFlags.length ===
        0
    ) {

        attendanceTrends.innerHTML = `
            <p class="empty-row">
                No attendance behaviour trends currently require review.
            </p>
        `;

        return;

    }

    trendFlags.forEach(
        function (
            trend
        ) {

            const trendCard =
                document.createElement(
                    "div"
                );

            trendCard.className =
                "attendance-trend-card";

            trendCard.innerHTML = `

                <strong>
                    ${escapeHtml(
                        trend.employee.name ??
                        "Unknown Employee"
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        trend.employee.employeeNumber ??
                        "-"
                    )}
                </span>

                <p>
                    ⚠ ${escapeHtml(
                        trend.type
                    )}
                </p>

                <p>
                    ${escapeHtml(
                        trend.detail
                    )}
                </p>

            `;

            attendanceTrends.appendChild(
                trendCard
            );

        }
    );

}


// =====================================
// Populate Employee Dropdown
// =====================================

function populateEmployeeDropdown() {

    if (
        !warningEmployee
    ) {

        return;

    }

    warningEmployee.innerHTML = `
        <option value="">
            Select employee
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
                `${employee.employeeNumber ?? "-"} - ${employee.name ?? "Unnamed Employee"}`;

            warningEmployee.appendChild(
                option
            );

        }
    );

}


// =====================================
// Find Employee
// =====================================

function findEmployee(
    employeeId
) {

    return employees.find(
        function (
            employee
        ) {

            return (
                employee.id ===
                employeeId
            );

        }
    );

}


// =====================================
// Save Warning
// =====================================

async function saveWarning(
    event
) {

    event.preventDefault();

    const employeeId =
        warningEmployee.value;

    const selectedWarningType =
        warningType.value;

    const selectedWarningDate =
        warningDate.value;

    const reason =
        warningReason.value
            .trim();

    if (
        !employeeId ||
        !selectedWarningType ||
        !selectedWarningDate
    ) {

        warningMessage.style.color =
            "red";

        warningMessage.textContent =
            "Please complete all required fields.";

        return;

    }

    const employee =
        findEmployee(
            employeeId
        );

    if (
        !employee
    ) {

        warningMessage.style.color =
            "red";

        warningMessage.textContent =
            "Employee could not be found.";

        return;

    }

    try {

        saveWarningButton.disabled =
            true;

        saveWarningButton.textContent =
            "Saving...";

        warningMessage.style.color =
            "#0b5ed7";

        warningMessage.textContent =
            "Saving warning...";

        const currentUser =
            auth.currentUser;

        const assignedByName =
            sessionStorage.getItem(
                "adminName"
            )
            ||
            currentUser?.email
            ||
            "Unknown Administrator";

        const assignedByUid =
            currentUser?.uid ??
            "";

        await addDoc(
            collection(
                db,
                "disciplinaryWarnings"
            ),
            {

                employeeId:
                    employee.id,

                employeeNumber:
                    employee.employeeNumber ??
                    "",

                employeeName:
                    employee.name ??
                    "",

                department:
                    employee.department ??
                    "",

                warningType:
                    selectedWarningType,

                warningDate:
                    selectedWarningDate,

                reason:
                    reason,

                assignedByUid:
                    assignedByUid,

                assignedByName:
                    assignedByName,

                createdAt:
                    serverTimestamp()

            }
        );

        showNotification(
            "✅ Warning assigned successfully."
        );

        closeWarningModal();

        await loadWarnings();

    } catch (
        error
    ) {

        console.error(
            "Save warning error:",
            error
        );

        warningMessage.style.color =
            "red";

        warningMessage.textContent =
            "Warning could not be saved.";

    } finally {

        saveWarningButton.disabled =
            false;

        saveWarningButton.textContent =
            "Save Warning";

    }

}


// =====================================
// Load Warning History
// =====================================

async function loadWarnings() {

    if (
        !disciplinaryTableBody
    ) {

        return;

    }

    disciplinaryTableBody.innerHTML = `
        <tr>

            <td
                colspan="7"
                class="empty-row"
            >
                Loading disciplinary warnings...
            </td>

        </tr>
    `;

    try {

        let warningsQuery;

        if (
            currentAdministratorRole ===
            "manager"
        ) {

            warningsQuery =
                query(
                    collection(
                        db,
                        "disciplinaryWarnings"
                    ),
                    where(
                        "department",
                        "==",
                        managerDepartment
                    )
                );

        } else {

            warningsQuery =
                query(
                    collection(
                        db,
                        "disciplinaryWarnings"
                    ),
                    orderBy(
                        "warningDate",
                        "desc"
                    )
                );

        }

        const snapshot =
            await getDocs(
                warningsQuery
            );

        disciplinaryTableBody.innerHTML =
            "";

        if (
            snapshot.empty
        ) {

            disciplinaryTableBody.innerHTML = `
                <tr>

                    <td
                        colspan="7"
                        class="empty-row"
                    >
                        No disciplinary warnings have been recorded.
                    </td>

                </tr>
            `;

            return;

        }

        const warnings =
            snapshot.docs.map(
                function (
                    warningDocument
                ) {

                    return {

                        id:
                            warningDocument.id,

                        ...warningDocument.data()

                    };

                }
            );

        warnings.sort(
            function (
                firstWarning,
                secondWarning
            ) {

                return String(
                    secondWarning.warningDate ??
                    ""
                ).localeCompare(
                    String(
                        firstWarning.warningDate ??
                        ""
                    )
                );

            }
        );

        warnings.forEach(
            function (
                warning
            ) {

                if (
                    currentAdministratorRole ===
                    "manager"
                    &&
                    String(
                        warning.department ??
                        ""
                    ).trim() !==
                    managerDepartment
                ) {

                    return;

                }

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `

                    <td>
                        ${escapeHtml(
                            formatWarningDate(
                                warning.warningDate
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.employeeName ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.employeeNumber ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.department ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.warningType ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.reason ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.assignedByName ??
                            "-"
                        )}
                    </td>

                `;

                disciplinaryTableBody.appendChild(
                    row
                );

            }
        );

    } catch (
        error
    ) {

        console.error(
            "Unable to load warnings:",
            error
        );

        disciplinaryTableBody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    class="empty-row"
                >
                    Unable to load disciplinary warnings.
                </td>

            </tr>
        `;

    }

}


// =====================================
// Format Warning Date
// =====================================

function formatWarningDate(
    dateKey
) {

    if (
        !dateKey
    ) {

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

        alert(
            "Unable to log out. Please try again."
        );

    }

}