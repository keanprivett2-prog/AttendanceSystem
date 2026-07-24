import { db } from "../firebase/firebase.js";

import {
    collection,
    doc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// Page Elements
// =====================================================

const employeeNumberInput =
    document.getElementById("employeeNumber");

const pinInput =
    document.getElementById("pin");

const checkInButton =
    document.getElementById("checkInButton");

const message =
    document.getElementById("message");

const clock =
    document.getElementById("clock");


// =====================================================
// Start System
// =====================================================

initializeSystem();


// =====================================================
// Initialize
// =====================================================

function initializeSystem() {

    updateClock();

    setInterval(updateClock, 1000);

    checkInButton.addEventListener("click", checkIn);

    message.style.color = "#0b5ed7";
    message.innerHTML = "Ready for employee check-in.";
}


// =====================================================
// Live Clock
// =====================================================

function updateClock() {

    const now = new Date();

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };

    clock.innerHTML =
        now.toLocaleDateString("en-ZA", options)
        + "<br>"
        + now.toLocaleTimeString("en-ZA");
}
function getLocalDateKey() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return year
        + "-"
        + month
        + "-"
        + day;
}

// =====================================================
// Main Check In
// =====================================================

async function checkIn() {

    message.style.color = "#0b5ed7";
    message.innerHTML =
        "Starting attendance verification...";

    const employee = authenticateEmployee();

    if (!employee) {
        return;
    }

    const securityResult =
    await securityCheck(employee);

if (!securityResult.allowed) {

    message.style.color = "orange";

    message.innerHTML =
        securityResult.message;

    return;
}
    }

    const attendanceStatus =
        getAttendanceStatus();

    try {

        await saveAttendanceToFirebase(
            employee,
            attendanceStatus
        );

        saveAttendance(
            employee,
            attendanceStatus
        );

        console.log(
            "Device ID:",
            getDeviceId()
        );

        console.log(
            "Fingerprint:",
            getFingerprint()
        );

        message.style.color = "green";

        message.innerHTML =
            "✅ Welcome, "
            + employee.name
            + "! Attendance recorded. Status: "
            + attendanceStatus;

        employeeNumberInput.value = "";
        pinInput.value = "";

    } catch (error) {

        console.error(error);

        message.style.color = "red";

        message.innerHTML =
            "❌ Attendance could not be saved. Please try again.";
    }
}


// =====================================================
// Save Attendance to Firebase
// =====================================================

async function saveAttendanceToFirebase(
    employee,
    attendanceStatus
) {

    const now = new Date();
    const dateKey = getLocalDateKey();

    const deviceId = getDeviceId();
    const fingerprint = getFingerprint();

    const safeDeviceId =
        encodeURIComponent(deviceId);

    const safeFingerprint =
        encodeURIComponent(fingerprint);

    const employeeLockRef = doc(
        db,
        "employeeDailyLocks",
        employee.employeeNumber + "_" + dateKey
    );

    const deviceLockRef = doc(
        db,
        "deviceDailyLocks",
        safeDeviceId + "_" + dateKey
    );

    const fingerprintLockRef = doc(
        db,
        "fingerprintDailyLocks",
        safeFingerprint + "_" + dateKey
    );

    const attendanceRef = doc(
        db,
        "attendance",
        employee.employeeNumber + "_" + dateKey
    );

    await runTransaction(
        db,
        async transaction => {

            const employeeLock =
                await transaction.get(employeeLockRef);

            const deviceLock =
                await transaction.get(deviceLockRef);

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
                        employee.employeeNumber,

                    name:
                        employee.name,

                    department:
                        employee.department,

                    date:
                        now.toLocaleDateString("en-ZA"),

                    dateKey:
                        dateKey,

                    time:
                        now.toLocaleTimeString("en-ZA"),

                    status:
                        attendanceStatus,

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
                        employee.employeeNumber,

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
                        employee.employeeNumber,

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
                        employee.employeeNumber,

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
}


// =====================================================
// Attendance Status
// =====================================================

function getAttendanceStatus() {

    const now = new Date();

    const currentHour =
        now.getHours();

    const currentMinute =
        now.getMinutes();

    const startHour = 8;
    const startMinute = 0;

    if (
        currentHour < startHour ||
        (
            currentHour === startHour &&
            currentMinute <= startMinute
        )
    ) {
        return "On Time";
    }

    return "Late";
}


// =====================================================
// Save Attendance Locally
// =====================================================

function saveAttendance(
    employee,
    attendanceStatus
) {

    const attendance =
        JSON.parse(
            localStorage.getItem("attendance")
        ) || [];

    attendance.push({
        employeeNumber:
            employee.employeeNumber,

        name:
            employee.name,

        department:
            employee.department,

        date:
            new Date().toLocaleDateString(),

        time:
            new Date().toLocaleTimeString(),

        status:
            attendanceStatus
    });

    localStorage.setItem(
        "attendance",
        JSON.stringify(attendance)
    );
}


// =====================================================
// Security Check
// =====================================================

async function securityCheck(employee) {

    const attendance =
        JSON.parse(
            localStorage.getItem("attendance")
        ) || [];

    const today =
        new Date().toLocaleDateString();

    const alreadyCheckedIn =
        attendance.some(record =>
            record.employeeNumber ===
                employee.employeeNumber &&
            record.date === today
        );

    if (alreadyCheckedIn) {

        return {
            allowed: false,
            message:
                "⚠️ You have already checked in today."
        };
    }

    return {
        allowed: true,
        message: ""
    };
}

// =====================================================
// Validate User Input
// =====================================================

function validateInputs() {

    const employeeNumber =
        employeeNumberInput.value.trim();

    const pin =
        pinInput.value.trim();

    if (employeeNumber === "") {

        message.style.color = "red";

        message.innerHTML =
            "❌ Please enter your Employee Number.";

        employeeNumberInput.focus();

        return false;
    }

    if (pin === "") {

        message.style.color = "red";

        message.innerHTML =
            "❌ Please enter your PIN.";

        pinInput.focus();

        return false;
    }

    return true;
}


// =====================================================
// Validate Employee
// =====================================================

function validateEmployee() {

    const employeeNumber =
        employeeNumberInput.value.trim();

    const employee =
        findEmployee(employeeNumber);

    if (!employee) {

        message.style.color = "red";

        message.innerHTML =
            "❌ Employee Number not found.";

        employeeNumberInput.focus();

        return null;
    }

    return employee;
}


// =====================================================
// Validate PIN
// =====================================================

function validatePin(employee) {

    const enteredPin =
        pinInput.value.trim();

    if (employee.pin !== enteredPin) {

        message.style.color = "red";

        message.innerHTML =
            "❌ Incorrect PIN.";

        pinInput.focus();

        return false;
    }

    return true;
}


// =====================================================
// Authenticate Employee
// =====================================================

function authenticateEmployee() {

    if (!validateInputs()) {
        return null;
    }

    const employee =
        validateEmployee();

    if (!employee) {
        return null;
    }

    if (!validatePin(employee)) {
        return null;
    }

    return employee;
}
