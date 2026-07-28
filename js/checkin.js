import { db } from "../firebase/firebase.js";

import {
    collection,
    doc,
    getDocs,
    query,
    where,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
const OFFICE_BOUNDARY = [

    {
        latitude: -26.0462511426058,
        longitude: 28.088917697496093
    },

    {
        latitude: -26.046506468114757,
        longitude: 28.088908675656032
    },

    {
        latitude: -26.046518626458468,
        longitude: 28.08932819121874
    },

    {
        latitude: -26.0462511426058,
        longitude: 28.089323680298712
    }
];

const TEST_MODE = true;

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
// Distance to Office Boundary
// =====================================================

function distanceToLineSegmentMetres(
    latitude,
    longitude,
    startLatitude,
    startLongitude,
    endLatitude,
    endLongitude
) {
    const metresPerDegreeLatitude = 111320;

    const averageLatitudeRadians =
        latitude * Math.PI / 180;

    const metresPerDegreeLongitude =
        111320 * Math.cos(
            averageLatitudeRadians
        );

    const pointX =
        longitude *
        metresPerDegreeLongitude;

    const pointY =
        latitude *
        metresPerDegreeLatitude;

    const startX =
        startLongitude *
        metresPerDegreeLongitude;

    const startY =
        startLatitude *
        metresPerDegreeLatitude;

    const endX =
        endLongitude *
        metresPerDegreeLongitude;

    const endY =
        endLatitude *
        metresPerDegreeLatitude;

    const lineX =
        endX - startX;

    const lineY =
        endY - startY;

    const lineLengthSquared =
        lineX * lineX +
        lineY * lineY;

    let position = 0;

    if (lineLengthSquared !== 0) {
        position =
            (
                (pointX - startX) * lineX +
                (pointY - startY) * lineY
            ) /
            lineLengthSquared;
    }

    position =
        Math.max(
            0,
            Math.min(1, position)
        );

    const nearestX =
        startX +
        position * lineX;

    const nearestY =
        startY +
        position * lineY;

    const differenceX =
        pointX - nearestX;

    const differenceY =
        pointY - nearestY;

    return Math.sqrt(
        differenceX * differenceX +
        differenceY * differenceY
    );
}

function calculateDistanceFromOfficeBoundary(
    latitude,
    longitude
) {
    let shortestDistance =
        Infinity;

    for (
        let i = 0;
        i < OFFICE_BOUNDARY.length;
        i++
    ) {
        const currentCorner =
            OFFICE_BOUNDARY[i];

        const nextCorner =
            OFFICE_BOUNDARY[
                (i + 1) %
                OFFICE_BOUNDARY.length
            ];

        const edgeDistance =
            distanceToLineSegmentMetres(
                latitude,
                longitude,
                currentCorner.latitude,
                currentCorner.longitude,
                nextCorner.latitude,
                nextCorner.longitude
            );

        if (
            edgeDistance <
            shortestDistance
        ) {
            shortestDistance =
                edgeDistance;
        }
    }

    return shortestDistance;
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
    

    const attendanceStatus =
    getAttendanceStatus();

try {

    message.style.color = "#0b5ed7";

    message.innerHTML =
        " Getting your current location...";

    const location =
        await getCurrentLocation();

    const distanceMetres =
    calculateDistanceFromOfficeBoundary(
        location.latitude,
        location.longitude
    );

    let locationStatus =
    getLocationStatus(
        location.latitude,
        location.longitude
    );

    if (location.accuracy > 15) {
    locationStatus = "Location Uncertain";
}

    if (locationStatus !== "At Office") {

    message.style.color = "red";

    if (locationStatus === "Location Uncertain") {

        message.innerHTML =
            "❌ Check-in denied because your GPS location is not accurate enough."
            + "<br>Please move near a window or outside and try again."
            + "<br>Current GPS Accuracy: ±"
            + Math.round(location.accuracy)
            + " metres";

    } else {

        message.innerHTML =
            "❌ Check-in denied."
            + "<br>You are outside the office boundary.";

    }

    return;
}


    
console.log("Saving attendance to Firebase...", {
    employeeNumber: employee.employeeNumber,
    location,
    distanceMetres,
    locationStatus
    
});
    await saveAttendanceToFirebase(
        employee,
        attendanceStatus,
        location,
        distanceMetres,
        locationStatus
    );
console.log("Firebase save completed.");
    
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
    " Welcome, "
    + employee.name
    + "!<br><br>"
    + "Attendance recorded successfully.<br>"
    + "Attendance Status: "
    + attendanceStatus
    + "<br>"
    + "Location Status: "
    + locationStatus
    + "<br>"
    + "Distance from Office Boundary: "
    + Math.round(distanceMetres)
    + " metres"
    + "<br>"
    + "GPS Accuracy: ±"
    + Math.round(location.accuracy)
    + " metres";

        employeeNumberInput.value = "";
        pinInput.value = "";

   } catch (error) {

    console.error(error);

    if (
        error.message ===
        "EMPLOYEE_ALREADY_CHECKED_IN"
    ) {

        message.style.color = "orange";

        message.innerHTML =
            " You have already checked in today.";

    } else if (
        error.message ===
        "DEVICE_ALREADY_USED"
    ) {

        message.style.color = "orange";

        message.innerHTML =
            " This device has already been used for a check-in today.";

    } else if (
        error.message ===
        "FINGERPRINT_ALREADY_USED"
    ) {

        message.style.color = "orange";

        message.innerHTML =
            " This browser has already been used for a check-in today.";

    } else {

        message.style.color = "red";

        message.innerHTML =
            "❌ Attendance could not be saved. Please try again.";
    }
    }
}
// =====================================================
// Save Attendance to Firebase
// =====================================================

async function saveAttendanceToFirebase(
    employee,
    attendanceStatus,
    location,
    distanceMetres,
    locationStatus
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

            if (!TEST_MODE) {

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
                    latitude:
    location.latitude,

longitude:
    location.longitude,

locationAccuracyMetres:
    Math.round(location.accuracy),

distanceFromOfficeMetres:
    Math.round(distanceMetres),

locationStatus:
    locationStatus,

mapsLink:
    "https://www.google.com/maps?q="
    + location.latitude
    + ","
    + location.longitude,

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
// Get Current Location
// =====================================================

async function getCurrentLocation() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {

            reject(
                "Geolocation is not supported by this browser."
            );

            return;
        }

        navigator.geolocation.getCurrentPosition(

            position => {

                resolve({
                    latitude:
                        position.coords.latitude,

                    longitude:
                        position.coords.longitude,

                    accuracy:
                        position.coords.accuracy
                });
            },

            error => {

                reject(
                    "Could not retrieve location."
                );
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}
    
function calculateDistanceMetres(
    latitude1,
    longitude1,
    latitude2,
    longitude2
) {

    const earthRadiusMetres = 6371000;

    const toRadians = degrees =>
        degrees * Math.PI / 180;

    const latitudeDifference =
        toRadians(latitude2 - latitude1);

    const longitudeDifference =
        toRadians(longitude2 - longitude1);

    const firstLatitude =
        toRadians(latitude1);

    const secondLatitude =
        toRadians(latitude2);

    const a =
        Math.sin(latitudeDifference / 2) ** 2
        +
        Math.cos(firstLatitude)
        *
        Math.cos(secondLatitude)
        *
        Math.sin(longitudeDifference / 2) ** 2;

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return earthRadiusMetres * c;
}
    
    function isInsideOfficeBoundary(
    latitude,
    longitude
) {

    let inside = false;

    for (
        let i = 0,
        j = OFFICE_BOUNDARY.length - 1;
        i < OFFICE_BOUNDARY.length;
        j = i++
    ) {

        const pointI =
            OFFICE_BOUNDARY[i];

        const pointJ =
            OFFICE_BOUNDARY[j];

        const intersects =
            (
                pointI.latitude > latitude
            ) !== (
                pointJ.latitude > latitude
            )
            &&
            longitude <
            (
                (
                    pointJ.longitude
                    - pointI.longitude
                )
                *
                (
                    latitude
                    - pointI.latitude
                )
                /
                (
                    pointJ.latitude
                    - pointI.latitude
                )
                +
                pointI.longitude
            );

        if (intersects) {
            inside = !inside;
        }
    }

    return inside;
}

function getLocationStatus(
    latitude,
    longitude
) {

    if (
        isInsideOfficeBoundary(
            latitude,
            longitude
        )
    ) {
        return "At Office";
    }

    return "Outside Office";
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

    if (TEST_MODE) {

    return {
        allowed: true,
        message: ""
    };
}

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

async function validateEmployee() {

    const employeeNumber =
        employeeNumberInput.value.trim();

    const employeeQuery = query(
        collection(db, "employees"),
        where("employeeNumber", "==", employeeNumber)
    );

    const employeeSnapshot =
        await getDocs(employeeQuery);

    if (employeeSnapshot.empty) {

        message.style.color = "red";

        message.innerHTML =
            "❌ Employee Number not found.";

        employeeNumberInput.focus();

        return null;
    }

    const employeeDocument =
        employeeSnapshot.docs[0];

    return {
        id: employeeDocument.id,
        ...employeeDocument.data()
    };
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
