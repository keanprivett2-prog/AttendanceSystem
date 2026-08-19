// =====================================
// R-E-D Attendance Admin Login
// =====================================


// =====================================
// Firebase
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
    signOut,
    setPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    writeAuditLog
} from "./audit-logger.js";


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
// Forgot Password Elements
// =====================================

const forgotPasswordButton =
    document.getElementById(
        "forgotPasswordButton"
    );

const forgotPasswordModal =
    document.getElementById(
        "forgotPasswordModal"
    );

const closeForgotPasswordModalButton =
    document.getElementById(
        "closeForgotPasswordModalButton"
    );

const cancelForgotPasswordButton =
    document.getElementById(
        "cancelForgotPasswordButton"
    );

const forgotPasswordForm =
    document.getElementById(
        "forgotPasswordForm"
    );

const forgotPasswordEmailInput =
    document.getElementById(
        "forgotPasswordEmail"
    );

const sendPasswordResetButton =
    document.getElementById(
        "sendPasswordResetButton"
    );

const forgotPasswordMessage =
    document.getElementById(
        "forgotPasswordMessage"
    );


// =====================================
// Login Events
// =====================================

adminLoginButton.addEventListener(
    "click",
    function (event) {

        event.preventDefault();

        adminLogin();

    }
);

adminPasswordInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            adminLogin();

        }

    }
);


// =====================================
// Forgot Password Events
// =====================================

if (forgotPasswordButton) {

    forgotPasswordButton.addEventListener(
        "click",
        openForgotPasswordModal
    );

}

if (closeForgotPasswordModalButton) {

    closeForgotPasswordModalButton.addEventListener(
        "click",
        closeForgotPasswordModal
    );

}

if (cancelForgotPasswordButton) {

    cancelForgotPasswordButton.addEventListener(
        "click",
        closeForgotPasswordModal
    );

}

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        sendAdministratorPasswordReset
    );

}

if (forgotPasswordModal) {

    forgotPasswordModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                forgotPasswordModal
            ) {

                closeForgotPasswordModal();

            }

        }
    );

}


// =====================================
// Administrator Login
// =====================================

async function adminLogin() {

    const email =
        adminUsernameInput.value
            .trim()
            .toLowerCase();

    const password =
        adminPasswordInput.value;


    if (!email) {

        showLoginMessage(
            "Please enter your email address.",
            "error"
        );

        return;

    }


    if (!password) {

        showLoginMessage(
            "Please enter your password.",
            "error"
        );

        return;

    }


    showLoginMessage(
        "Signing in...",
        "info"
    );

    adminLoginButton.disabled =
        true;

    adminLoginButton.textContent =
        "Signing In...";


    try {

        // =====================================
        // Firebase Session Persistence
        // =====================================

        await setPersistence(
            auth,
            browserSessionPersistence
        );


        // =====================================
        // Firebase Authentication
        // =====================================

        const user =
            await loginAdmin(
                email,
                password
            );


        // =====================================
        // Administrator Record
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

            sessionStorage.clear();

            showLoginMessage(
                "❌ This account does not have administrator access.",
                "error"
            );

            resetLoginButton();

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

            showLoginMessage(
                "❌ This administrator account has been disabled.",
                "error"
            );

            resetLoginButton();

            return;

        }


        // =====================================
        // Store Administrator Session
        // =====================================

        sessionStorage.setItem(
            "adminLoggedIn",
            "true"
        );

        sessionStorage.setItem(
            "adminUID",
            user.uid
        );

        sessionStorage.setItem(
            "adminEmail",
            user.email ?? email
        );

        sessionStorage.setItem(
            "adminName",
            administrator.fullName ?? ""
        );

        sessionStorage.setItem(
            "adminRole",
            administrator.role ?? ""
        );

        sessionStorage.setItem(
            "mustChangePassword",
            String(
                administrator.mustChangePassword === true
            )
        );

        sessionStorage.setItem(
            "lastAdminActivity",
            Date.now().toString()
        );

        await writeAuditLog({
    category:
        "Authentication",

    action:
        "Administrator Login",

    description:
        `${administrator.fullName ?? user.email ?? email} signed in to the administrator portal.`,

    actorType:
        "Administrator",

    actorName:
        administrator.fullName ??
        user.email ??
        email,

    actorId:
        user.uid,

    targetType:
        "Administrator",

    targetName:
        administrator.fullName ??
        user.email ??
        email,

    targetId:
        user.uid,

    source:
        "Admin Login"
});


        // =====================================
        // Force Password Change
        // =====================================

        if (
            administrator.mustChangePassword ===
            true
        ) {

            window.location.replace(
                "change-password.html"
            );

            return;

        }


        // =====================================
        // Normal Login
        // =====================================

        window.location.replace(
            "admin-v2.html"
        );

    } catch (error) {

    console.error(
        "Admin login error:",
        error
    );

    await writeAuditLog({
        category:
            "Authentication",

        action:
            "Administrator Login Failed",

        description:
            `Failed administrator login attempt for ${email}.`,

        actorType:
            "Unknown",

        actorName:
            email,

        actorId:
            "",

        targetType:
            "Administrator",

        targetName:
            email,

        targetId:
            "",

        source:
            "Admin Login",

        metadata: {
            errorCode:
                error.code ??
                "unknown"
        }
    });

    showLoginError(
        error
    );

    resetLoginButton();

}

}


// =====================================
// Login Error Handling
// =====================================

function showLoginError(error) {

    if (
        error.code ===
        "auth/invalid-email"
    ) {

        showLoginMessage(
            "❌ Please enter a valid email address.",
            "error"
        );

        return;

    }

    if (
        error.code ===
        "auth/invalid-credential" ||
        error.code ===
        "auth/wrong-password" ||
        error.code ===
        "auth/user-not-found"
    ) {

        showLoginMessage(
            "❌ Incorrect email address or password.",
            "error"
        );

        return;

    }

    if (
        error.code ===
        "auth/too-many-requests"
    ) {

        showLoginMessage(
            "❌ Too many login attempts. Please wait and try again.",
            "error"
        );

        return;

    }

    if (
        error.code ===
        "auth/network-request-failed"
    ) {

        showLoginMessage(
            "❌ Unable to connect. Please check your internet connection.",
            "error"
        );

        return;

    }

    showLoginMessage(
        "❌ Unable to sign in. Please try again.",
        "error"
    );

}


// =====================================
// Login Message
// =====================================

function showLoginMessage(
    message,
    type
) {

    adminLoginMessage.textContent =
        message;

    if (
        type ===
        "success"
    ) {

        adminLoginMessage.style.color =
            "green";

    } else if (
        type ===
        "error"
    ) {

        adminLoginMessage.style.color =
            "red";

    } else {

        adminLoginMessage.style.color =
            "#0b5ed7";

    }

}


// =====================================
// Reset Login Button
// =====================================

function resetLoginButton() {

    adminLoginButton.disabled =
        false;

    adminLoginButton.textContent =
        "Sign In";

}


// =====================================
// Open Forgot Password Modal
// =====================================

function openForgotPasswordModal() {

    if (
        !forgotPasswordModal ||
        !forgotPasswordForm
    ) {
        return;
    }

    forgotPasswordForm.reset();

    forgotPasswordEmailInput.value =
        adminUsernameInput.value
            .trim()
            .toLowerCase();

    forgotPasswordMessage.textContent =
        "";

    forgotPasswordModal.hidden =
        false;

    forgotPasswordModal.classList.add(
        "modal-open"
    );

    setTimeout(
        function () {

            forgotPasswordEmailInput.focus();

        },
        50
    );

}


// =====================================
// Close Forgot Password Modal
// =====================================

function closeForgotPasswordModal() {

    if (!forgotPasswordModal) {
        return;
    }

    forgotPasswordModal.classList.remove(
        "modal-open"
    );

    forgotPasswordModal.hidden =
        true;

    if (forgotPasswordForm) {

        forgotPasswordForm.reset();

    }

    if (forgotPasswordMessage) {

        forgotPasswordMessage.textContent =
            "";

    }

}


// =====================================
// Send Password Reset Email
// =====================================

async function sendAdministratorPasswordReset(
    event
) {

    event.preventDefault();

    const email =
        forgotPasswordEmailInput.value
            .trim()
            .toLowerCase();


    if (!email) {

        showForgotPasswordMessage(
            "Please enter your administrator email address.",
            "error"
        );

        return;

    }


    try {

        sendPasswordResetButton.disabled =
            true;

        sendPasswordResetButton.textContent =
            "Sending...";

        showForgotPasswordMessage(
            "Sending password reset link...",
            "info"
        );


        // =====================================
        // Check Administrator Exists
        // =====================================

        const administratorExists =
            await administratorEmailExists(
                email
            );

        if (!administratorExists) {

            // Do not reveal whether an account
            // exists to unauthenticated users.

            showForgotPasswordMessage(
                "If this email belongs to an administrator account, a password reset link will be sent shortly.",
                "success"
            );

            return;

        }


        // =====================================
        // Send Firebase Password Reset
        // =====================================

        await sendPasswordResetEmail(
            auth,
            email
        );

        showForgotPasswordMessage(
            "Password reset instructions have been sent. Please check your inbox and spam folder.",
            "success"
        );

    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );


        if (
            error.code ===
            "auth/invalid-email"
        ) {

            showForgotPasswordMessage(
                "Please enter a valid email address.",
                "error"
            );

            return;

        }


        if (
            error.code ===
            "auth/too-many-requests"
        ) {

            showForgotPasswordMessage(
                "Too many reset attempts were made. Please wait and try again.",
                "error"
            );

            return;

        }


        if (
            error.code ===
            "auth/network-request-failed"
        ) {

            showForgotPasswordMessage(
                "Unable to connect. Please check your internet connection.",
                "error"
            );

            return;

        }


        showForgotPasswordMessage(
            "The password reset request could not be completed. Please try again.",
            "error"
        );

    } finally {

        sendPasswordResetButton.disabled =
            false;

        sendPasswordResetButton.textContent =
            "Send Reset Link";

    }

}


// =====================================
// Check Administrator Email
// =====================================

async function administratorEmailExists(
    email
) {

    /*
        We cannot query Firebase Authentication
        directly from the browser to determine
        whether an email exists.

        For now we return true and allow Firebase
        Authentication to handle the reset request.

        We still use a generic success message so
        the login page does not expose whether a
        specific administrator account exists.
    */

    return true;

}


// =====================================
// Forgot Password Message
// =====================================

function showForgotPasswordMessage(
    message,
    type
) {

    if (!forgotPasswordMessage) {
        return;
    }

    forgotPasswordMessage.textContent =
        message;

    if (
        type ===
        "success"
    ) {

        forgotPasswordMessage.style.color =
            "green";

    } else if (
        type ===
        "error"
    ) {

        forgotPasswordMessage.style.color =
            "red";

    } else {

        forgotPasswordMessage.style.color =
            "#0b5ed7";

    }

}
