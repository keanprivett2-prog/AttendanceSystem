// =====================================
// R-E-D Attendance
// Shared Admin Notifications
// =====================================

import {
    db
} from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================
// Page Elements
// =====================================

const notificationBellButton =
    document.getElementById(
        "notificationBellButton"
    );

const notificationBadge =
    document.getElementById(
        "notificationBadge"
    );

const notificationPanel =
    document.getElementById(
        "notificationPanel"
    );

const notificationList =
    document.getElementById(
        "notificationList"
    );


// =====================================
// Current Administrator
// =====================================

let currentAdministrator =
    null;


// =====================================
// Initialize Notifications
// =====================================

initializeAdminNotifications();

async function initializeAdminNotifications() {

    await loadCurrentAdministrator();

    await detectMissingCheckOuts();

    await refreshAdminNotifications();


    if (
        notificationBellButton &&
        notificationPanel
    ) {

        notificationBellButton.addEventListener(
            "click",
            function () {

                notificationPanel.hidden =
                    !notificationPanel.hidden;

            }
        );

    }


    if (
        notificationList
    ) {

        notificationList.addEventListener(
            "click",
            function (
                event
            ) {

                const actionButton =
                    event.target.closest(
                        ".notification-action-button"
                    );


                if (
                    !actionButton
                ) {

                    return;

                }


                const notificationId =
                    actionButton.dataset.notificationId;


                if (
                    !notificationId
                ) {

                    return;

                }


                sessionStorage.setItem(
                    "activeMissingCheckOutNotificationId",
                    notificationId
                );


                window.location.href =
                    "attendance-management.html";

            }
        );

    }

}


// =====================================
// Load Current Administrator
// =====================================

async function loadCurrentAdministrator() {

    const administratorUid =
        sessionStorage.getItem(
            "adminUID"
        );


    if (
        !administratorUid
    ) {

        return;

    }


    try {

        const administratorReference =
            doc(
                db,
                "administrators",
                administratorUid
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


        currentAdministrator = {

            id:
                administratorSnapshot.id,

            ...administratorSnapshot.data()

        };

    } catch (
        error
    ) {

        console.warn(
            "Administrator profile could not be loaded for notifications:",
            error
        );


        currentAdministrator =
            null;

    }

}


// =====================================
// Detect Missing Check-Outs
// =====================================

async function detectMissingCheckOuts() {

    try {

        const now =
            new Date();


        const todayDateKey =
            formatLocalDate(
                now
            );


        // =====================================
        // Load Today's Attendance Records
        // =====================================

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


        const attendanceSnapshot =
            await getDocs(
                attendanceQuery
            );


        if (
            attendanceSnapshot.empty
        ) {

            return;

        }


        // =====================================
        // Load Active Employees
        // =====================================

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


        const employeesSnapshot =
            await getDocs(
                employeesQuery
            );


        const employeesByNumber =
            new Map();


        employeesSnapshot.forEach(
            function (
                employeeDocument
            ) {

                const employee =
                    employeeDocument.data();


                const employeeNumber =
                    String(
                        employee.employeeNumber ??
                        ""
                    ).trim();


                if (
                    employeeNumber ===
                    ""
                ) {

                    return;

                }


                employeesByNumber.set(
                    employeeNumber,
                    employee
                );

            }
        );


        // =====================================
        // Check Each Attendance Record
        // =====================================

        for (
            const attendanceDocument
            of attendanceSnapshot.docs
        ) {

            const attendance =
                attendanceDocument.data();


            const employeeNumber =
                String(
                    attendance.employeeNumber ??
                    ""
                ).trim();


            if (
                employeeNumber ===
                ""
            ) {

                continue;

            }


            const employee =
                employeesByNumber.get(
                    employeeNumber
                );


            if (
                !employee
            ) {

                continue;

            }


            // =====================================
            // Validate Genuine Check-In
            // =====================================

            const hasCheckedIn =
                Boolean(
                    String(
                        attendance.time ??
                        ""
                    ).trim()
                    ||
                    attendance.scanTimestamp
                    ||
                    attendance.checkInTimestamp
                );


            // =====================================
            // Validate Genuine Check-Out
            // =====================================

            const hasCheckedOut =
                Boolean(
                    String(
                        attendance.checkOutTime ??
                        ""
                    ).trim()
                    ||
                    attendance.checkOutTimestamp
                );


            if (
                !hasCheckedIn
                ||
                hasCheckedOut
            ) {

                continue;

            }


            // =====================================
            // Ignore Leave / Non-Working Statuses
            // =====================================

            const attendanceStatus =
                String(
                    attendance.status ??
                    ""
                ).trim();


            const nonWorkingStatuses = [

                "Absent",
                "Annual Leave",
                "Sick Leave",
                "Family Responsibility Leave",
                "Maternity Leave",
                "Unpaid Leave",
                "Public Holiday"

            ];


            if (
                nonWorkingStatuses.includes(
                    attendanceStatus
                )
            ) {

                continue;

            }


            // =====================================
            // Determine Scheduled End Time
            // =====================================

            const scheduledEndTime =
                String(
                    attendance.scheduledEndTime
                    ??
                    employee.endTime
                    ??
                    "16:30"
                ).trim();


            const scheduledEndDateTime =
                buildDateTimeFromDateAndTime(
                    todayDateKey,
                    scheduledEndTime
                );


            if (
                !scheduledEndDateTime
            ) {

                continue;

            }


            // Employee is not overdue yet.

            if (
                now <=
                scheduledEndDateTime
            ) {

                continue;

            }


            // =====================================
            // Create / Update Notification
            // =====================================

            const notificationId =
                `missing-checkout_${employeeNumber}_${todayDateKey}`;


            const notificationReference =
                doc(
                    db,
                    "notifications",
                    notificationId
                );


            await setDoc(
                notificationReference,
                {

                    type:
                        "Missing Check-Out",

                    status:
                        "Open",

                    employeeNumber:
                        employeeNumber,

                    employeeName:
                        employee.name ??
                        employeeNumber,

                    department:
                        employee.department ??
                        "Unassigned",

                    attendanceDate:
                        todayDateKey,

                    scheduledEndTime:
                        scheduledEndTime,

                    message:
                        `${employee.name ?? employeeNumber} did not check out on ${todayDateKey}.`,

                    source:
                        "Automatic Detection",

                    updatedAt:
                        serverTimestamp()

                },
                {
                    merge:
                        true
                }
            );

        }

    } catch (
        error
    ) {

        console.error(
            "Unable to detect missing check-outs:",
            error
        );

    }

}


// =====================================
// Notification Visibility
// =====================================

function canCurrentAdministratorSeeNotification(
    notification
) {

    if (
        !currentAdministrator
    ) {

        return false;

    }


    const role =
        String(
            currentAdministrator.role ??
            ""
        ).trim();


    const administratorDepartment =
        String(
            currentAdministrator.department ??
            ""
        ).trim();


    const notificationDepartment =
        String(
            notification.department ??
            ""
        ).trim();


    // =====================================
    // Super Administrator / Administrator
    // =====================================

    if (
        role ===
        "superAdministrator"
        ||
        role ===
        "administrator"
    ) {

        return true;

    }


    // =====================================
    // Manager
    // =====================================

    if (
        role ===
        "manager"
    ) {

        return (
            administratorDepartment !==
            ""
            &&
            administratorDepartment ===
            notificationDepartment
        );

    }


    return false;

}


// =====================================
// Refresh Admin Notifications
// =====================================

async function refreshAdminNotifications() {

    if (
        !notificationBadge ||
        !notificationList
    ) {

        return;

    }


    try {

        const notificationQuery =
            query(
                collection(
                    db,
                    "notifications"
                ),
                where(
                    "status",
                    "==",
                    "Open"
                )
            );


        const notificationSnapshot =
            await getDocs(
                notificationQuery
            );


        const visibleNotifications =
            notificationSnapshot.docs
                .map(
                    function (
                        notificationDocument
                    ) {

                        return {

                            id:
                                notificationDocument.id,

                            ...notificationDocument.data()

                        };

                    }
                )
                .filter(
                    function (
                        notification
                    ) {

                        return canCurrentAdministratorSeeNotification(
                            notification
                        );

                    }
                );


        notificationBadge.textContent =
            String(
                visibleNotifications.length
            );


        notificationBadge.hidden =
            visibleNotifications.length ===
            0;


        notificationList.innerHTML =
            "";


        if (
            visibleNotifications.length ===
            0
        ) {

            notificationList.innerHTML = `
                <p class="empty-state">
                    No notifications.
                </p>
            `;


            return;

        }


        visibleNotifications.forEach(
            function (
                notification
            ) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "notification-item";


                item.innerHTML = `
                    <div class="notification-item-title">
                        ${escapeHtml(
                            notification.type ??
                            "Notification"
                        )}
                    </div>

                    <div class="notification-item-message">
                        ${escapeHtml(
                            notification.message ??
                            ""
                        )}
                    </div>

                    <div class="notification-item-meta">
                        Department:
                        ${escapeHtml(
                            notification.department ??
                            ""
                        )}
                        <br>

                        Expected End:
                        ${escapeHtml(
                            notification.scheduledEndTime ??
                            "-"
                        )}
                    </div>

                    <button
                        type="button"
                        class="notification-action-button"
                        data-notification-id="${escapeHtml(
                            notification.id
                        )}"
                    >
                        Address Issue
                    </button>
                `;


                notificationList.appendChild(
                    item
                );

            }
        );

    } catch (
        error
    ) {

        console.error(
            "Unable to load admin notifications:",
            error
        );


        notificationBadge.hidden =
            true;


        notificationList.innerHTML = `
            <p class="empty-state">
                Unable to load notifications.
            </p>
        `;

    }

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
        year
        +
        "-"
        +
        month
        +
        "-"
        +
        day
    );

}


// =====================================
// Build Date / Time
// =====================================

function buildDateTimeFromDateAndTime(
    dateKey,
    timeValue
) {

    if (
        !dateKey ||
        !timeValue
    ) {

        return null;

    }


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
        dateParts.length <
        3
        ||
        timeParts.length <
        2
    ) {

        return null;

    }


    const [
        year,
        month,
        day
    ] =
        dateParts;


    const [
        hour,
        minute
    ] =
        timeParts;


    if (
        !Number.isFinite(
            year
        )
        ||
        !Number.isFinite(
            month
        )
        ||
        !Number.isFinite(
            day
        )
        ||
        !Number.isFinite(
            hour
        )
        ||
        !Number.isFinite(
            minute
        )
    ) {

        return null;

    }


    return new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        0,
        0
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
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}