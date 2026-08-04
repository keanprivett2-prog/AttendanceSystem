// =====================================================
// R-E-D Attendance
// Employee QR Check-In
// =====================================================

import {
    db
} from "../firebase/firebase.js";

import {
    collection,
    doc,
    addDoc,
    getDocs,
    getDoc,
    query,
    where,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// Office Boundary
// =====================================================

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


// =====================================================
// Testing
// =====================================================

// Keep TRUE while testing.
//
// Change to FALSE before the system goes live
// so duplicate employee/device/browser locks
// become fully active.

const TEST_MODE =
    true;


// =====================================================
// Page Elements
// =====================================================

const employeeNumberInput =
    document.getElementById(
        "employeeNumber"
    );

const pinInput =
    document.getElementById(
        "pin"
    );

const checkInButton =
    document.getElementById(
        "checkInButton"
    );

const message =
    document.getElementById(
        "message"
    );

const clock =
    document.getElementById(
        "clock"
    );


// =====================================================
// Late Reason Elements
// =====================================================

const lateReasonSection =
    document.getElementById(
        "lateReasonSection"
    );

const lateScanTime =
    document.getElementById(
        "lateScanTime"
    );

const lateReasonInput =
    document.getElementById(
        "lateReason"
    );

const submitLateReasonButton =
    document.getElementById(
        "submitLateReasonButton"
    );

const cancelLateReasonButton =
    document.getElementById(
        "cancelLateReasonButton"
    );

const lateReasonMessage =
    document.getElementById(
        "lateReasonMessage"
    );


// =====================================================
// QR Scan State
// =====================================================

// Because this page is opened by scanning the QR code,
// this captures approximately when the QR code was
// originally scanned.
//
// This time is preserved even when a late employee
// spends several minutes typing their reason.

let originalScanTime =
    new Date();


// Holds a late check-in while we wait for the
// employee to provide their mandatory reason.

let pendingLateCheckIn =
    null;


// =====================================================
// Start System
// =====================================================

initializeSystem();


// =====================================================
// Initialize
// =====================================================

function initializeSystem() {

    originalScanTime =
        new Date();

    updateClock();

    setInterval(
        updateClock,
        1000
    );

    checkInButton.addEventListener(
        "click",
        checkIn
    );

    submitLateReasonButton.addEventListener(
        "click",
        submitLateReason
    );

    cancelLateReasonButton.addEventListener(
        "click",
        cancelLateReason
    );

    lateReasonSection.hidden =
        true;

    message.style.color =
        "#0b5ed7";

    message.innerHTML =
        "Ready for employee check-in.";

}


// =====================================================
// Live Clock
// =====================================================

function updateClock() {

    const now =
        new Date();

    const options = {

        weekday:
            "long",

        year:
            "numeric",

        month:
            "long",

        day:
            "numeric"

    };

    clock.innerHTML =
        now.toLocaleDateString(
            "en-ZA",
            options
        )
        +
        "<br>"
        +
        now.toLocaleTimeString(
            "en-ZA"
        );

}


// =====================================================
// Local Date Key
// =====================================================

function getLocalDateKey(
    date = new Date()
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return (
        year
        +
        "-"
        +
        month
        +
        "-"
        +
        day
    );

}


// =====================================================
// Failed Attendance Attempt
// =====================================================

async function saveFailedAttendanceAttempt(
    employee,
    reason,
    location = null,
    distanceMetres = null,
    locationStatus = null
) {

    try {

        const now =
            new Date();

        await addDoc(
            collection(
                db,
                "attendanceAttempts"
            ),
            {

                employeeNumber:
                    employee.employeeNumber ??
                    "",

                name:
                    employee.name ??
                    "",

                department:
                    employee.department ??
                    "",

                result:
                    "Failed",

                reason:
                    reason,

                dateKey:
                    getLocalDateKey(
                        now
                    ),

                date:
                    now.toLocaleDateString(
                        "en-ZA"
                    ),

                time:
                    now.toLocaleTimeString(
                        "en-ZA"
                    ),

                latitude:
                    location?.latitude ??
                    null,

                longitude:
                    location?.longitude ??
                    null,

                accuracy:
                    location?.accuracy ??
                    null,

                distanceMetres:
                    distanceMetres ??
                    null,

                locationStatus:
                    locationStatus ??
                    null,

                deviceId:
                    getDeviceId(),

                fingerprint:
                    getFingerprint(),

                createdAt:
                    serverTimestamp()

            }
        );

    } catch (error) {

        console.error(
            "Failed attempt could not be logged:",
            error
        );

    }

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

    const metresPerDegreeLatitude =
        111320;

    const averageLatitudeRadians =
        latitude *
        Math.PI /
        180;

    const metresPerDegreeLongitude =
        111320 *
        Math.cos(
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
        endX -
        startX;

    const lineY =
        endY -
        startY;

    const lineLengthSquared =
        lineX *
        lineX
        +
        lineY *
        lineY;

    let position =
        0;

    if (
        lineLengthSquared !==
        0
    ) {

        position =
            (
                (
                    pointX -
                    startX
                )
                *
                lineX
                +
                (
                    pointY -
                    startY
                )
                *
                lineY
            )
            /
            lineLengthSquared;

    }

    position =
        Math.max(
            0,
            Math.min(
                1,
                position
            )
        );

    const nearestX =
        startX
        +
        position *
        lineX;

    const nearestY =
        startY
        +
        position *
        lineY;

    const differenceX =
        pointX -
        nearestX;

    const differenceY =
        pointY -
        nearestY;

    return Math.sqrt(
        differenceX *
        differenceX
        +
        differenceY *
        differenceY
    );

}


// =====================================================
// Distance from Office Boundary
// =====================================================

function calculateDistanceFromOfficeBoundary(
    latitude,
    longitude
) {

    let shortestDistance =
        Infinity;

    for (
        let index = 0;
        index <
        OFFICE_BOUNDARY.length;
        index++
    ) {

        const currentCorner =
            OFFICE_BOUNDARY[
                index
            ];

        const nextCorner =
            OFFICE_BOUNDARY[
                (
                    index +
                    1
                )
                %
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
// Attendance Settings
// =====================================================

async function getAttendanceSettings() {

    try {

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

            return {

                standardStartTime:
                    "08:00",

                lateThreshold:
                    "08:15"

            };

        }

        const settings =
            settingsSnapshot.data();

        return {

            standardStartTime:
                settings.standardStartTime ??
                "08:00",

            lateThreshold:
                settings.lateThreshold ??
                "08:15"

        };

    } catch (error) {

        console.error(
            "Unable to load attendance settings:",
            error
        );

        return {

            standardStartTime:
                "08:00",

            lateThreshold:
                "08:15"

        };

    }

}


// =====================================================
// Main Check-In
// =====================================================

async function checkIn() {

    // Use the original QR/page-open time,
    // not the time the employee clicks Submit.

    const scanTime =
        new Date(
            originalScanTime.getTime()
        );

    checkInButton.disabled =
        true;

    message.style.color =
        "#0b5ed7";

    message.innerHTML =
        "Starting attendance verification...";

    try {

        // =================================================
        // Authenticate Employee
        // =================================================

        const employee =
            await authenticateEmployee();

        if (!employee) {

            checkInButton.disabled =
                false;

            return;

        }


        // =================================================
        // Security Check
        // =================================================

        const securityResult =
            await securityCheck(
                employee
            );

        if (
            !securityResult.allowed
        ) {

            message.style.color =
                "orange";

            message.innerHTML =
                securityResult.message;

            checkInButton.disabled =
                false;

            return;

        }


        // =================================================
        // Attendance Settings / Status
        // =================================================

        const attendanceSettings =
            await getAttendanceSettings();

        const attendanceStatus =
            getAttendanceStatus(
                scanTime,
                attendanceSettings.lateThreshold
            );


        // =================================================
        // Location
        // =================================================

        message.style.color =
            "#0b5ed7";

        message.innerHTML =
            "Getting your current location...";

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


        // =================================================
        // GPS Accuracy
        // =================================================

        if (
            location.accuracy >
            15
        ) {

            locationStatus =
                "Location Uncertain";

        }


        // =================================================
        // Location Rejected
        // =================================================

        if (
            locationStatus !==
            "At Office"
        ) {

            message.style.color =
                "red";

            if (
                locationStatus ===
                "Location Uncertain"
            ) {

                message.innerHTML =
                    "❌ Check-in denied because your GPS location is not accurate enough."
                    +
                    "<br>Please move near a window or outside and try again."
                    +
                    "<br>Current GPS Accuracy: ±"
                    +
                    Math.round(
                        location.accuracy
                    )
                    +
                    " metres";

            } else {

                message.innerHTML =
                    "❌ Check-in denied."
                    +
                    "<br>You are outside the office boundary.";

            }

            await saveFailedAttendanceAttempt(
                employee,

                locationStatus ===
                "Location Uncertain"
                    ?
                    "GPS location was not accurate enough"
                    :
                    "Outside office boundary",

                location,
                distanceMetres,
                locationStatus
            );

            checkInButton.disabled =
                false;

            return;

        }


        // =================================================
        // Late Check-In
        // =================================================

        if (
            attendanceStatus ===
            "Late"
        ) {

            pendingLateCheckIn = {

                employee:
                    employee,

                attendanceStatus:
                    attendanceStatus,

                location:
                    location,

                distanceMetres:
                    distanceMetres,

                locationStatus:
                    locationStatus,

                scanTime:
                    scanTime

            };

            lateScanTime.textContent =
                scanTime.toLocaleTimeString(
                    "en-ZA"
                );

            lateReasonInput.value =
                "";

            lateReasonMessage.textContent =
                "";

            lateReasonSection.hidden =
                false;

            employeeNumberInput.disabled =
                true;

            pinInput.disabled =
                true;

            message.style.color =
                "orange";

            message.innerHTML =
                "⚠️ You are checking in late."
                +
                "<br>Please provide a reason before attendance can be recorded.";

            lateReasonInput.focus();

            return;

        }


        // =================================================
        // On-Time Attendance Save
        // =================================================

        await saveAttendanceToFirebase(
            employee,
            attendanceStatus,
            location,
            distanceMetres,
            locationStatus,
            scanTime,
            ""
        );

        saveAttendance(
            employee,
            attendanceStatus,
            scanTime,
            ""
        );

        showSuccessfulAttendance(
            employee,
            attendanceStatus,
            location,
            distanceMetres,
            locationStatus,
            scanTime,
            ""
        );

        resetCheckInForm();

    } catch (error) {

        console.error(
            "Check-in error:",
            error
        );

        handleAttendanceSaveError(
            error,
            message
        );

        checkInButton.disabled =
            false;

    }

}


// =====================================================
// Submit Mandatory Late Reason
// =====================================================

async function submitLateReason() {

    if (
        !pendingLateCheckIn
    ) {

        lateReasonMessage.style.color =
            "red";

        lateReasonMessage.textContent =
            "No pending late check-in was found.";

        return;

    }

    const reason =
        lateReasonInput.value
            .trim();

    if (!reason) {

        lateReasonMessage.style.color =
            "red";

        lateReasonMessage.textContent =
            "Please enter a reason for being late.";

        lateReasonInput.focus();

        return;

    }

    if (
        reason.length <
        3
    ) {

        lateReasonMessage.style.color =
            "red";

        lateReasonMessage.textContent =
            "Please provide a valid reason.";

        lateReasonInput.focus();

        return;

    }

    try {

        submitLateReasonButton.disabled =
            true;

        cancelLateReasonButton.disabled =
            true;

        submitLateReasonButton.textContent =
            "Submitting...";

        lateReasonMessage.style.color =
            "#0b5ed7";

        lateReasonMessage.textContent =
            "Saving your late check-in...";

        const {

            employee,
            attendanceStatus,
            location,
            distanceMetres,
            locationStatus,
            scanTime

        } =
            pendingLateCheckIn;


        // =================================================
        // Save Late Attendance
        // =================================================

        await saveAttendanceToFirebase(
            employee,
            attendanceStatus,
            location,
            distanceMetres,
            locationStatus,
            scanTime,
            reason
        );

        saveAttendance(
            employee,
            attendanceStatus,
            scanTime,
            reason
        );

        lateReasonSection.hidden =
            true;

        showSuccessfulAttendance(
            employee,
            attendanceStatus,
            location,
            distanceMetres,
            locationStatus,
            scanTime,
            reason
        );

        pendingLateCheckIn =
            null;

        resetCheckInForm();

    } catch (error) {

        console.error(
            "Late check-in save error:",
            error
        );

        handleAttendanceSaveError(
            error,
            lateReasonMessage
        );

    } finally {

        submitLateReasonButton.disabled =
            false;

        cancelLateReasonButton.disabled =
            false;

        submitLateReasonButton.textContent =
            "Submit Late Check-In";

    }

}


// =====================================================
// Cancel Late Reason
// =====================================================

function cancelLateReason() {

    pendingLateCheckIn =
        null;

    lateReasonInput.value =
        "";

    lateReasonMessage.textContent =
        "";

    lateReasonSection.hidden =
        true;

    employeeNumberInput.disabled =
        false;

    pinInput.disabled =
        false;

    checkInButton.disabled =
        false;

    // A cancelled attempt means a new attempt gets
    // a fresh timestamp.

    originalScanTime =
        new Date();

    message.style.color =
        "#0b5ed7";

    message.innerHTML =
        "Late check-in cancelled. Attendance was not recorded.";

}


// =====================================================
// Save Attendance to Firebase
// =====================================================

async function saveAttendanceToFirebase(
    employee,
    attendanceStatus,
    location,
    distanceMetres,
    locationStatus,
    scanTime,
    lateReason = ""
) {

    const submittedTime =
        new Date();

    const dateKey =
        getLocalDateKey(
            scanTime
        );

    const deviceId =
        getDeviceId();

    const fingerprint =
        getFingerprint();

    const safeDeviceId =
        encodeURIComponent(
            deviceId
        );

    const safeFingerprint =
        encodeURIComponent(
            fingerprint
        );


    // =================================================
    // Daily Lock References
    // =================================================

    const employeeLockRef =
        doc(
            db,
            "employeeDailyLocks",
            employee.employeeNumber
            +
            "_"
            +
            dateKey
        );

    const deviceLockRef =
        doc(
            db,
            "deviceDailyLocks",
            safeDeviceId
            +
            "_"
            +
            dateKey
        );

    const fingerprintLockRef =
        doc(
            db,
            "fingerprintDailyLocks",
            safeFingerprint
            +
            "_"
            +
            dateKey
        );

    const attendanceRef =
        doc(
            db,
            "attendance",
            employee.employeeNumber
            +
            "_"
            +
            dateKey
        );


    // =================================================
    // Firestore Transaction
    // =================================================

    await runTransaction(
        db,
        async (
            transaction
        ) => {

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


            // =================================================
            // Duplicate Security
            // =================================================

            if (!TEST_MODE) {

                if (
                    employeeLock.exists()
                ) {

                    throw new Error(
                        "EMPLOYEE_ALREADY_CHECKED_IN"
                    );

                }

                if (
                    deviceLock.exists()
                ) {

                    throw new Error(
                        "DEVICE_ALREADY_USED"
                    );

                }

                if (
                    fingerprintLock.exists()
                ) {

                    throw new Error(
                        "FINGERPRINT_ALREADY_USED"
                    );

                }

            }


            // =================================================
            // Attendance Record
            // =================================================

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
                        scanTime.toLocaleDateString(
                            "en-ZA"
                        ),

                    dateKey:
                        dateKey,

                    // Official attendance time is the
                    // original QR scan/page-open time.

                    time:
                        scanTime.toLocaleTimeString(
                            "en-ZA"
                        ),

                    status:
                        attendanceStatus,

                    lateReason:
                        attendanceStatus ===
                        "Late"
                            ?
                            lateReason
                            :
                            "",

                    checkInMethod:
                        "QR Code",

                    latitude:
                        location.latitude,

                    longitude:
                        location.longitude,

                    locationAccuracyMetres:
                        Math.round(
                            location.accuracy
                        ),

                    distanceFromOfficeMetres:
                        Math.round(
                            distanceMetres
                        ),

                    locationStatus:
                        locationStatus,

                    mapsLink:
                        "https://www.google.com/maps?q="
                        +
                        location.latitude
                        +
                        ","
                        +
                        location.longitude,

                    deviceId:
                        deviceId,

                    fingerprint:
                        fingerprint,

                    // Stores actual original scan timestamp.

                    scanTimestamp:
                        scanTime,

                    // Stores when the final record was
                    // actually submitted.

                    submittedTimestamp:
                        submittedTime,

                    createdAt:
                        serverTimestamp()

                }
            );


            // =================================================
            // Employee Daily Lock
            // =================================================

            transaction.set(
                employeeLockRef,
                {

                    employeeNumber:
                        employee.employeeNumber,

                    dateKey:
                        dateKey,

                    scanTimestamp:
                        scanTime,

                    createdAt:
                        serverTimestamp()

                }
            );


            // =================================================
            // Device Daily Lock
            // =================================================

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


            // =================================================
            // Fingerprint Daily Lock
            // =================================================

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
// Show Successful Attendance
// =====================================================

function showSuccessfulAttendance(
    employee,
    attendanceStatus,
    location,
    distanceMetres,
    locationStatus,
    scanTime,
    lateReason
) {

    message.style.color =
        "green";

    let resultMessage =
        "✅ Welcome, "
        +
        escapeHtml(
            employee.name
        )
        +
        "!<br><br>"
        +
        "Attendance recorded successfully."
        +
        "<br>"
        +
        "Attendance Status: "
        +
        escapeHtml(
            attendanceStatus
        )
        +
        "<br>"
        +
        "Check-In Time: "
        +
        scanTime.toLocaleTimeString(
            "en-ZA"
        );


    if (
        attendanceStatus ===
        "Late"
    ) {

        resultMessage +=
            "<br>"
            +
            "Late Reason: "
            +
            escapeHtml(
                lateReason
            );

    }


    resultMessage +=
        "<br>"
        +
        "Location Status: "
        +
        escapeHtml(
            locationStatus
        )
        +
        "<br>"
        +
        "Distance from Office Boundary: "
        +
        Math.round(
            distanceMetres
        )
        +
        " metres"
        +
        "<br>"
        +
        "GPS Accuracy: ±"
        +
        Math.round(
            location.accuracy
        )
        +
        " metres";

    message.innerHTML =
        resultMessage;

}


// =====================================================
// Attendance Error Handler
// =====================================================

function handleAttendanceSaveError(
    error,
    targetElement
) {

    if (
        error.message ===
        "EMPLOYEE_ALREADY_CHECKED_IN"
    ) {

        targetElement.style.color =
            "orange";

        targetElement.innerHTML =
            "⚠️ You have already checked in today.";

        return;

    }

    if (
        error.message ===
        "DEVICE_ALREADY_USED"
    ) {

        targetElement.style.color =
            "orange";

        targetElement.innerHTML =
            "⚠️ This device has already been used for a check-in today.";

        return;

    }

    if (
        error.message ===
        "FINGERPRINT_ALREADY_USED"
    ) {

        targetElement.style.color =
            "orange";

        targetElement.innerHTML =
            "⚠️ This browser has already been used for a check-in today.";

        return;

    }

    targetElement.style.color =
        "red";

    targetElement.innerHTML =
        "❌ Attendance could not be saved. Please try again.";

}


// =====================================================
// Reset Check-In Form
// =====================================================

function resetCheckInForm() {

    employeeNumberInput.value =
        "";

    pinInput.value =
        "";

    employeeNumberInput.disabled =
        false;

    pinInput.disabled =
        false;

    checkInButton.disabled =
        false;

    lateReasonInput.value =
        "";

    lateReasonMessage.textContent =
        "";

    lateReasonSection.hidden =
        true;

    pendingLateCheckIn =
        null;

    // Ready for a future QR/check-in attempt.

    originalScanTime =
        new Date();

}


// =====================================================
// Get Current Location
// =====================================================

async function getCurrentLocation() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                !navigator.geolocation
            ) {

                reject(
                    new Error(
                        "GEOLOCATION_NOT_SUPPORTED"
                    )
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

                    console.error(
                        "Geolocation error:",
                        error
                    );

                    reject(
                        new Error(
                            "GEOLOCATION_FAILED"
                        )
                    );

                },

                {

                    enableHighAccuracy:
                        true,

                    timeout:
                        10000,

                    maximumAge:
                        0

                }

            );

        }
    );

}


// =====================================================
// Point Inside Office Boundary
// =====================================================

function isInsideOfficeBoundary(
    latitude,
    longitude
) {

    let inside =
        false;

    for (
        let index = 0,
            previousIndex =
                OFFICE_BOUNDARY.length -
                1;

        index <
        OFFICE_BOUNDARY.length;

        previousIndex =
            index++
    ) {

        const currentPoint =
            OFFICE_BOUNDARY[
                index
            ];

        const previousPoint =
            OFFICE_BOUNDARY[
                previousIndex
            ];

        const intersects =
            (
                currentPoint.latitude >
                latitude
            )
            !==
            (
                previousPoint.latitude >
                latitude
            )
            &&
            longitude
            <
            (
                (
                    previousPoint.longitude
                    -
                    currentPoint.longitude
                )
                *
                (
                    latitude
                    -
                    currentPoint.latitude
                )
                /
                (
                    previousPoint.latitude
                    -
                    currentPoint.latitude
                )
                +
                currentPoint.longitude
            );

        if (
            intersects
        ) {

            inside =
                !inside;

        }

    }

    return inside;

}


// =====================================================
// Location Status
// =====================================================

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

function getAttendanceStatus(
    scanTime,
    lateThreshold
) {

    const [
        thresholdHour,
        thresholdMinute
    ] =
        String(
            lateThreshold ??
            "08:15"
        )
            .split(":")
            .map(Number);

    const scanHour =
        scanTime.getHours();

    const scanMinute =
        scanTime.getMinutes();

    if (
        scanHour <
        thresholdHour
        ||
        (
            scanHour ===
            thresholdHour
            &&
            scanMinute <=
            thresholdMinute
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
    attendanceStatus,
    scanTime,
    lateReason = ""
) {

    const attendance =
        JSON.parse(
            localStorage.getItem(
                "attendance"
            )
        )
        ||
        [];

    attendance.push(
        {

            employeeNumber:
                employee.employeeNumber,

            name:
                employee.name,

            department:
                employee.department,

            date:
                scanTime.toLocaleDateString(
                    "en-ZA"
                ),

            time:
                scanTime.toLocaleTimeString(
                    "en-ZA"
                ),

            status:
                attendanceStatus,

            lateReason:
                attendanceStatus ===
                "Late"
                    ?
                    lateReason
                    :
                    ""

        }
    );

    localStorage.setItem(
        "attendance",
        JSON.stringify(
            attendance
        )
    );

}


// =====================================================
// Security Check
// =====================================================

async function securityCheck(
    employee
) {

    if (
        TEST_MODE
    ) {

        return {

            allowed:
                true,

            message:
                ""

        };

    }

    const attendance =
        JSON.parse(
            localStorage.getItem(
                "attendance"
            )
        )
        ||
        [];

    const today =
        new Date()
            .toLocaleDateString(
                "en-ZA"
            );

    const alreadyCheckedIn =
        attendance.some(
            record => {

                return (
                    record.employeeNumber ===
                    employee.employeeNumber
                    &&
                    record.date ===
                    today
                );

            }
        );

    if (
        alreadyCheckedIn
    ) {

        return {

            allowed:
                false,

            message:
                "⚠️ You have already checked in today."

        };

    }

    return {

        allowed:
            true,

        message:
            ""

    };

}


// =====================================================
// Validate Inputs
// =====================================================

function validateInputs() {

    const employeeNumber =
        employeeNumberInput.value
            .trim();

    const pin =
        pinInput.value
            .trim();

    if (
        employeeNumber ===
        ""
    ) {

        message.style.color =
            "red";

        message.innerHTML =
            "❌ Please enter your Employee Number.";

        employeeNumberInput.focus();

        return false;

    }

    if (
        pin ===
        ""
    ) {

        message.style.color =
            "red";

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
        employeeNumberInput.value
            .trim();

    const employeeQuery =
        query(
            collection(
                db,
                "employees"
            ),
            where(
                "employeeNumber",
                "==",
                employeeNumber
            )
        );

    const employeeSnapshot =
        await getDocs(
            employeeQuery
        );

    if (
        employeeSnapshot.empty
    ) {

        message.style.color =
            "red";

        message.innerHTML =
            "❌ Employee Number not found.";

        employeeNumberInput.focus();

        return null;

    }

    const employeeDocument =
        employeeSnapshot.docs[
            0
        ];

    return {

        id:
            employeeDocument.id,

        ...employeeDocument.data()

    };

}


// =====================================================
// Validate PIN
// =====================================================

function validatePin(
    employee
) {

    const enteredPin =
        pinInput.value
            .trim();

    if (
        String(
            employee.pin ??
            ""
        )
        !==
        enteredPin
    ) {

        message.style.color =
            "red";

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

async function authenticateEmployee() {

    if (
        !validateInputs()
    ) {

        return null;

    }

    const employee =
        await validateEmployee();

    if (
        !employee
    ) {

        return null;

    }

    if (
        employee.active ===
        false
    ) {

        message.style.color =
            "red";

        message.innerHTML =
            "❌ This employee has been disabled."
            +
            "<br>Please contact your administrator.";

        return null;

    }

    if (
        !validatePin(
            employee
        )
    ) {

        return null;

    }

    return employee;

}


// =====================================================
// Escape HTML
// =====================================================

function escapeHtml(
    value
) {

    return String(
        value ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}
