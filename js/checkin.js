import { db } from "../firebase/firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Existing code starts here...
// =====================================================
// ATTENDANCE SYSTEM ENGINE
// Version 1.0
// =====================================================

// Page Elements
const employeeNumberInput = document.getElementById("employeeNumber");
const pinInput = document.getElementById("pin");
const checkInButton = document.getElementById("checkInButton");
const message = document.getElementById("message");
const clock = document.getElementById("clock");

// =====================================================
// Start System
// =====================================================

initializeSystem();

// =====================================================
// Initialize
// =====================================================

function initializeSystem(){

    updateClock();

    setInterval(updateClock,1000);

    checkInButton.addEventListener("click",checkIn);

}

// =====================================================
// Live Clock
// =====================================================

function updateClock(){

    const now = new Date();

    const options = {

        weekday:"long",
        year:"numeric",
        month:"long",
        day:"numeric"

    };

    clock.innerHTML =
        now.toLocaleDateString("en-ZA",options)
        + "<br>" +
        now.toLocaleTimeString("en-ZA");

}

// =====================================================
// Main Check In
// =====================================================

async function checkIn() {

    message.style.color = "#0b5ed7";
    message.innerHTML = "Starting attendance verification...";

    const employee = authenticateEmployee();

    if (!employee) {
        return;
    }

    if (!securityCheck(employee)) {
    return;

    }

   

const attendanceStatus = getAttendanceStatus();

// Keep saving locally for now
saveAttendance(employee, attendanceStatus);

// Also save to Firebase
await saveAttendanceToFirebase(
    employee,
    attendanceStatus
);
// =====================================================
// Save Attendance to Firebase
// =====================================================

async function saveAttendanceToFirebase(
    employee,
    attendanceStatus
) {

    try {

        const now = new Date();

        await addDoc(
            collection(db, "attendance"),
            {
                employeeNumber: employee.employeeNumber,
                name: employee.name,
                department: employee.department,

                date: now.toLocaleDateString("en-ZA"),
                dateKey: now.toISOString().split("T")[0],

                time: now.toLocaleTimeString("en-ZA"),
                status: attendanceStatus,

                deviceId: getDeviceId(),
                fingerprint: getFingerprint(),

                createdAt: serverTimestamp()
            }
        );

        console.log(
            "Attendance saved successfully to Firebase."
        );

    } catch (error) {

        console.error(
            "Firebase attendance error:",
            error
        );

        throw error;
    }
}

console.log("Device ID:", getDeviceId());
console.log("Fingerprint:", getFingerprint());

message.style.color = "green";
message.innerHTML =
    "✅ Welcome, " +
    employee.name +
    "! Attendance recorded. Status: " +
    attendanceStatus;
	}
// =====================================
// Attendance Status
// =====================================

function getAttendanceStatus() {

    const now = new Date();

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const startHour = 8;
    const startMinute = 0;

    if (
        currentHour < startHour ||
        (currentHour === startHour && currentMinute <= startMinute)
    ) {
        return "On Time";
    }

    return "Late";
}
// =====================================
// Save Attendance
// =====================================

// =====================================
// Save Attendance
// =====================================

function saveAttendance(employee, attendanceStatus) {

    const attendance = JSON.parse(
        localStorage.getItem("attendance")
    ) || [];

    attendance.push({
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        department: employee.department,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        status: attendanceStatus
    });

    localStorage.setItem(
        "attendance",
        JSON.stringify(attendance)
    );

    console.log(attendance);
}
// =====================================
// Security Check
// =====================================

function securityCheck(employee) {

    const attendance = JSON.parse(
        localStorage.getItem("attendance")
    ) || [];

    const today = new Date().toLocaleDateString();

    const alreadyCheckedIn = attendance.some(record =>
        record.employeeNumber === employee.employeeNumber &&
        record.date === today
    );

    if (alreadyCheckedIn) {

        message.style.color = "orange";
        message.innerHTML =
            "⚠️ You have already checked in today.";

        return false;
    }

    return true;
}
// =====================================================
// Validate User Input
// =====================================================

function validateInputs(){

    const employeeNumber = employeeNumberInput.value.trim();
    const pin = pinInput.value.trim();

    if(employeeNumber === ""){

        message.style.color="red";
        message.innerHTML="❌ Please enter your Employee Number.";

        employeeNumberInput.focus();

        return false;

    }

    if(pin === ""){

        message.style.color="red";
        message.innerHTML="❌ Please enter your PIN.";

        pinInput.focus();

        return false;

    }

    return true;

}
// =====================================================
// Validate Employee
// =====================================================

function validateEmployee(){

    const employeeNumber = employeeNumberInput.value.trim();

    const employee = findEmployee(employeeNumber);

    if(!employee){

        message.style.color = "red";
        message.innerHTML = "❌ Employee Number not found.";

        employeeNumberInput.focus();

        return null;

    }

    return employee;

}
// =====================================================
// Validate PIN
// =====================================================

function validatePin(employee) {

    const enteredPin = pinInput.value.trim();

    if (employee.pin !== enteredPin) {

        message.style.color = "red";
        message.innerHTML = "❌ Incorrect PIN.";

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

    const employee = validateEmployee();

    if (!employee) {
        return null;
    }

    if (!validatePin(employee)) {
        return null;
    }

    return employee;

}
