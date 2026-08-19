// =====================================
// R-E-D Attendance
// Shared Administrator Logout
// =====================================

import {
    auth
} from "../firebase/firebase.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    writeAuditLog
} from "./audit-logger.js";


// =====================================
// Administrator Logout
// =====================================

export async function logoutAdministrator(
    source = "Administrator Portal",
    logoutButton = null
) {

    try {

        if (
            logoutButton
        ) {

            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "Logging out...";

        }


        const administratorName =
            sessionStorage.getItem(
                "adminName"
            )
            ||
            sessionStorage.getItem(
                "adminEmail"
            )
            ||
            "Administrator";


        const administratorId =
            sessionStorage.getItem(
                "adminUID"
            )
            ||
            "";


        await writeAuditLog({
            category:
                "Authentication",

            action:
                "Administrator Logout",

            description:
                `${administratorName} signed out of the administrator portal.`,

            actorType:
                "Administrator",

            actorName:
                administratorName,

            actorId:
                administratorId,

            targetType:
                "Administrator",

            targetName:
                administratorName,

            targetId:
                administratorId,

            source:
                source
        });


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