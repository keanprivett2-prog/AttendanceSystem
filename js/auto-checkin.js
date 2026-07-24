import { db } from "../firebase/firebase.js";

import {
    doc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// Page Elements
// =====================================================

const registrationSection =
    document.getElementById("registrationSection");

const registeredSection =
    document.getElementById("registeredSection");

const employeeNumberInput =
    document.getElementById("employeeNumber");

const pinInput =
    document.getElementById("pin");

const registerDeviceButton =
    document.getElementById("registerDeviceButton");

const changeRegistrationButton =
    document.getElementById("changeRegistrationButton");

const registeredEmployee =
    document.getElementById("registeredEmployee");

const message =
    document.getElementById("message");

const clock =
    document.getElementById("clock");

const REGISTRATION_KEY =
    "attendanceDeviceRegistration";


// =====================================================
// Start System
// =====================================================

initializeAutoCheckIn();


// =====================================================
// Initialize System
// =====================================================

function initializeAutoCheckIn() {

    updateClock();

    setInterval(updateClock, 1000);

    registerDeviceButton.addEventListener(
        "click",
        registerDevice
    );

    changeRegistrationButton.addEventListener(
        "click",
        clearRegistration
    );

    const registration =
        getRegistration();

    if (!registration) {

        showRegistrationForm();

        message.style.color = "#0b5ed7";

        message.textContent =
            "This browser must be registered once.";

        return;
    }

    showRegisteredEmployee(registration);

    automaticCheckIn(registration);
}


// =====================================================
// Read Browser Registration
// =====================================================

function getRegistration() {

    try {

        const storedRegistration =
            localStorage.getItem(
                REGISTRATION_KEY
            );

        if (!storedRegistration) {
            return null;
        }

        return JSON.parse(
            storedRegistration
        );

    } catch (error) {

        console.error(
            "Could not read device registration:",
            error
        );

        return null;
    }
}


// =====================================================
// Save Browser Registration
// =====================================================

function saveRegistration(employee) {

    const registration = {

        employeeNumber:
            employee.employeeNumber,

        name:
            employee.name,

        department:
            employee.department,

        deviceId:
            getDeviceId(),

        fingerprint:
            getFingerprint()
    };

    localStorage.setItem(
        REGISTRATION_KEY,
        JSON.stringify(registration)
    );

    return registration;
}


// =====================================================
// Register Device
// =====================================================

function registerDevice() {

    message.style.color = "#0b5ed7";

    message.textContent =
        "Registering this browser...";

    const employeeNumber =
        employeeNumberInput.value.trim();

    const enteredPin =
        pinInput.value.trim();

    if (!employeeNumber) {

        message.style.color = "red";

        message.textContent =
            "Please enter the employee number.";

        employeeNumberInput.focus();

        return;
    }

    if (!enteredPin) {

        message.style.color = "red";

        message.textContent =
            "Please enter the PIN.";

        pinInput.focus();

        return;
    }

    const employee =
        findEmployee(employeeNumber);

    if (!employee) {

        message.style.color = "red";

        message.textContent =
            "Employee number not found.";

        employeeNumberInput.focus();

        return;
    }

    if (employee.pin !== enteredPin) {

        message.style.color = "red";

        message.textContent =
            "Incorrect PIN.";

        pinInput.focus();

        return;
    }

    const registration =
        saveRegistration(employee);

    showRegisteredEmployee(
        registration
    );

    message.style.color = "green";

    message.textContent =
        "Browser registered successfully.";

    automaticCheckIn(
        registration
    );
}


// =====================================================
// Automatic Attendance Check-In
// =====================================================

async function automaticCheckIn(
    registration
) {

    try {

        message.style.color = "#0b5ed7";

        message.textContent =
            "Checking attendance status...";

        const now =
            new Date();

        const dateKey =
            getLocalDateKey(now);

        const attendanceStatus =
            getAttendanceStatus();

        const deviceId =
            registration.deviceId;

        const fingerprint =
            registration.fingerprint;

        const safeDeviceId =
            encodeURIComponent(deviceId);

        const safeFingerprint =
            encodeURIComponent(fingerprint);

        const employeeLockRef =
            doc(
                db,
                "employeeDailyLocks",
                registration.employeeNumber
                    + "_"
                    + dateKey
            );

        const deviceLockRef =
            doc(
                db,
                "deviceDailyLocks",
                safeDeviceId
                    + "_"
                    + dateKey
            );

        const fingerprintLockRef =
            doc(
                db,
                "fingerprintDailyLocks",
                safeFingerprint
                    + "_"
                    + dateKey
            );

        const attendanceRef =
            doc(
                db,
                "attendance",
                registration.employeeNumber
                    + "_"
                    + dateKey
            );

        await runTransaction(
            db,
            async transaction => {

                const employeeLock =
                    await transaction.get(
                        employeeLockRef
                    );

                const deviceLock =
                    await transaction.get(
                        deviceLockRef
                    );

                const fingerprintLock =
                    await transaction.get(
                        fingerprintLockRef
                    );

                if (employeeLock.exists()) {

                    throw new Error(
                        "EMPLOYEE_ALREADY_CHECKED_IN"
                    );
                }

                if (deviceLock.exists()) {

                    throw new Error(
                        "DEVICE_ALREADY_USED"
                    );
                }

                if (fingerprintLock.exists()) {

                    throw new Error(
                        "FINGERPRINT_ALREADY_USED"
                    );
                }

                transaction.set(
                    attendanceRef,
                    {
                        employeeNumber:
                            registration.employeeNumber,

                        name:
                            registration.name,

                        department:
                            registration.department,

                        date:
                            now.toLocaleDateString(
                                "en-ZA"
                            ),

                        dateKey:
                            dateKey,

                        time:
                            now.toLocaleTimeString(
                                "en-ZA"
                            ),

                        status:
                            attendanceStatus,

                        checkInMethod:
                            "Automatic Browser Check-In",

                        deviceId:
                            deviceId,

                        fingerprint:
                            fingerprint,

                        createdAt:
                            serverTimestamp()
                    }
                );

                transaction.set(
                    employeeLockRef,
                    {
                        employeeNumber:
                            registration.employeeNumber,

                        dateKey:
                            dateKey,

                        createdAt:
                            serverTimestamp()
                    }
                );

                transaction.set(
                    deviceLockRef,
                    {
                        employeeNumber:
                            registration.employeeNumber,

                        deviceId:
                            deviceId,

                        dateKey:
                            dateKey,

                        createdAt:
                            serverTimestamp()
                    }
                );

                transaction.set(
                    fingerprintLockRef,
                    {
                        employeeNumber:
                            registration.employeeNumber,

                        fingerprint:
                            fingerprint,

                        dateKey:
                            dateKey,

                        createdAt:
                            serverTimestamp()
                    }
                );
            }
        );

        message.style.color = "green";

        message.innerHTML =
    "✅ Welcome " +
    registration.name +
    ".<br><br>" +
    "Attendance recorded successfully.<br>" +
    "Status: " +
    attendanceStatus;

        setTimeout(() => {
    window.close();
}, 5000);

    } catch (error) {

        console.error(
            "Automatic check-in:",
            error
        );

        if (
            error.message ===
            "EMPLOYEE_ALREADY_CHECKED_IN"
        ) {

            message.style.color = "orange";

            message.innerHTML =
    "✅ Welcome " +
    registration.name +
    ".<br><br>" +
    "Attendance has already been recorded today.";
            
setTimeout(() => {
    window.close();
}, 5000);
        } else if (
            error.message ===
            "DEVICE_ALREADY_USED"
        ) {

            message.style.color = "orange";

            message.textContent =
                "This device has already been used for attendance today.";

        } else if (
            error.message ===
            "FINGERPRINT_ALREADY_USED"
        ) {

            message.style.color = "orange";

            message.textContent =
                "This browser has already been used for attendance today.";

        } else {

            message.style.color = "red";

            message.textContent =
                "Automatic attendance could not be recorded.";
        }
    }
}


// =====================================================
// Attendance Status
// =====================================================

function getAttendanceStatus() {

    const now =
        new Date();

    const currentHour =
        now.getHours();

    const currentMinute =
        now.getMinutes();

    if (
        currentHour < 8 ||
        (
            currentHour === 8 &&
            currentMinute === 0
        )
    ) {
        return "On Time";
    }

    return "Late";
}


// =====================================================
// Local Date Key
// =====================================================

function getLocalDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return year
        + "-"
        + month
        + "-"
        + day;
}


// =====================================================
// Show Registration Form
// =====================================================

function showRegistrationForm() {

    registrationSection.hidden = false;

    registeredSection.hidden = true;
}


// =====================================================
// Show Registered Employee
// =====================================================

function showRegisteredEmployee(
    registration
) {

    registrationSection.hidden = true;

    registeredSection.hidden = false;

    registeredEmployee.textContent =
        registration.name
        + " ("
        + registration.employeeNumber
        + ")";
}


// =====================================================
// Remove Registration
// =====================================================

function clearRegistration() {

    const confirmed =
        window.confirm(
            "Remove this browser's employee registration?"
        );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(
        REGISTRATION_KEY
    );

    employeeNumberInput.value = "";

    pinInput.value = "";

    showRegistrationForm();

    message.style.color = "#0b5ed7";

    message.textContent =
        "Browser registration removed.";
}


// =====================================================
// Live Clock
// =====================================================

function updateClock() {

    const now =
        new Date();

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };

    clock.innerHTML =
        now.toLocaleDateString(
            "en-ZA",
            options
        )
        + "<br>"
        + now.toLocaleTimeString(
            "en-ZA"
        );
}
