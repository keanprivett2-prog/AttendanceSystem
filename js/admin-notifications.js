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
    getDoc
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

    if (
        role ===
        "superAdministrator"
        ||
        role ===
        "administrator"
    ) {

        return true;

    }

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