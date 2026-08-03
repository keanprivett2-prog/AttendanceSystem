// =====================================
// R-E-D Attendance
// Change Administrator Password
// =====================================


// =====================================
// Firebase
// =====================================

import {
    auth,
    db
} from "../firebase/firebase.js";

import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================
// Page Elements
// =====================================

const changePasswordForm =
    document.getElementById(
        "changePasswordForm"
    );

const currentPasswordInput =
    document.getElementById(
        "currentPassword"
    );

const newPasswordInput =
    document.getElementById(
        "newPassword"
    );

const confirmNewPasswordInput =
    document.getElementById(
        "confirmNewPassword"
    );

const passwordStrengthText =
    document.getElementById(
        "passwordStrengthText"
    );

const passwordStrengthBar =
    document.getElementById(
        "passwordStrengthBar"
    );

const requirementLength =
    document.getElementById(
        "requirementLength"
    );

const requirementUppercase =
    document.getElementById(
        "requirementUppercase"
    );

const requirementLowercase =
    document.getElementById(
        "requirementLowercase"
    );

const requirementNumber =
    document.getElementById(
        "requirementNumber"
    );

const requirementSpecial =
    document.getElementById(
        "requirementSpecial"
    );

const requirementDifferent =
    document.getElementById(
        "requirementDifferent"
    );

const passwordMatchMessage =
    document.getElementById(
        "passwordMatchMessage"
    );

const changePasswordMessage =
    document.getElementById(
        "changePasswordMessage"
    );

const changePasswordButton =
    document.getElementById(
        "changePasswordButton"
    );

const cancelPasswordChangeButton =
    document.getElementById(
        "cancelPasswordChangeButton"
    );

const passwordSuccessScreen =
    document.getElementById(
        "passwordSuccessScreen"
    );

const continueToDashboardButton =
    document.getElementById(
        "continueToDashboardButton"
    );

const passwordToggleButtons =
    document.querySelectorAll(
        ".password-toggle-button"
    );


// =====================================
// Page State
// =====================================

let currentAdministratorReference =
    null;


// =====================================
// Initialize Page
// =====================================

initializeChangePasswordPage();

function initializeChangePasswordPage() {

    const adminLoggedIn =
        sessionStorage.getItem(
            "adminLoggedIn"
        );

    if (adminLoggedIn !== "true") {

        window.location.replace(
            "admin-login.html"
        );

        return;

    }

    onAuthStateChanged(auth, async (user) => {

        if (!user) {

            sessionStorage.clear();

            window.location.replace(
                "admin-login.html"
            );

            return;

        }

        currentAdministratorReference =
            doc(
                db,
                "administrators",
                user.uid
            );

        try {

            const administratorSnapshot =
                await getDoc(
                    currentAdministratorReference
                );

            if (
                !administratorSnapshot.exists()
            ) {

                showMessage(
                    "Administrator account not found.",
                    "error"
                );

                return;

            }

            const administrator =
                administratorSnapshot.data();

            if (
                administrator.status ===
                "Disabled"
            ) {

                await signOutAdministrator();

                return;

            }

            attachEvents();

        } catch (error) {

            console.error(error);

            showMessage(
                "Unable to verify administrator account.",
                "error"
            );

        }

    });

}

function attachEvents() {

    changePasswordForm.addEventListener(
        "submit",
        changeAdministratorPassword
    );

    currentPasswordInput.addEventListener(
        "input",
        updatePasswordRequirements
    );

    newPasswordInput.addEventListener(
        "input",
        handlePasswordInput
    );

    confirmNewPasswordInput.addEventListener(
        "input",
        updatePasswordMatch
    );

    cancelPasswordChangeButton.addEventListener(
        "click",
        signOutAdministrator
    );

    continueToDashboardButton.addEventListener(
        "click",
        continueToDashboard
    );

    passwordToggleButtons.forEach((button) => {

        button.addEventListener(
            "click",
            togglePasswordVisibility
        );

    });

    updatePasswordRequirements();

    updatePasswordStrength();

    updatePasswordMatch();

}

// =====================================
// New Password Input
// =====================================

function handlePasswordInput() {

    updatePasswordRequirements();

    updatePasswordStrength();

    updatePasswordMatch();

}


// =====================================
// Password Requirements
// =====================================

function getPasswordRequirements() {

    const currentPassword =
        currentPasswordInput.value;

    const newPassword =
        newPasswordInput.value;

    return {
        length:
            newPassword.length >= 8,

        uppercase:
            /[A-Z]/.test(
                newPassword
            ),

        lowercase:
            /[a-z]/.test(
                newPassword
            ),

        number:
            /\d/.test(
                newPassword
            ),

        special:
            /[^A-Za-z0-9]/.test(
                newPassword
            ),

        different:
            newPassword !== "" &&
            newPassword !== currentPassword
    };

}


function updatePasswordRequirements() {

    const requirements =
        getPasswordRequirements();

    updateRequirementElement(
        requirementLength,
        requirements.length
    );

    updateRequirementElement(
        requirementUppercase,
        requirements.uppercase
    );

    updateRequirementElement(
        requirementLowercase,
        requirements.lowercase
    );

    updateRequirementElement(
        requirementNumber,
        requirements.number
    );

    updateRequirementElement(
        requirementSpecial,
        requirements.special
    );

    updateRequirementElement(
        requirementDifferent,
        requirements.different
    );

}


function updateRequirementElement(
    element,
    passed
) {

    if (!element) {
        return;
    }

    element.classList.toggle(
        "requirement-met",
        passed
    );

    element.classList.toggle(
        "requirement-unmet",
        !passed
    );

}


// =====================================
// Password Strength
// =====================================

function updatePasswordStrength() {

    const newPassword =
        newPasswordInput.value;

    if (newPassword === "") {

        passwordStrengthText.textContent =
            "Not entered";

        passwordStrengthBar.style.width =
            "0%";

        passwordStrengthBar.removeAttribute(
            "data-strength"
        );

        return;

    }

    const requirements =
        getPasswordRequirements();

    const passedRequirements =
        Object.values(
            requirements
        ).filter(Boolean).length;

    let strengthText =
        "Weak";

    let strengthLevel =
        "weak";

    let strengthPercentage =
        20;

    if (passedRequirements >= 3) {

        strengthText =
            "Fair";

        strengthLevel =
            "fair";

        strengthPercentage =
            45;

    }

    if (passedRequirements >= 5) {

        strengthText =
            "Strong";

        strengthLevel =
            "strong";

        strengthPercentage =
            75;

    }

    if (
        passedRequirements === 6 &&
        newPassword.length >= 12
    ) {

        strengthText =
            "Very Strong";

        strengthLevel =
            "very-strong";

        strengthPercentage =
            100;

    }

    passwordStrengthText.textContent =
        strengthText;

    passwordStrengthBar.style.width =
        `${strengthPercentage}%`;

    passwordStrengthBar.dataset.strength =
        strengthLevel;

}


// =====================================
// Password Match
// =====================================

function updatePasswordMatch() {

    const newPassword =
        newPasswordInput.value;

    const confirmedPassword =
        confirmNewPasswordInput.value;

    if (confirmedPassword === "") {

        passwordMatchMessage.textContent =
            "";

        passwordMatchMessage.className =
            "password-match-message";

        return;

    }

    if (
        newPassword === confirmedPassword
    ) {

        passwordMatchMessage.textContent =
            "Passwords match.";

        passwordMatchMessage.className =
            "password-match-message match-success";

    } else {

        passwordMatchMessage.textContent =
            "Passwords do not match.";

        passwordMatchMessage.className =
            "password-match-message match-error";

    }

}


// =====================================
// Change Password
// =====================================

async function changeAdministratorPassword(
    event
) {

    event.preventDefault();

    const currentPassword =
        currentPasswordInput.value;

    const newPassword =
        newPasswordInput.value;

    const confirmedPassword =
        confirmNewPasswordInput.value;

    const requirements =
        getPasswordRequirements();

    const allRequirementsPassed =
        Object.values(
            requirements
        ).every(Boolean);

    if (!currentPassword) {

        showMessage(
            "Please enter your current password.",
            "error"
        );

        return;

    }

    if (!allRequirementsPassed) {

        showMessage(
            "Your new password does not meet all requirements.",
            "error"
        );

        return;

    }

    if (
        newPassword !==
        confirmedPassword
    ) {

        showMessage(
            "The new passwords do not match.",
            "error"
        );

        return;

    }

    try {

        setButtonLoadingState(
            true
        );

        showMessage(
            "Updating your password...",
            "info"
        );

        const currentUser =
            auth.currentUser;

        if (
            !currentUser ||
            !currentUser.email
        ) {

            throw new Error(
                "Administrator session is unavailable."
            );

        }

        const credential =
            EmailAuthProvider.credential(
                currentUser.email,
                currentPassword
            );

        await reauthenticateWithCredential(
            currentUser,
            credential
        );

        await updatePassword(
            currentUser,
            newPassword
        );

        await updateDoc(
            currentAdministratorReference,
            {
                mustChangePassword:
                    false,

                passwordChangedAt:
                    serverTimestamp()
            }
        );

        sessionStorage.setItem(
            "mustChangePassword",
            "false"
        );

        showSuccessScreen();

    } catch (error) {

        console.error(
            "Change password error:",
            error
        );

        showPasswordError(
            error
        );

    } finally {

        setButtonLoadingState(
            false
        );

    }

}


// =====================================
// Password Errors
// =====================================

function showPasswordError(error) {

    if (
        error.code ===
        "auth/invalid-credential"
    ) {

        showMessage(
            "Your current password is incorrect.",
            "error"
        );

        return;

    }

    if (
        error.code ===
        "auth/wrong-password"
    ) {

        showMessage(
            "Your current password is incorrect.",
            "error"
        );

        return;

    }

    if (
        error.code ===
        "auth/weak-password"
    ) {

        showMessage(
            "The new password is not strong enough.",
            "error"
        );

        return;

    }

    if (
        error.code ===
        "auth/requires-recent-login"
    ) {

        showMessage(
            "Please sign in again before changing your password.",
            "error"
        );

        return;

    }

    if (
        error.code ===
        "auth/too-many-requests"
    ) {

        showMessage(
            "Too many attempts were made. Please wait and try again.",
            "error"
        );

        return;

    }

    showMessage(
        "Your password could not be changed. Please try again.",
        "error"
    );

}


// =====================================
// Show / Hide Password
// =====================================

function togglePasswordVisibility(
    event
) {

    const button =
        event.currentTarget;

    const targetId =
        button.dataset.passwordTarget;

    const passwordInput =
        document.getElementById(
            targetId
        );

    if (!passwordInput) {
        return;
    }

    const passwordIsHidden =
        passwordInput.type ===
        "password";

    passwordInput.type =
        passwordIsHidden
            ? "text"
            : "password";

    button.textContent =
        passwordIsHidden
            ? "Hide"
            : "Show";

    button.setAttribute(
        "aria-label",
        passwordIsHidden
            ? "Hide password"
            : "Show password"
    );

}


// =====================================
// Form Message
// =====================================

function showMessage(
    message,
    type
) {

    changePasswordMessage.textContent =
        message;

    changePasswordMessage.className =
        `password-form-message message-${type}`;

}


// =====================================
// Button Loading State
// =====================================

function setButtonLoadingState(
    isLoading
) {

    changePasswordButton.disabled =
        isLoading;

    changePasswordButton.textContent =
        isLoading
            ? "Changing Password..."
            : "Change Password";

}


// =====================================
// Success Screen
// =====================================

function showSuccessScreen() {

    changePasswordForm.hidden =
        true;

    passwordSuccessScreen.hidden =
        false;

    setTimeout(
        continueToDashboard,
        2500
    );

}


// =====================================
// Continue to Dashboard
// =====================================

function continueToDashboard() {

    window.location.replace(
        "admin-v2.html"
    );

}


// =====================================
// Sign Out
// =====================================

async function signOutAdministrator() {

    try {

        await signOut(auth);

    } catch (error) {

        console.error(
            "Password page sign-out error:",
            error
        );

    } finally {

        sessionStorage.clear();

        window.location.replace(
            "admin-login.html"
        );

    }

}
