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

const removeCompanyLogoButton =
    document.getElementById(
        "removeCompanyLogoButton"
    );

let selectedCompanyLogoData = "";


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

    removeCompanyLogoButton.addEventListener(
    "click",
    removeCompanyLogo
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

        if (settings.companyLogo) {

    selectedCompanyLogoData =
        settings.companyLogo;

    companyLogoPreview.src =
        settings.companyLogo;

    companyLogoPreview.hidden =
        false;

    noCompanyLogoMessage.style.display =
        "none";

} else {

    companyLogoPreview.removeAttribute("src");

    companyLogoPreview.hidden =
        true;

    noCompanyLogoMessage.style.display =
        "block";

}

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

        const settingsData = {
    companyName,
    standardStartTime,
    lateThreshold,
    workingDays
};

if (selectedCompanyLogoData !== "") {

    settingsData.companyLogo =
        selectedCompanyLogoData;

}

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

        selectedCompanyLogoData = "";

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
        selectedCompanyLogoData = "";

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
        500 * 1024;

    if (selectedFile.size > maxFileSize) {

        companyLogoInput.value = "";
        selectedCompanyLogoData = "";

        companyLogoPreview.removeAttribute("src");
        companyLogoPreview.hidden = true;

        noCompanyLogoMessage.style.display =
            "block";

        showMessage(
            "The logo must be smaller than 500 KB.",
            "error"
        );

        return;

    }

    const fileReader =
        new FileReader();

    fileReader.onload = function (event) {

        selectedCompanyLogoData =
            event.target.result;

        companyLogoPreview.src =
            selectedCompanyLogoData;

        companyLogoPreview.hidden =
            false;

        noCompanyLogoMessage.style.display =
            "none";

        showMessage(
            "Logo selected. Click Save Settings to store it.",
            "info"
        );

    };

    fileReader.onerror = function () {

        selectedCompanyLogoData = "";

        showMessage(
            "The logo could not be read.",
            "error"
        );

    };

    fileReader.readAsDataURL(selectedFile);

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

        showMessage(
            "Removing logo...",
            "info"
        );

        selectedCompanyLogoData = "";

        companyLogoInput.value = "";

        companyLogoPreview.removeAttribute("src");
        companyLogoPreview.hidden = true;

        noCompanyLogoMessage.style.display =
            "block";

        const settingsReference =
            doc(db, "systemSettings", "attendance");

        await setDoc(
            settingsReference,
            {
                companyLogo: ""
            },
            {
                merge: true
            }
        );

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

    }

}

// =====================================
// Administrator Logout
// =====================================

async function logoutAdministrator() {

    try {

        await signOut(auth);

        // Clear administrator session data
        sessionStorage.clear();

        // Return to Admin Login
        window.location.href =
            "admin-login.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showMessage(
            "Unable to log out. Please try again.",
            "error"
        );

    }

}
