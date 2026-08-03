// =====================================
// R-E-D Attendance
// Administrator Session Security
// =====================================

import {
    auth
} from "../firebase/firebase.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// =====================================
// Session Settings
// =====================================

const sessionTimeoutMinutes =
    30;

const sessionTimeoutMilliseconds =
    sessionTimeoutMinutes *
    60 *
    1000;

const activityEvents = [
    "click",
    "mousemove",
    "keydown",
    "scroll",
    "touchstart"
];

let sessionTimeout;


// =====================================
// Start Administrator Session
// =====================================

startAdministratorSession();

function startAdministratorSession() {

    const adminLoggedIn =
        sessionStorage.getItem(
            "adminLoggedIn"
        );

    if (
        adminLoggedIn !== "true"
    ) {

        window.location.replace(
            "admin-login.html"
        );

        return;

    }

    activityEvents.forEach(
        (eventName) => {

            window.addEventListener(
                eventName,
                resetSessionTimeout,
                {
                    passive: true
                }
            );

        }
    );

    resetSessionTimeout();

}


// =====================================
// Reset Session Timeout
// =====================================

function resetSessionTimeout() {

    clearTimeout(
        sessionTimeout
    );

    sessionStorage.setItem(
        "lastAdminActivity",
        Date.now().toString()
    );

    sessionTimeout =
        setTimeout(
            expireAdministratorSession,
            sessionTimeoutMilliseconds
        );

}


// =====================================
// Expire Administrator Session
// =====================================

async function expireAdministratorSession() {

    try {

        await signOut(auth);

    } catch (error) {

        console.error(
            "Automatic sign-out error:",
            error
        );

    } finally {

        sessionStorage.clear();

        window.location.replace(
            "admin-login.html?session=expired"
        );

    }

}
