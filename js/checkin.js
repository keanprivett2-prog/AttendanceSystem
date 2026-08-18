// =====================================================
// R-E-D Attendance
// Employee QR Check-In
// =====================================================

import {
    db,
    firebaseConfig
} from "../firebase/firebase.js";

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    doc,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// =====================================================
// Employee Attendance Authentication
// =====================================================

const attendanceAuthApp =
    initializeApp(
        firebaseConfig,
        "attendance-employee-auth"
    );

const attendanceAuth =
    getAuth(
        attendanceAuthApp
    );

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
    false;

    // =====================================================
// Registered Employee Device
// =====================================================

const DEVICE_REGISTRATION_KEY =
    "attendanceDeviceRegistration";

    // =====================================================
// Generate Device Registration Token
// =====================================================

function generateDeviceRegistrationToken() {

    if (
        crypto.randomUUID
    ) {

        return crypto.randomUUID();

    }

    return (
        Date.now().toString(36)
        +
        "-"
        +
        Math.random()
            .toString(36)
            .substring(2)
        +
        "-"
        +
        Math.random()
            .toString(36)
            .substring(2)
    );

}

// =====================================================
// Get Firebase Device Registration
// =====================================================

async function getFirebaseDeviceRegistration(
    employeeNumber
) {

    const safeEmployeeNumber =
        String(
            employeeNumber ??
            ""
        ).trim();

    if (
        !safeEmployeeNumber
    ) {

        return null;

    }

    const registrationReference =
        doc(
            db,
            "employeeDeviceRegistrations",
            safeEmployeeNumber
        );

    const registrationSnapshot =
        await getDoc(
            registrationReference
        );

    if (
        !registrationSnapshot.exists()
    ) {

        return null;

    }

    return {

        reference:
            registrationReference,

        ...registrationSnapshot.data()

    };

}

// =====================================================
// Create Firebase Device Registration
// =====================================================

async function createFirebaseDeviceRegistration(
    employee
) {

    const employeeNumber =
        String(
            employee.employeeNumber ??
            ""
        ).trim();

    if (
        !employeeNumber
    ) {

        throw new Error(
            "EMPLOYEE_NUMBER_MISSING"
        );

    }

    const registrationToken =
        generateDeviceRegistrationToken();

    const registrationReference =
        doc(
            db,
            "employeeDeviceRegistrations",
            employeeNumber
        );

    await setDoc(
        registrationReference,
        {

            employeeNumber:
                employeeNumber,

            registrationToken:
                registrationToken,

            active:
                true,

            deviceId:
                getDeviceId(),

            fingerprint:
                getFingerprint(),

            registeredAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        }
    );

    return registrationToken;

}

// =====================================================
// Save Local Device Registration
// =====================================================

function saveLocalDeviceRegistration(
    employeeNumber,
    registrationToken
) {

    const registration = {

        employeeNumber:
            String(
                employeeNumber ??
                ""
            ).trim(),

        registrationToken:
            String(
                registrationToken ??
                ""
            ).trim(),

        registeredAt:
            new Date().toISOString()

    };

    localStorage.setItem(
        DEVICE_REGISTRATION_KEY,
        JSON.stringify(
            registration
        )
    );

}

// =====================================================
// Location Tolerance
// =====================================================

const OFFICE_BUFFER_METRES =
    25;

const MAX_GPS_ACCURACY_METRES =
    50;


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

    const hybridWorkLocationContainer =
    document.getElementById(
        "hybridWorkLocationContainer"
    );

const hybridWorkLocation =
    document.getElementById(
        "hybridWorkLocation"
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
// Early Exit Elements
// =====================================================

const earlyExitSection =
    document.getElementById(
        "earlyExitSection"
    );

const scheduledEndTime =
    document.getElementById(
        "scheduledEndTime"
    );

const earlyExitScanTime =
    document.getElementById(
        "earlyExitScanTime"
    );

const earlyExitReason =
    document.getElementById(
        "earlyExitReason"
    );

const earlyExitOtherSection =
    document.getElementById(
        "earlyExitOtherSection"
    );

const earlyExitNote =
    document.getElementById(
        "earlyExitNote"
    );

const submitEarlyExitButton =
    document.getElementById(
        "submitEarlyExitButton"
    );

const cancelEarlyExitButton =
    document.getElementById(
        "cancelEarlyExitButton"
    );

const earlyExitMessage =
    document.getElementById(
        "earlyExitMessage"
    );

    // =====================================================
// Late Check-Out Elements
// =====================================================

const lateCheckOutSection =
    document.getElementById(
        "lateCheckOutSection"
    );

const lateCheckOutScheduledEndTime =
    document.getElementById(
        "lateCheckOutScheduledEndTime"
    );

const lateCheckOutScanTime =
    document.getElementById(
        "lateCheckOutScanTime"
    );

const lateCheckOutReason =
    document.getElementById(
        "lateCheckOutReason"
    );

const submitLateCheckOutButton =
    document.getElementById(
        "submitLateCheckOutButton"
    );

const cancelLateCheckOutButton =
    document.getElementById(
        "cancelLateCheckOutButton"
    );

const lateCheckOutMessage =
    document.getElementById(
        "lateCheckOutMessage"
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

    // Holds an early check-out while the employee
// selects the reason for leaving early.

let pendingEarlyCheckOut =
    null;

    // Holds a late check-out while the employee
// provides a mandatory reason for staying late.

let pendingLateCheckOut =
    null;


// Zero-minute grace period before scheduled end time.

const EARLY_EXIT_GRACE_MINUTES =
    0;

    // =====================================================
// Late Check-Out Grace Period
// =====================================================

// Employees may check out up to 15 minutes
// after their scheduled end time without
// being asked for a late check-out reason.
//
// Example:
// Scheduled end: 17:00
// 17:00 - 17:15 = Normal
// After 17:15 = Late check-out reason required.

const LATE_CHECKOUT_GRACE_MINUTES =
    15;


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

    employeeNumberInput.addEventListener(
    "input",
    () => {

        hybridWorkLocation.value =
            "";

        hybridWorkLocationContainer.style.display =
            "none";

    }
);

    submitLateReasonButton.addEventListener(
        "click",
        submitLateReason
    );

    cancelLateReasonButton.addEventListener(
        "click",
        cancelLateReason
    );

    earlyExitReason.addEventListener(
    "change",
    handleEarlyExitReasonChange
);

submitEarlyExitButton.addEventListener(
    "click",
    submitEarlyExit
);

cancelEarlyExitButton.addEventListener(
    "click",
    cancelEarlyExit
);

submitLateCheckOutButton.addEventListener(
    "click",
    submitLateCheckOut
);

cancelLateCheckOutButton.addEventListener(
    "click",
    cancelLateCheckOut
);

earlyExitSection.hidden =
    true;

earlyExitOtherSection.hidden =
    true;

    lateReasonSection.hidden =
        true;

        lateCheckOutSection.hidden =
    true;

    message.style.color =
        "#0b5ed7";

    message.innerHTML =
    "Ready for employee attendance.";

updateRegisteredDeviceDisplay();

startRegisteredEmployeeAttendance();

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
// Get Today's Attendance Record
// =====================================================

async function getTodayAttendanceRecord(
    employee
) {

    const dateKey =
        getLocalDateKey(
            new Date()
        );

    const attendanceReference =
        doc(
            db,
            "attendance",
            employee.employeeNumber
            +
            "_"
            +
            dateKey
        );

    const attendanceSnapshot =
        await getDoc(
            attendanceReference
        );

    if (
        !attendanceSnapshot.exists()
    ) {

        return null;

    }

    return {

        id:
            attendanceSnapshot.id,

        reference:
            attendanceReference,

        ...attendanceSnapshot.data()

    };

}

// =====================================================
// Get Registered Employee
// =====================================================

function getRegisteredEmployeeNumber() {

    try {

        const storedRegistration =
            localStorage.getItem(
                DEVICE_REGISTRATION_KEY
            );

        if (
            !storedRegistration
        ) {

            return "";

        }

        const registration =
            JSON.parse(
                storedRegistration
            );

        return String(
            registration.employeeNumber ??
            ""
        ).trim();

    } catch (
        error
    ) {

        console.error(
            "Unable to read registered employee:",
            error
        );

        return "";

    }

}

// =====================================================
// Load Registered Employee
// =====================================================

async function loadRegisteredEmployee() {

    try {

        const storedRegistration =
            localStorage.getItem(
                DEVICE_REGISTRATION_KEY
            );

        if (
            !storedRegistration
        ) {

            return null;

        }

        const localRegistration =
            JSON.parse(
                storedRegistration
            );

        const employeeNumber =
            String(
                localRegistration.employeeNumber ??
                ""
            ).trim();

        const localToken =
            String(
                localRegistration.registrationToken ??
                ""
            ).trim();

        if (
            !employeeNumber ||
            !localToken
        ) {

            localStorage.removeItem(
                DEVICE_REGISTRATION_KEY
            );

            return null;

        }


        // =============================================
        // Validate Registration Against Firebase
        // =============================================

        const firebaseRegistration =
            await getFirebaseDeviceRegistration(
                employeeNumber
            );

        if (
            !firebaseRegistration ||
            firebaseRegistration.active !== true ||
            String(
                firebaseRegistration.registrationToken ??
                ""
            ).trim() !==
            localToken
        ) {

            localStorage.removeItem(
                DEVICE_REGISTRATION_KEY
            );

            return null;

        }


        // =============================================
        // Load Current Employee Record
        // =============================================

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

            return null;

        }

        const employeeDocument =
            employeeSnapshot.docs[
                0
            ];

        const employee = {

            id:
                employeeDocument.id,

            ...employeeDocument.data()

        };

        if (
            employee.active ===
            false
        ) {

            return null;

        }

        return employee;

    } catch (
        error
    ) {

        console.error(
            "Unable to load registered employee:",
            error
        );

        return null;

    }

}

// =====================================================
// Register Employee On This Device
// =====================================================

function registerEmployeeOnDevice(
    employee
) {

    const registration = {

        employeeNumber:
            String(
                employee.employeeNumber ??
                ""
            ).trim(),

        registeredAt:
            new Date().toISOString()

    };

    localStorage.setItem(
        DEVICE_REGISTRATION_KEY,
        JSON.stringify(
            registration
        )
    );

}

// =====================================================
// Start Registered Employee Attendance
// =====================================================

async function startRegisteredEmployeeAttendance() {

    const registeredEmployeeNumber =
        getRegisteredEmployeeNumber();

    if (
        !registeredEmployeeNumber
    ) {

        return;

    }

    message.style.color =
        "#0b5ed7";

    message.innerHTML =
        "Registered device detected. Starting attendance...";

    await checkIn();

}

// =====================================================
// Registered Device Display
// =====================================================

function updateRegisteredDeviceDisplay() {

    const isRegistered =
        getRegisteredEmployeeNumber() !==
        "";

    const employeeNumberLabel =
        document.querySelector(
            'label[for="employeeNumber"]'
        );

    const pinLabel =
        document.querySelector(
            'label[for="pin"]'
        );


    if (
        isRegistered
    ) {

        employeeNumberInput.style.setProperty(
            "display",
            "none",
            "important"
        );

        pinInput.style.setProperty(
            "display",
            "none",
            "important"
        );

        checkInButton.style.setProperty(
            "display",
            "none",
            "important"
        );

        if (
            employeeNumberLabel
        ) {

            employeeNumberLabel.style.setProperty(
                "display",
                "none",
                "important"
            );

        }

        if (
            pinLabel
        ) {

            pinLabel.style.setProperty(
                "display",
                "none",
                "important"
            );

        }

        return;

    }


    // =====================================
    // Not Registered - Show Login Fields
    // =====================================

    employeeNumberInput.style.removeProperty(
        "display"
    );

    pinInput.style.removeProperty(
        "display"
    );

    checkInButton.style.removeProperty(
        "display"
    );

    if (
        employeeNumberLabel
    ) {

        employeeNumberLabel.style.removeProperty(
            "display"
        );

    }

    if (
        pinLabel
    ) {

        pinLabel.style.removeProperty(
            "display"
        );

    }

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

    const employeeNumber =
        employeeNumberInput.value.trim();

    const enteredPin =
        pinInput.value.trim();

    try {

        // =============================================
        // Load Employee Record First
        // =============================================

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
                "❌ Invalid Employee Number or PIN.";

            return null;
        }

        const employeeDocument =
            employeeSnapshot.docs[0];

        const employee = {
            id:
                employeeDocument.id,

            ...employeeDocument.data()
        };


        // =============================================
        // Active Employee Check
        // =============================================

        if (
            employee.active ===
            false
        ) {

            message.style.color =
                "red";

            message.innerHTML =
                "❌ This employee account is inactive.";

            return null;
        }


        // =============================================
        // Determine Hidden Auth Email
        // =============================================

        const employeeAuthEmail =
            String(
                employee.authEmail ??
                `${employeeNumber}@attendance.local`
            ).trim();


        // =============================================
        // Authenticate With Firebase
        // =============================================

        const userCredential =
            await signInWithEmailAndPassword(
                attendanceAuth,
                employeeAuthEmail,
                enteredPin
            );

        const authenticatedUser =
            userCredential.user;


        // =============================================
        // Verify Auth UID
        // =============================================

        if (
            !employee.authUid ||
            employee.authUid !==
            authenticatedUser.uid
        ) {

            await signOut(
                attendanceAuth
            );

            message.style.color =
                "red";

            message.innerHTML =
                "❌ Employee authentication account does not match.";

            return null;
        }


        // =============================================
        // Clear Temporary Auth Session
        // =============================================

        await signOut(
            attendanceAuth
        );

        return employee;

    } catch (error) {

        console.error(
            "Employee authentication error:",
            error
        );

        try {

            await signOut(
                attendanceAuth
            );

        } catch (signOutError) {

            console.error(
                "Employee Auth sign-out error:",
                signOutError
            );
        }

        message.style.color =
            "red";

        if (
            error.code ===
            "auth/invalid-credential" ||
            error.code ===
            "auth/wrong-password" ||
            error.code ===
            "auth/user-not-found"
        ) {

            message.innerHTML =
                "❌ Invalid Employee Number or PIN.";

        } else {

            message.innerHTML =
                "❌ Employee authentication failed.";
        }

        return null;
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
        // Load Registered Employee / Authenticate
        // =================================================

        hybridWorkLocationContainer.style.display =
            "none";

        let employee =
            await loadRegisteredEmployee();

        if (
            !employee
        ) {

            updateRegisteredDeviceDisplay();

            employee =
                await authenticateEmployee();

            if (
                !employee
            ) {

                checkInButton.disabled =
                    false;

                return;

            }


            // =============================================
            // Check Existing Firebase Registration
            // =============================================

            const existingRegistration =
                await getFirebaseDeviceRegistration(
                    employee.employeeNumber
                );

            if (
                existingRegistration &&
                existingRegistration.active ===
                true
            ) {

                message.style.color =
                    "red";

                message.innerHTML =
                    "❌ This employee already has a registered device."
                    +
                    "<br>Please contact an administrator to reset the device registration.";

                checkInButton.disabled =
                    false;

                return;

            }


            // =============================================
            // Create New Registration
            // =============================================

            const registrationToken =
                await createFirebaseDeviceRegistration(
                    employee
                );

            saveLocalDeviceRegistration(
                employee.employeeNumber,
                registrationToken
            );

        }


        // =================================================
        // Check Existing Attendance
        // =================================================

        const existingAttendance =
            await getTodayAttendanceRecord(
                employee
            );

        if (
            existingAttendance &&
            !existingAttendance.checkOutTime
        ) {

            await beginCheckOut(
                employee,
                existingAttendance
            );

            return;

        }


        if (
            existingAttendance &&
            existingAttendance.checkOutTime
        ) {

            message.style.color =
                "orange";

            message.innerHTML =
                "⚠️ Your attendance for today is already complete."
                +
                "<br>Check In: "
                +
                escapeHtml(
                    existingAttendance.time ??
                    "-"
                )
                +
                "<br>Check Out: "
                +
                escapeHtml(
                    existingAttendance.checkOutTime ??
                    "-"
                );

            checkInButton.disabled =
                false;

            return;

        }


        // =================================================
        // Work Arrangement
        // =================================================

        const workArrangement =
            getEmployeeWorkArrangement(
                employee
            );

        let selectedWorkLocation =
            workArrangement;

        if (
            workArrangement ===
            "Hybrid"
        ) {

            hybridWorkLocationContainer.style.display =
                "block";

            selectedWorkLocation =
                hybridWorkLocation.value;

            if (
                selectedWorkLocation ===
                ""
            ) {

                message.style.color =
                    "#0b5ed7";

                message.innerHTML =
                    "Please select where you are working today.";

                checkInButton.disabled =
                    false;

                hybridWorkLocation.focus();

                return;

            }

        } else {

            hybridWorkLocationContainer.style.display =
                "none";

            hybridWorkLocation.value =
                "";

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

        const employeeLateThreshold =
            employee.startTime ??
            attendanceSettings.lateThreshold;

        const attendanceStatus =
            getAttendanceStatus(
                scanTime,
                employeeLateThreshold
            );


        // =================================================
        // Location
        // =================================================

        message.style.color =
            "#0b5ed7";

        let location =
            null;

        if (
            selectedWorkLocation ===
            "Office"
        ) {

            message.innerHTML =
                "Getting your current location...";

            location =
                await getCurrentLocation();

        }

        let distanceMetres =
            0;

        let locationStatus =
            "Remote";

        if (
            selectedWorkLocation ===
            "Office"
        ) {

            distanceMetres =
                calculateDistanceFromOfficeBoundary(
                    location.latitude,
                    location.longitude
                );

            locationStatus =
                getLocationStatus(
                    location.latitude,
                    location.longitude
                );

        }


        if (
            locationStatus ===
            "Outside Office" &&
            distanceMetres <=
            OFFICE_BUFFER_METRES
        ) {

            locationStatus =
                "At Office";

        }


        // =================================================
        // GPS Accuracy
        // =================================================

        if (
            selectedWorkLocation ===
            "Office" &&
            location.accuracy >
            MAX_GPS_ACCURACY_METRES
        ) {

            locationStatus =
                "Location Uncertain";

        }


        // =================================================
        // Location Rejected
        // =================================================

        if (
            selectedWorkLocation ===
            "Office" &&
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

                selectedWorkLocation:
                    selectedWorkLocation,

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
            "",
            selectedWorkLocation
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

        updateRegisteredDeviceDisplay();

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
// Employee Work Arrangement
// =====================================================

function getEmployeeWorkArrangement(
    employee
) {

    const arrangement =
        String(
            employee.workArrangement ??
            "Office"
        ).trim();

    if (
        arrangement === "Remote"
        ||
        arrangement === "Hybrid"
    ) {

        return arrangement;

    }

    return "Office";

}

// =====================================================
// Begin Check-Out
// =====================================================

async function beginCheckOut(
    employee,
    attendanceRecord
) {

    const checkOutTime =
        new Date();

        const workLocation =
    String(
        attendanceRecord.workLocation ??
        getEmployeeWorkArrangement(
            employee
        )
    ).trim();


    // =================================================
    // Verify Check-Out Location
    // =================================================

    message.style.color =
    "#0b5ed7";

let location =
    null;

if (
    workLocation ===
    "Office"
) {

    message.innerHTML =
        "Verifying your check-out location...";

    location =
        await getCurrentLocation();

}

if (
    workLocation ===
    "Remote"
) {

    message.innerHTML =
        "Processing remote check-out...";

}

    let distanceMetres =
    0;

let locationStatus =
    "Remote";

if (
    workLocation ===
    "Office"
) {

    distanceMetres =
        calculateDistanceFromOfficeBoundary(
            location.latitude,
            location.longitude
        );

    locationStatus =
        getLocationStatus(
            location.latitude,
            location.longitude
        );

}


    // Allow small GPS boundary tolerance.

    if (
        locationStatus ===
        "Outside Office"
        &&
        distanceMetres <=
        OFFICE_BUFFER_METRES
    ) {

        locationStatus =
            "At Office";

    }


    // GPS accuracy check.

if (
    workLocation ===
    "Office"
    &&
    location.accuracy >
    MAX_GPS_ACCURACY_METRES
) {

    locationStatus =
        "Location Uncertain";

}


    // =================================================
    // Reject Invalid Check-Out Location
    // =================================================

    if (
    workLocation ===
    "Office"
    &&
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
                "❌ Check-out denied because your GPS location is not accurate enough."
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
                "❌ Check-out denied."
                +
                "<br>You are outside the office boundary.";

        }

        checkInButton.disabled =
            false;

        return;

    }


    // =================================================
    // Employee Scheduled End Time
    // =================================================

    const employeeEndTime =
    String(
        employee.endTime
        ||
        attendanceRecord.scheduledEndTime
        ||
        ""
    ).trim();

console.log(
    "CHECKOUT TEST:",
    {
        actualCheckOutTime:
            checkOutTime.toLocaleTimeString(
                "en-ZA"
            ),

        employeeEndTime:
            employeeEndTime,

        graceMinutes:
            LATE_CHECKOUT_GRACE_MINUTES
    }
);

    if (
        !employeeEndTime
    ) {

        message.style.color =
            "red";

        message.innerHTML =
            "❌ No scheduled end time is configured for this employee.";

        checkInButton.disabled =
            false;

        return;

    }


    // =================================================
    // Check For Early Exit
    // =================================================

    const isEarlyExit =
        isCheckOutEarly(
            checkOutTime,
            employeeEndTime
        );

    if (
        isEarlyExit
    ) {

        pendingEarlyCheckOut = {

            employee:
                employee,

            attendanceRecord:
                attendanceRecord,

            checkOutTime:
                checkOutTime,

            scheduledEndTime:
                employeeEndTime

        };

        scheduledEndTime.textContent =
            employeeEndTime;

        earlyExitScanTime.textContent =
            checkOutTime.toLocaleTimeString(
                "en-ZA"
            );

        earlyExitReason.value =
            "";

        earlyExitNote.value =
            "";

        earlyExitOtherSection.hidden =
            true;

        earlyExitMessage.textContent =
            "";

        earlyExitSection.hidden =
            false;

        employeeNumberInput.disabled =
            true;

        pinInput.disabled =
            true;

        checkInButton.disabled =
            true;

        message.style.color =
            "orange";

        message.innerHTML =
            "⚠️ You are checking out before your scheduled end time."
            +
            "<br>Please select a reason before check-out can be completed.";

        return;

    }

    // =================================================
// Check For Late Check-Out
// =================================================

const isLateCheckOut =
    isCheckOutLate(
        checkOutTime,
        employeeEndTime
    );

if (
    isLateCheckOut
) {

    pendingLateCheckOut = {

        employee:
            employee,

        attendanceRecord:
            attendanceRecord,

        checkOutTime:
            checkOutTime,

        scheduledEndTime:
            employeeEndTime

    };

    lateCheckOutScheduledEndTime.textContent =
        employeeEndTime;

    lateCheckOutScanTime.textContent =
        checkOutTime.toLocaleTimeString(
            "en-ZA"
        );

    lateCheckOutReason.value =
        "";

    lateCheckOutMessage.textContent =
        "";

    lateCheckOutSection.hidden =
        false;

    employeeNumberInput.disabled =
        true;

    pinInput.disabled =
        true;

    checkInButton.disabled =
        true;

    message.style.color =
        "orange";

    message.innerHTML =
        "⚠️ You are checking out more than "
        +
        LATE_CHECKOUT_GRACE_MINUTES
        +
        " minutes after your scheduled end time."
        +
        "<br>Please provide a reason before check-out can be completed.";

    lateCheckOutReason.focus();

    return;

}


    // =================================================
    // Normal Check-Out
    // =================================================

    await saveCheckOut(
        employee,
        attendanceRecord,
        checkOutTime,
        false,
        "",
        ""
    );

}

// =====================================================
// Early Check-Out Check
// =====================================================

function isCheckOutEarly(
    checkOutTime,
    scheduledEndTimeValue
) {

    const [
        endHour,
        endMinute
    ] =
        String(
            scheduledEndTimeValue
        )
            .split(":")
            .map(Number);

    const scheduledEnd =
        new Date(
            checkOutTime
        );

    scheduledEnd.setHours(
        endHour,
        endMinute,
        0,
        0
    );

    const graceMilliseconds =
        EARLY_EXIT_GRACE_MINUTES
        *
        60
        *
        1000;

    const earlyExitCutoff =
        new Date(
            scheduledEnd.getTime()
            -
            graceMilliseconds
        );

    return (
        checkOutTime <
        earlyExitCutoff
    );

}

// =====================================================
// Late Check-Out Check
// =====================================================

function isCheckOutLate(
    checkOutTime,
    scheduledEndTimeValue
) {

    const timeValue =
        String(
            scheduledEndTimeValue ??
            ""
        ).trim();


    const timeParts =
        timeValue
            .split(":")
            .map(Number);


    if (
        timeParts.length <
        2
        ||
        !Number.isFinite(
            timeParts[0]
        )
        ||
        !Number.isFinite(
            timeParts[1]
        )
    ) {

        console.error(
            "Invalid scheduled end time:",
            scheduledEndTimeValue
        );

        return false;

    }


    const endHour =
        timeParts[0];

    const endMinute =
        timeParts[1];


    const scheduledEnd =
        new Date(
            checkOutTime
        );


    scheduledEnd.setHours(
        endHour,
        endMinute,
        0,
        0
    );


    const lateCheckOutCutoff =
        new Date(
            scheduledEnd.getTime()
            +
            (
                LATE_CHECKOUT_GRACE_MINUTES
                *
                60
                *
                1000
            )
        );


    console.log(
        "LATE CHECKOUT CHECK:",
        {
            actual:
                checkOutTime,

            scheduledEnd:
                scheduledEnd,

            cutoff:
                lateCheckOutCutoff,

            isLate:
                checkOutTime >
                lateCheckOutCutoff
        }
    );


    return (
        checkOutTime >
        lateCheckOutCutoff
    );

}

// =====================================================
// Calculate Late Check-Out Minutes
// =====================================================

function calculateLateCheckoutMinutes(
    checkOutTime,
    scheduledEndTimeValue
) {

    const [
        endHour,
        endMinute
    ] =
        String(
            scheduledEndTimeValue
        )
            .split(":")
            .map(Number);

    const scheduledEnd =
        new Date(
            checkOutTime
        );

    scheduledEnd.setHours(
        endHour,
        endMinute,
        0,
        0
    );

    const differenceMilliseconds =
        checkOutTime.getTime()
        -
        scheduledEnd.getTime();

    if (
        differenceMilliseconds <=
        0
    ) {

        return 0;

    }

    return Math.floor(
        differenceMilliseconds /
        60000
    );

}

// =====================================================
// Early Exit Reason Change
// =====================================================

function handleEarlyExitReasonChange() {

    const selectedReason =
        earlyExitReason.value;

    const isOther =
        selectedReason ===
        "Other";

    earlyExitOtherSection.hidden =
        !isOther;

    if (
        !isOther
    ) {

        earlyExitNote.value =
            "";

    }

}

// =====================================================
// Authorised Early Departure
// =====================================================

function getAuthorisedDepartureStatus(
    reason
) {

    switch (
        reason
    ) {

        case "Sick":

            return "Sick Leave";


        case "Approved Half Day":

            return "Half Day";


        case "Annual Leave":

            return "Annual Leave";


        case "Family Responsibility":

            return "Family Responsibility Leave";


        case "Medical Appointment":

            return "Medical Appointment";


        case "Manager Approved":

            return "Manager Approved";


        default:

            return null;

    }

}


// =====================================================
// Submit Early Exit
// =====================================================

async function submitEarlyExit() {

    if (
        !pendingEarlyCheckOut
    ) {

        earlyExitMessage.style.color =
            "red";

        earlyExitMessage.textContent =
            "No pending early check-out was found.";

        return;

    }

    const selectedReason =
        earlyExitReason.value.trim();

    const note =
        earlyExitNote.value.trim();

    if (
        selectedReason ===
        ""
    ) {

        earlyExitMessage.style.color =
            "red";

        earlyExitMessage.textContent =
            "Please select a reason for leaving early.";

        earlyExitReason.focus();

        return;

    }

    if (
        selectedReason ===
        "Other"
        &&
        note.length <
        3
    ) {

        earlyExitMessage.style.color =
            "red";

        earlyExitMessage.textContent =
            "Please provide additional details.";

        earlyExitNote.focus();

        return;

    }

    try {

        submitEarlyExitButton.disabled =
            true;

        cancelEarlyExitButton.disabled =
            true;

        submitEarlyExitButton.textContent =
            "Submitting...";

        earlyExitMessage.style.color =
            "#0b5ed7";

        earlyExitMessage.textContent =
            "Saving your check-out...";

        const {
            employee,
            attendanceRecord,
            checkOutTime
        } =
            pendingEarlyCheckOut;

        const authorisedStatus =
    getAuthorisedDepartureStatus(
        selectedReason
    );

const isAuthorisedDeparture =
    Boolean(
        authorisedStatus
    );


if (
    isAuthorisedDeparture
) {

    const attendanceUpdate = {

        status:
            authorisedStatus,

        earlyExit:
            false,

        earlyExitReason:
            "",

        earlyExitNote:
            "",

        authorisedDeparture:
            true,

        authorisedDepartureReason:
            selectedReason,

        authorisedDepartureNote:
            note,

        updatedAt:
            serverTimestamp()

    };


    // Approved Half Day is explicitly
    // recorded as a half-day absence.

    if (
        selectedReason ===
        "Approved Half Day"
    ) {

        attendanceUpdate.leaveDuration =
            "half-day";

    }


    await updateDoc(
        attendanceRecord.reference,
        attendanceUpdate
    );


    await saveCheckOut(
        employee,
        attendanceRecord,
        checkOutTime,
        false,
        "",
        ""
    );

    message.style.color =
    "green";

message.innerHTML =
    "✅ Approved departure recorded."
    +
    "<br>"
    +
    "Status: "
    +
    escapeHtml(
        authorisedStatus
    )
    +
    "<br>"
    +
    "Check-Out Time: "
    +
    escapeHtml(
        checkOutTime.toLocaleTimeString(
            "en-ZA"
        )
    );

} else {

    await saveCheckOut(
        employee,
        attendanceRecord,
        checkOutTime,
        true,
        selectedReason,
        note
    );

}

        pendingEarlyCheckOut =
            null;

    } catch (
        error
    ) {

        console.error(
            "Early check-out error:",
            error
        );

        earlyExitMessage.style.color =
            "red";

        earlyExitMessage.textContent =
            "Check-out could not be completed. Please try again.";

    } finally {

        submitEarlyExitButton.disabled =
            false;

        cancelEarlyExitButton.disabled =
            false;

        submitEarlyExitButton.textContent =
            "Submit Check-Out";

    }

}


// =====================================================
// Cancel Early Exit
// =====================================================

function cancelEarlyExit() {

    pendingEarlyCheckOut =
        null;

    earlyExitReason.value =
        "";

    earlyExitNote.value =
        "";

    earlyExitMessage.textContent =
        "";

    earlyExitOtherSection.hidden =
        true;

    earlyExitSection.hidden =
        true;

    employeeNumberInput.disabled =
        false;

    pinInput.disabled =
        false;

    checkInButton.disabled =
        false;

    originalScanTime =
        new Date();

    message.style.color =
        "#0b5ed7";

    message.innerHTML =
        "Check-out cancelled.";

}

// =====================================================
// Submit Late Check-Out
// =====================================================

async function submitLateCheckOut() {

    if (
        !pendingLateCheckOut
    ) {

        lateCheckOutMessage.style.color =
            "red";

        lateCheckOutMessage.textContent =
            "No pending late check-out was found.";

        return;

    }

    const reason =
        lateCheckOutReason.value
            .trim();

    if (
        reason ===
        ""
    ) {

        lateCheckOutMessage.style.color =
            "red";

        lateCheckOutMessage.textContent =
            "Please provide a reason for checking out late.";

        lateCheckOutReason.focus();

        return;

    }

    if (
        reason.length <
        3
    ) {

        lateCheckOutMessage.style.color =
            "red";

        lateCheckOutMessage.textContent =
            "Please provide a valid reason.";

        lateCheckOutReason.focus();

        return;

    }

    try {

        submitLateCheckOutButton.disabled =
            true;

        cancelLateCheckOutButton.disabled =
            true;

        submitLateCheckOutButton.textContent =
            "Submitting...";

        lateCheckOutMessage.style.color =
            "#0b5ed7";

        lateCheckOutMessage.textContent =
            "Saving your check-out...";

        const {
            employee,
            attendanceRecord,
            checkOutTime,
            scheduledEndTime
        } =
            pendingLateCheckOut;


        const lateCheckoutMinutes =
            calculateLateCheckoutMinutes(
                checkOutTime,
                scheduledEndTime
            );


        await saveCheckOut(
            employee,
            attendanceRecord,
            checkOutTime,
            false,
            "",
            "",
            true,
            reason,
            lateCheckoutMinutes
        );


        pendingLateCheckOut =
            null;

    } catch (
        error
    ) {

        console.error(
            "Late check-out error:",
            error
        );

        lateCheckOutMessage.style.color =
            "red";

        lateCheckOutMessage.textContent =
            "Check-out could not be completed. Please try again.";

    } finally {

        submitLateCheckOutButton.disabled =
            false;

        cancelLateCheckOutButton.disabled =
            false;

        submitLateCheckOutButton.textContent =
            "Submit Check-Out";

    }

}


// =====================================================
// Cancel Late Check-Out
// =====================================================

function cancelLateCheckOut() {

    pendingLateCheckOut =
        null;

    lateCheckOutReason.value =
        "";

    lateCheckOutMessage.textContent =
        "";

    lateCheckOutSection.hidden =
        true;

    employeeNumberInput.disabled =
        false;

    pinInput.disabled =
        false;

    checkInButton.disabled =
        false;

    originalScanTime =
        new Date();

    message.style.color =
        "#0b5ed7";

    message.innerHTML =
        "Late check-out cancelled.";

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
            selectedWorkLocation,
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
    reason,
    selectedWorkLocation
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
// Save Check-Out
// =====================================================

async function saveCheckOut(
    employee,
    attendanceRecord,
    checkOutTime,
    earlyExit,
    earlyExitReasonValue,
    earlyExitNoteValue,
    lateCheckout = false,
    lateCheckoutReasonValue = "",
    lateCheckoutMinutes = 0
) {

    const attendanceReference =
        attendanceRecord.reference;

    if (
        !attendanceReference
    ) {

        throw new Error(
            "ATTENDANCE_REFERENCE_MISSING"
        );

    }

    const checkOutTimeText =
        checkOutTime.toLocaleTimeString(
            "en-ZA"
        );

    await updateDoc(
        attendanceReference,
        {

            checkOutTime:
                checkOutTimeText,

            checkOutTimestamp:
                checkOutTime,

            earlyExit:
                earlyExit,

            earlyExitReason:
                earlyExit
                    ?
                    earlyExitReasonValue
                    :
                    "",

            earlyExitNote:
                earlyExit
                    ?
                    earlyExitNoteValue
                    :
                    "",

                    lateCheckout:
    lateCheckout,

lateCheckoutReason:
    lateCheckout
        ?
        lateCheckoutReasonValue
        :
        "",

lateCheckoutMinutes:
    lateCheckout
        ?
        lateCheckoutMinutes
        :
        0,

            checkOutMethod:
                "QR Code",

            updatedAt:
                serverTimestamp()

        }
    );

    earlyExitSection.hidden =
        true;

        lateCheckOutSection.hidden =
    true;

    message.style.color =
        "green";

    let resultMessage =
        "✅ Goodbye, "
        +
        escapeHtml(
            employee.name
        )
        +
        "!<br><br>"
        +
        "Check-out recorded successfully."
        +
        "<br>Check-Out Time: "
        +
        escapeHtml(
            checkOutTimeText
        );

    if (
        earlyExit
    ) {

        resultMessage +=
            "<br>Early Exit: Yes"
            +
            "<br>Reason: "
            +
            escapeHtml(
                earlyExitReasonValue
            );

        if (
            earlyExitNoteValue
        ) {

            resultMessage +=
                "<br>Details: "
                +
                escapeHtml(
                    earlyExitNoteValue
                );

        }

    }

    if (
    lateCheckout
) {

    resultMessage +=
        "<br>Late Check-Out: Yes"
        +
        "<br>Extra Time: "
        +
        lateCheckoutMinutes
        +
        " minutes"
        +
        "<br>Reason: "
        +
        escapeHtml(
            lateCheckoutReasonValue
        );

}

    message.innerHTML =
        resultMessage;

    resetCheckInForm();

    updateRegisteredDeviceDisplay();

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
    lateReason = "",
    selectedWorkLocation = "Office"
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

                    scheduledStartTime:
    employee.startTime ??
    "",

scheduledEndTime:
    employee.endTime ??
    "",

                    checkInMethod:
                        "QR Code",

                    workLocation:
    selectedWorkLocation,

latitude:
    location?.latitude ??
    null,

longitude:
    location?.longitude ??
    null,

locationAccuracyMetres:
    location
        ?
        Math.round(
            location.accuracy
        )
        :
        null,

distanceFromOfficeMetres:
    selectedWorkLocation ===
    "Office"
        ?
        Math.round(
            distanceMetres
        )
        :
        null,

locationStatus:
    locationStatus,

                    mapsLink:
    location
        ?
        "https://www.google.com/maps?q="
        +
        location.latitude
        +
        ","
        +
        location.longitude
        :
        "",

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
    );

if (
    location
) {

    resultMessage +=
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

}

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

        hybridWorkLocation.value =
    "";

hybridWorkLocationContainer.style.display =
    "none";

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

    earlyExitReason.value =
    "";

earlyExitNote.value =
    "";

earlyExitMessage.textContent =
    "";

earlyExitOtherSection.hidden =
    true;

earlyExitSection.hidden =
    true;

pendingEarlyCheckOut =
    null;

    // =====================================================
// Reset Late Check-Out
// =====================================================

lateCheckOutReason.value =
    "";

lateCheckOutMessage.textContent =
    "";

lateCheckOutSection.hidden =
    true;

pendingLateCheckOut =
    null;

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
