// =====================================
// R-E-D Attendance
// Settings
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


// =====================================
// Page Elements
// =====================================

const settingsForm =
    document.getElementById("settingsForm");

const companyNameInput =
    document.getElementById("companyName");

const standardStartTimeInput =
    document.getElementById("standardStartTime");

const lateThresholdInput =
    document.getElementById("lateThreshold");

const workMonday =
    document.getElementById("workMonday");

const workTuesday =
    document.getElementById("workTuesday");

const workWednesday =
    document.getElementById("workWednesday");

const workThursday =
    document.getElementById("workThursday");

const workFriday =
    document.getElementById("workFriday");

const workSaturday =
    document.getElementById("workSaturday");

const workSunday =
    document.getElementById("workSunday");

const settingsMessage =
    document.getElementById("settingsMessage");

const logoutButton =
    document.getElementById("logoutButton");

const companyLogoInput =
    document.getElementById("companyLogo");

const companyLogoPreviewContainer =
    document.getElementById(
        "companyLogoPreviewContainer"
    );

const companyLogoPreview =
    document.getElementById(
        "companyLogoPreview"
    );

const noCompanyLogoMessage =
    document.getElementById(
        "noCompanyLogoMessage"
    );


// =====================================
// Start Settings Page
// =====================================

initializeSettingsPage();

function initializeSettingsPage() {

    loadSettings();

    settingsForm.addEventListener(
        "submit",
        saveSettings
    );

    logoutButton.addEventListener(
        "click",
        logoutAdministrator
    );

    companyLogoInput.addEventListener(
        "change",
        previewCompanyLogo
    );

}

// =====================================
// Load Settings
// =====================================

async function loadSettings() {

    try {

        const settingsReference =
            doc(db, "systemSettings", "attendance");

        const settingsSnapshot =
            await getDoc(settingsReference);

        if (!settingsSnapshot.exists()) {
            return;
        }

        const settings =
            settingsSnapshot.data();

        companyNameInput.value =
            settings.companyName ?? "";

        standardStartTimeInput.value =
            settings.standardStartTime ?? "08:00";

        lateThresholdInput.value =
            settings.lateThreshold ?? "08:15";

        const workingDays =
            settings.workingDays ?? [];

        workMonday.checked =
            workingDays.includes("Monday");

        workTuesday.checked =
            workingDays.includes("Tuesday");

        workWednesday.checked =
            workingDays.includes("Wednesday");

        workThursday.checked =
            workingDays.includes("Thursday");

        workFriday.checked =
            workingDays.includes("Friday");

        workSaturday.checked =
            workingDays.includes("Saturday");

        workSunday.checked =
            workingDays.includes("Sunday");

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
// Save Settings
// =====================================

async function saveSettings(event) {

    event.preventDefault();

    const companyName =
        companyNameInput.value.trim();

    const standardStartTime =
        standardStartTimeInput.value;

    const lateThreshold =
        lateThresholdInput.value;

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

    if (companyName === "") {

        showMessage(
            "Please enter a company name.",
            "error"
        );

        return;

    }

    if (!standardStartTime || !lateThreshold) {

        showMessage(
            "Please select both attendance times.",
            "error"
        );

        return;

    }

    if (workingDays.length === 0) {

        showMessage(
            "Please select at least one working day.",
            "error"
        );

        return;

    }

    try {

        showMessage(
            "Saving settings...",
            "info"
        );

        const settingsReference =
            doc(db, "systemSettings", "attendance");

        await setDoc(
            settingsReference,
            {
                companyName,
                standardStartTime,
                lateThreshold,
                workingDays
            },
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

    }

}


// =====================================
// Message
// =====================================

function showMessage(message, type) {

    settingsMessage.textContent =
        message;

    if (type === "success") {
        settingsMessage.style.color = "green";
    }

    if (type === "error") {
        settingsMessage.style.color = "red";
    }

    if (type === "info") {
        settingsMessage.style.color = "#0b5ed7";
    }

}

// =====================================
// Preview Company Logo
// =====================================

function previewCompanyLogo() {

    const selectedFile =
        companyLogoInput.files[0];

    if (!selectedFile) {

        companyLogoPreview.removeAttribute("src");

        companyLogoPreview.hidden = true;

        noCompanyLogoMessage.style.display =
            "block";

        return;

    }

    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];

    if (!allowedTypes.includes(selectedFile.type)) {

        companyLogoInput.value = "";

        companyLogoPreview.removeAttribute("src");

        companyLogoPreview.hidden = true;

        noCompanyLogoMessage.style.display =
            "block";

        showMessage(
            "Please select a PNG, JPG or WEBP image.",
            "error"
        );

        return;

    }

    const maxFileSize =
        2 * 1024 * 1024;

    if (selectedFile.size > maxFileSize) {

        companyLogoInput.value = "";

        companyLogoPreview.removeAttribute("src");

        companyLogoPreview.hidden = true;

        noCompanyLogoMessage.style.display =
            "block";

        showMessage(
            "The logo must be smaller than 2 MB.",
            "error"
        );

        return;

    }

    companyLogoPreview.src =
        URL.createObjectURL(selectedFile);

    companyLogoPreview.hidden = false;

    noCompanyLogoMessage.style.display =
        "none";

    showMessage(
        "Logo selected. Click Save Settings to upload later.",
        "info"
    );

}
// =====================================
// Logout
// =====================================

async function logoutAdministrator() {

    try {

        await signOut(auth);

        window.location.href =
            "index.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}
