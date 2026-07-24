import { db } from "../firebase/firebase.js";

import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

initializeAutoCheckIn();

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

function getRegistration() {

    try {

        const storedRegistration =
            localStorage.getItem(REGISTRATION_KEY);

        if (!storedRegistration) {
            return null;
        }

        return JSON.parse(storedRegistration);

    } catch (error) {

        console.error(
            "Could not read device registration:",
            error
        );

        return null;
    }
}

function saveRegistration(employee) {

    const registration = {
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        department: employee.department,
        deviceId: getDeviceId(),
        fingerprint: getFingerprint()
    };

    localStorage.setItem(
        REGISTRATION_KEY,
        JSON.stringify(registration)
    );

    return registration;
}

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

    showRegisteredEmployee(registration);

    message.style.color = "green";
    message.textContent =
        "Browser registered successfully.";

    automaticCheckIn(registration);
}

async function automaticCheckIn(registration) {

    try {

        message.style.color = "#0b5ed7";
        message.textContent =
            "Checking attendance status...";

        const alreadyCheckedIn =
            await hasCheckedInToday(
                registration.employeeNumber
            );

        if (alreadyCheckedIn) {

            message.style.color = "orange";
            message.textContent =
                "Attendance has already been recorded today.";

            return;
        }

        const attendanceStatus =
            getAttendanceStatus();

        const now =
            new Date();

        await addDoc(
            collection(db, "attendance"),
            {
                employeeNumber:
                    registration.employeeNumber,

                name:
                    registration.name,

                department:
                    registration.department,

                date:
                    now.toLocaleDateString("en-ZA"),

                dateKey:
                    getLocalDateKey(now),

                time:
                    now.toLocaleTimeString("en-ZA"),

                status:
                    attendanceStatus,

                checkInMethod:
                    "Automatic Browser Check-In",

                deviceId:
                    registration.deviceId,

                fingerprint:
                    registration.fingerprint,

                createdAt:
                    serverTimestamp()
            }
        );

        message.style.color = "green";

        message.textContent =
            "Attendance recorded automatically for "
            + registration.name
            + ". Status: "
            + attendanceStatus;

    } catch (error) {

        console.error(
            "Automatic check-in failed:",
            error
        );

        message.style.color = "red";
        message.textContent =
            "Automatic attendance could not be recorded.";
    }
}

async function hasCheckedInToday(
    employeeNumber
) {

    const todayKey =
        getLocalDateKey(new Date());

    const attendanceQuery =
        query(
            collection(db, "attendance"),

            where(
                "employeeNumber",
                "==",
                employeeNumber
            ),

            where(
                "dateKey",
                "==",
                todayKey
            )
        );

    const snapshot =
        await getDocs(attendanceQuery);

    return !snapshot.empty;
}

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

    return `${year}-${month}-${day}`;
}

function showRegistrationForm() {

    registrationSection.hidden = false;
    registeredSection.hidden = true;
}

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
