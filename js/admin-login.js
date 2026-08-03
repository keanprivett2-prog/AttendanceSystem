// =====================================
// R-E-D Attendance Admin Login
// =====================================

import {
    loginAdmin
} from "../firebase/auth.js";

import {
    db,
    auth
} from "../firebase/firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// =====================================
// Page Elements
// =====================================

const adminUsernameInput =
    document.getElementById(
        "adminUsername"
    );

const adminPasswordInput =
    document.getElementById(
        "adminPassword"
    );

const adminLoginButton =
    document.getElementById(
        "adminLoginButton"
    );

const adminLoginMessage =
    document.getElementById(
        "adminLoginMessage"
    );


// =====================================
// Events
// =====================================

adminLoginButton.addEventListener(
    "click",
    adminLogin
);

adminPasswordInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {
            adminLogin();
        }

    }
);


// =====================================
// Admin Login
// =====================================

async function adminLogin() {

    const email =
        adminUsernameInput.value
            .trim()
            .toLowerCase();

    const password =
        adminPasswordInput.value;

    adminLoginMessage.style.color =
        "#0b5ed7";

    adminLoginMessage.innerHTML =
        "Signing in...";

    adminLoginButton.disabled =
        true;

    try {

        // =====================================
        // Firebase Authentication
        // =====================================

        const user =
            await loginAdmin(
                email,
                password
            );


        // =====================================
        // Check Administrator Record
        // =====================================

        const administratorReference =
            doc(
                db,
                "administrators",
                user.uid
            );

        const administratorSnapshot =
            await getDoc(
                administratorReference
            );


        // =====================================
        // Administrator Not Registered
        // =====================================

        if (
            !administratorSnapshot.exists()
        ) {

            await signOut(auth);

            adminLoginMessage.style.color =
                "red";

            adminLoginMessage.innerHTML =
                "❌ This account does not have administrator access.";

            adminLoginButton.disabled =
                false;

            return;

        }


        const administrator =
            administratorSnapshot.data();


        // =====================================
        // Disabled Administrator
        // =====================================

        if (
            administrator.status ===
            "Disabled"
        ) {

            await signOut(auth);

            sessionStorage.clear();

            adminLoginMessage.style.color =
                "red";

            adminLoginMessage.innerHTML =
                "❌ This administrator account has been disabled.";

            adminLoginButton.disabled =
                false;

            return;

        }


        // =====================================
        // Successful Login
        // =====================================

        sessionStorage.setItem(
            "adminLoggedIn",
            "true"
        );

        sessionStorage.setItem(
            "adminEmail",
            user.email
        );

        sessionStorage.setItem(
            "adminUID",
            user.uid
        );

        sessionStorage.setItem(
            "adminName",
            administrator.fullName ?? ""
        );

        sessionStorage.setItem(
            "adminRole",
            administrator.role ?? ""
        );

        window.location.href =
            "admin-v2.html";


    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        adminLoginMessage.style.color =
            "red";

        adminLoginMessage.innerHTML =
            "❌ Incorrect email address or password.";

        adminLoginButton.disabled =
            false;

    }

}
