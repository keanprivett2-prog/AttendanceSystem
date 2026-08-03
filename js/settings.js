import "./admin-session.js";

// =====================================
// R-E-D Attendance
// Settings
// =====================================


// =====================================
// Firebase
// =====================================

import {
    db,
    auth
} from "../firebase/firebase.js";

import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    applySidebarPermissions,
    protectPage
} from "./role-permissions.js";


// =====================================
// Page Elements
// =====================================

const settingsForm =
    document.getElementById(
        "settingsForm"
    );

const companyNameInput =
    document.getElementById(
        "companyName"
    );

const standardStartTimeInput =
    document.getElementById(
        "standardStartTime"
    );

const lateThresholdInput =
    document.getElementById(
        "lateThreshold"
    );

const workMonday =
    document.getElementById(
        "workMonday"
    );

const workTuesday =
    document.getElementById(
        "workTuesday"
    );

const workWednesday =
    document.getElementById(
        "workWednesday"
    );

const workThursday =
    document.getElementById(
        "workThursday"
    );

const workFriday =
    document.getElementById(
        "workFriday"
    );

const workSaturday =
    document.getElementById(
        "workSaturday"
    );

const workSunday =
    document.getElementById(
        "workSunday"
    );

const settingsMessage =
    document.getElementById(
        "settingsMessage"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const companyLogoInput =
    document.getElementById(
        "companyLogo"
    );

const companyLogoPreview =
    document.getElementById(
        "companyLogoPreview"
    );

const noCompanyLogoMessage =
    document.getElementById(
        "noCompanyLogoMessage"
    );

const removeCompanyLogoButton =
    document.getElementById(
        "removeCompanyLogoButton"
    );

const saveSettingsButton =
    document.getElementById(
        "saveSettingsButton"
    );


// =====================================
// Page State
// =====================================

let selectedCompanyLogoData =
    "";


// =====================================
// Initialize Settings Page
// =====================================

initializeSettingsPage();

function initializeSettingsPage() {

    if (!protectPage("settings")) {
        return;
    }

    applySidebarPermissions();

    if (settingsForm) {

        settingsForm.addEventListener(
            "submit",
            saveSettings
        );

    }

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutAdministrator
        );

    }

    if (companyLogoInput) {

        companyLogoInput.addEventListener(
            "change",
            previewCompanyLogo
        );

    }

    if (removeCompanyLogoButton) {

        removeCompanyLogoButton.addEventListener(
            "click",
            removeCompanyLogo
        );

    }

    loadSettings();

}


// =====================================
// Load Settings
// =====================================

async function loadSettings() {

    try {

        showMessage(
            "Loading settings...",
            "info"
        );

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

            setDefaultWorkingDays();

            showMessage(
                "",
                "info"
            );

            return;

        }

        const settings =
            settingsSnapshot.data();

        companyNameInput.value =
            settings.companyName ??
            "";

        standardStartTimeInput.value =
            settings.standardStartTime ??
            "08:00";

        lateThresholdInput.value =
            settings.lateThreshold ??
            "08:15";

        loadCompanyLogo(
            settings.companyLogo
        );

        loadWorkingDays(
            settings.workingDays
        );

        showMessage(
            "",
            "info"
        );

    } catch (error) {

        console.error(
            "Load settings error:",
            error
        );

        showMessage(
            "The settings could not be loaded.",
            "error"
        );

    }

}


// =====================================
// Load Company Logo
// =====================================

function loadCompanyLogo(
    companyLogo
) {

    if (companyLogo) {

        selectedCompanyLogoData =
            companyLogo;

        companyLogoPreview.src =
            companyLogo;

        companyLogoPreview.hidden =
            false;

        noCompanyLogoMessage.style.display =
            "none";

        if (removeCompanyLogoButton) {

            removeCompanyLogoButton.hidden =
                false;

        }

        return;

    }

    selectedCompanyLogoData =
        "";

    companyLogoPreview.removeAttribute(
        "src"
    );

    companyLogoPreview.hidden =
        true;

    noCompanyLogoMessage.style.display =
        "block";

    if (removeCompanyLogoButton) {

        removeCompanyLogoButton.hidden =
            true;

    }

}


// =====================================
// Load Working Days
// =====================================

function loadWorkingDays(
    workingDays
) {

    const selectedDays =
        Array.isArray(
            workingDays
        )
            ? workingDays
            : [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday"
            ];

    workMonday.checked =
        selectedDays.includes(
            "Monday"
        );

    workTuesday.checked =
        selectedDays.includes(
            "Tuesday"
        );

    workWednesday.checked =
        selectedDays.includes(
            "Wednesday"
        );

    workThursday.checked =
        selectedDays.includes(
            "Thursday"
        );

    workFriday.checked =
        selectedDays.includes(
            "Friday"
        );

    workSaturday.checked =
        selectedDays.includes(
            "Saturday"
        );

    workSunday.checked =
        selectedDays.includes(
            "Sunday"
        );

}


// =====================================
// Default Working Days
// =====================================

function setDefaultWorkingDays() {

    loadWorkingDays([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
    ]);

}


// =====================================
// Get Selected Working Days
// =====================================

function getSelectedWorkingDays() {

    const workingDays = [];

    if (workMonday.checked) {
        workingDays.push("Monday");
    }

    if (workTuesday.checked) {
        workingDays.push("Tuesday");
    }

    if (workWednesday.checked) {
        workingDays.push("Wednesday");
    }

    if (workThursday.checked) {
        workingDays.push("Thursday");
    }

    if (workFriday.checked) {
        workingDays.push("Friday");
    }

    if (workSaturday.checked) {
        workingDays.push("Saturday");
    }

    if (workSunday.checked) {
        workingDays.push("Sunday");
    }

    return workingDays;

}


// =====================================
// Save Settings
// =====================================

async function saveSettings(event) {

    event.preventDefault();

    const companyName =
        companyNameInput.value
            .trim();

    const standardStartTime =
        standardStartTimeInput.value;

    const lateThreshold =
        lateThresholdInput.value;

    const workingDays =
        getSelectedWorkingDays();


    if (companyName === "") {

        showMessage(
            "Please enter a company name.",
            "error"
        );

        return;

    }


    if (
        !standardStartTime ||
        !lateThreshold
    ) {

        showMessage(
            "Please select both attendance times.",
            "error"
        );

        return;

    }


    if (
        lateThreshold <
        standardStartTime
    ) {

        showMessage(
            "Late After cannot be earlier than the standard start time.",
            "error"
        );

        return;

    }


    if (
        workingDays.length === 0
    ) {

        showMessage(
            "Please select at least one working day.",
            "error"
        );

        return;

    }


    try {

        setSaveButtonState(
            true
        );

        showMessage(
            "Saving settings...",
            "info"
        );

        const settingsReference =
            doc(
                db,
                "systemSettings",
                "attendance"
            );

        const settingsData = {
            companyName,
            standardStartTime,
            lateThreshold,
            workingDays,
            companyLogo:
                selectedCompanyLogoData
        };

        await setDoc(
            settingsReference,
            settingsData,
            {
                merge: true
            }
        );

        showMessage(
            "Settings saved successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Save settings error:",
            error
        );

        showMessage(
            "The settings could not be saved.",
            "error"
        );

    } finally {

        setSaveButtonState(
            false
        );

    }

}


// =====================================
// Save Button State
// =====================================

function setSaveButtonState(
    isSaving
) {

    if (!saveSettingsButton) {
        return;
    }

    saveSettingsButton.disabled =
        isSaving;

    saveSettingsButton.textContent =
        isSaving
            ? "Saving..."
            : "Save Settings";

}


// =====================================
// Preview Company Logo
// =====================================

function previewCompanyLogo() {

    const selectedFile =
        companyLogoInput.files[0];

    if (!selectedFile) {
        return;
    }

    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];

    if (
        !allowedTypes.includes(
            selectedFile.type
        )
    ) {

        companyLogoInput.value =
            "";

        showMessage(
            "Please select a PNG, JPG or WEBP image.",
            "error"
        );

        return;

    }

    const maximumFileSize =
        500 * 1024;

    if (
        selectedFile.size >
        maximumFileSize
    ) {

        companyLogoInput.value =
            "";

        showMessage(
            "The logo must be smaller than 500 KB.",
            "error"
        );

        return;

    }

    const fileReader =
        new FileReader();

    fileReader.onload =
        function (event) {

            selectedCompanyLogoData =
                event.target.result;

            companyLogoPreview.src =
                selectedCompanyLogoData;

            companyLogoPreview.hidden =
                false;

            noCompanyLogoMessage.style.display =
                "none";

            if (
                removeCompanyLogoButton
            ) {

                removeCompanyLogoButton.hidden =
                    false;

            }

            showMessage(
                "Logo selected. Click Save Settings to store it.",
                "info"
            );

        };

    fileReader.onerror =
        function () {

            showMessage(
                "The logo could not be read.",
                "error"
            );

        };

    fileReader.readAsDataURL(
        selectedFile
    );

}


// =====================================
// Remove Company Logo
// =====================================

async function removeCompanyLogo() {

    const confirmed =
        confirm(
            "Are you sure you want to remove the company logo?"
        );

    if (!confirmed) {
        return;
    }

    try {

        removeCompanyLogoButton.disabled =
            true;

        showMessage(
            "Removing logo...",
            "info"
        );

        selectedCompanyLogoData =
            "";

        companyLogoInput.value =
            "";

        companyLogoPreview.removeAttribute(
            "src"
        );

        companyLogoPreview.hidden =
            true;

        noCompanyLogoMessage.style.display =
            "block";

        const settingsReference =
            doc(
                db,
                "systemSettings",
                "attendance"
            );

        await setDoc(
            settingsReference,
            {
                companyLogo: ""
            },
            {
                merge: true
            }
        );

        removeCompanyLogoButton.hidden =
            true;

        showMessage(
            "Company logo removed successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Remove logo error:",
            error
        );

        showMessage(
            "The company logo could not be removed.",
            "error"
        );

    } finally {

        removeCompanyLogoButton.disabled =
            false;

    }

}


// =====================================
// Message
// =====================================

function showMessage(
    message,
    type
) {

    if (!settingsMessage) {
        return;
    }

    settingsMessage.textContent =
        message;

    if (type === "success") {

        settingsMessage.style.color =
            "green";

    } else if (type === "error") {

        settingsMessage.style.color =
            "red";

    } else {

        settingsMessage.style.color =
            "#0b5ed7";

    }

}


// =====================================
// Administrator Logout
// =====================================

async function logoutAdministrator() {

    try {

        if (logoutButton) {

            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "Logging out...";

        }

        await signOut(auth);

        sessionStorage.clear();

        window.location.replace(
            "admin-login.html"
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        if (logoutButton) {

            logoutButton.disabled =
                false;

            logoutButton.textContent =
                "Logout";

        }

        showMessage(
            "Unable to log out. Please try again.",
            "error"
        );

    }

}
