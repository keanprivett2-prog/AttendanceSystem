// =====================================
// R-E-D Attendance
// Shared Administrator Branding
// =====================================

import {
    db
} from "../firebase/firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================
// Load Shared Administrator Branding
// =====================================

loadAdministratorBranding();


async function loadAdministratorBranding() {

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


        // =====================================
        // Sidebar Logo
        // =====================================

        const sidebarCompanyLogo =
            document.getElementById(
                "sidebarCompanyLogo"
            );


        const sidebarLogoFallback =
            document.getElementById(
                "sidebarLogoFallback"
            );


        if (
            sidebarCompanyLogo
            &&
            settings.companyLogo
        ) {

            sidebarCompanyLogo.src =
                settings.companyLogo;


            sidebarCompanyLogo.hidden =
                false;


            if (
                sidebarLogoFallback
            ) {

                sidebarLogoFallback.style.display =
                    "none";

            }

        }

    } catch (
        error
    ) {

        console.error(
            "Unable to load administrator branding:",
            error
        );

    }

}