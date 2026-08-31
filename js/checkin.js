// =====================================================
// R-E-D Attendance
// Employee QR Check-In
// =====================================================

import {
    firebaseConfig
} from "../firebase/firebase.js";

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
    getFirestore,
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

// =====================================================
// Separate Employee Attendance Firebase Auth
// =====================================================

const attendanceAuthApp =
    initializeApp(
        firebaseConfig,
        "attendance-auth"
    );

const attendanceAuth =
    getAuth(
        attendanceAuthApp
    );

    const db =
    getFirestore(
        attendanceAuthApp
    );

    // =====================================================
// Attendance Audit Logger
// =====================================================

async function writeAuditLog(
    auditData
) {

    try {

        const currentUser =
            attendanceAuth.currentUser;


        await addDoc(
            collection(
                db,
                "auditLog"
            ),
            {

                category:
                    auditData.category ??
                    "Attendance",

                action:
                    auditData.action ??
                    "Attendance Activity",

                description:
                    auditData.description ??
                    "",

                actorType:
                    auditData.actorType ??
                    "Employee",

                actorName:
                    auditData.actorName ??
                    "",

                actorId:
                    auditData.actorId ??
                    "",

                targetType:
                    auditData.targetType ??
                    "",

                targetName:
                    auditData.targetName ??
                    "",

                targetId:
                    auditData.targetId ??
                    "",

                source:
                    auditData.source ??
                    "Employee Attendance",

                metadata:
                    auditData.metadata ??
                    {},

                firebaseUid:
                    currentUser?.uid ??
                    "",

                timestamp:
                    serverTimestamp()

            }
        );


        console.log(
            "ATTENDANCE AUDIT LOG SAVED:",
            auditData.action
        );

    } catch (
        error
    ) {

        console.error(
            "Unable to write attendance audit log:",
            error
        );

    }

}

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
// Leave Statuses
// =====================================================

const LEAVE_STATUSES = [

    "Annual Leave",

    "Sick Leave",

    "Family Responsibility Leave",

    "Maternity Leave",

    "Unpaid Leave"

];

// =====================================================
// Check Whether Status Is Leave
// =====================================================

function isLeaveStatus(
    status
) {

    return LEAVE_STATUSES.includes(
        String(
            status ??
            ""
        ).trim()
    );

}

// =====================================================
// Get Leave Sessions
// =====================================================

function getLeaveSessions(
    attendanceRecord
) {

    if (
        !attendanceRecord
        ||
        !Array.isArray(
            attendanceRecord.leaveSessions
        )
    ) {

        return [];

    }


    return attendanceRecord.leaveSessions;

}


// =====================================================
// Get Open Leave Session
// =====================================================

function getOpenLeaveSession(
    attendanceRecord
) {

    const sessions =
        getLeaveSessions(
            attendanceRecord
        );


    for (
        let index =
            sessions.length - 1;

        index >= 0;

        index--
    ) {

        const session =
            sessions[index];


        const hasStart =
            Boolean(
                String(
                    session?.startTime ??
                    ""
                ).trim()
                ||
                session?.startTimestamp
            );


        const hasEnd =
            Boolean(
                String(
                    session?.endTime ??
                    ""
                ).trim()
                ||
                session?.endTimestamp
            );


        if (
            hasStart
            &&
            !hasEnd
        ) {

            return {

                index:
                    index,

                session:
                    session

            };

        }

    }


    return null;

}

// =====================================================
// Get Leave Session Start Date
// =====================================================

function getLeaveSessionStartDate(
    employee,
    attendanceRecord,
    scanTime
) {

    const scheduledStartTime =
        String(
            attendanceRecord?.scheduledStartTime ??
            employee?.startTime ??
            "08:00"
        ).trim();


    const timeParts =
        scheduledStartTime
            .split(":")
            .map(
                Number
            );


    const leaveStartDate =
        new Date(
            scanTime
        );


    if (
        timeParts.length >=
        2
        &&
        Number.isFinite(
            timeParts[0]
        )
        &&
        Number.isFinite(
            timeParts[1]
        )
    ) {

        leaveStartDate.setHours(
            timeParts[0],
            timeParts[1],
            0,
            0
        );

    } else {

        leaveStartDate.setHours(
            8,
            0,
            0,
            0
        );

    }


    return leaveStartDate;

}

// =====================================================
// Close Active Leave For Employee Check-In
// =====================================================

// =====================================================
// Prepare Active Leave For Employee Check-In
// =====================================================

async function closeActiveLeaveForCheckIn(
    employee,
    attendanceRecord,
    scanTime
) {

    if (
        !attendanceRecord
        ||
        !isLeaveStatus(
            attendanceRecord.status
        )
    ) {

        return null;

    }


    const leaveType =
        String(
            attendanceRecord.status ??
            ""
        ).trim();


    const sessions =
        Array.isArray(
            attendanceRecord.leaveSessions
        )
            ?
            attendanceRecord.leaveSessions.map(
                session => ({
                    ...session
                })
            )
            :
            [];


    let openLeaveSession =
        getOpenLeaveSession({
            leaveSessions:
                sessions
        });


    // =================================================
    // Legacy Leave Record
    // =================================================
    //
    // Attendance Management may have created the leave
    // using the older status / leaveDuration fields
    // without a leaveSessions entry.
    //
    // Create ONE temporary session in memory.
    //
    // IMPORTANT:
    // Nothing is written to Firestore here.
    //
    // =================================================

    if (
        !openLeaveSession
    ) {

        const leaveStartDate =
            getLeaveSessionStartDate(
                employee,
                attendanceRecord,
                scanTime
            );


        sessions.push({

            sessionNumber:
                sessions.length + 1,

            leaveType:
                leaveType,

            startTime:
                leaveStartDate
                    .toLocaleTimeString(
                        "en-ZA"
                    ),

            startTimestamp:
                leaveStartDate,

            endTime:
                "",

            endTimestamp:
                null,

            durationMinutes:
                0,

            source:
                "Attendance Management"

        });


        openLeaveSession =
            getOpenLeaveSession({
                leaveSessions:
                    sessions
            });

    }


    if (
        !openLeaveSession
    ) {

        return null;

    }


    const sessionIndex =
        openLeaveSession.index;


    const currentSession =
        sessions[
            sessionIndex
        ];


    let leaveStartDate =
        null;


    if (
        currentSession.startTimestamp
    ) {

        if (
            currentSession.startTimestamp instanceof
            Date
        ) {

            leaveStartDate =
                new Date(
                    currentSession.startTimestamp
                );

        } else if (
            typeof currentSession.startTimestamp.toDate ===
            "function"
        ) {

            leaveStartDate =
                currentSession.startTimestamp.toDate();

        }

    }


    if (
        !leaveStartDate
    ) {

        leaveStartDate =
            getLeaveSessionStartDate(
                employee,
                attendanceRecord,
                scanTime
            );

    }


    const leaveEndDate =
        new Date(
            scanTime
        );


    const durationMilliseconds =
        Math.max(
            0,
            leaveEndDate.getTime()
            -
            leaveStartDate.getTime()
        );


    const durationMinutes =
        Math.floor(
            durationMilliseconds /
            60000
        );


    sessions[
        sessionIndex
    ] = {

        ...currentSession,

        endTime:
            leaveEndDate
                .toLocaleTimeString(
                    "en-ZA"
                ),

        endTimestamp:
            leaveEndDate,

        durationMinutes:
            durationMinutes,

        closedBy:
            "Employee QR Check-In"

    };


    const totalLeaveMinutes =
        sessions.reduce(
            (
                total,
                session
            ) => {

                const minutes =
                    Number(
                        session.durationMinutes ??
                        0
                    );


                return (
                    total
                    +
                    (
                        Number.isFinite(
                            minutes
                        )
                            ?
                            Math.max(
                                0,
                                minutes
                            )
                            :
                            0
                    )
                );

            },
            0
        );


    // =================================================
    // IMPORTANT
    // =================================================
    //
    // Do NOT update Firestore here.
    //
    // The leave will only be committed once the actual
    // attendance check-in transaction succeeds.
    //
    // This prevents failed check-in attempts from
    // creating duplicate leave sessions.
    //
    // =================================================

    return {

        leaveType:
            leaveType,

        durationMinutes:
            durationMinutes,

        totalLeaveMinutes:
            totalLeaveMinutes,

        leaveSessions:
            sessions,

        leaveStartTime:
            sessions[
                sessionIndex
            ].startTime,

        leaveEndTime:
            sessions[
                sessionIndex
            ].endTime

    };

}

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
// Get Device Owner
// =====================================================

async function getRegisteredDeviceOwner() {

    const deviceId =
        String(
            getDeviceId() ??
            ""
        ).trim();


    if (
        !deviceId
    ) {

        return null;

    }


    const safeDeviceId =
        encodeURIComponent(
            deviceId
        );


    const deviceReference =
        doc(
            db,
            "registeredDevices",
            safeDeviceId
        );


    const deviceSnapshot =
        await getDoc(
            deviceReference
        );


    if (
        !deviceSnapshot.exists()
    ) {

        return null;

    }


    return {

        reference:
            deviceReference,

        ...deviceSnapshot.data()

    };

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

/// =====================================================
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


    const deviceId =
        String(
            getDeviceId() ??
            ""
        ).trim();


    if (
        !deviceId
    ) {

        throw new Error(
            "DEVICE_ID_MISSING"
        );

    }


    const safeDeviceId =
        encodeURIComponent(
            deviceId
        );


    const registrationToken =
        generateDeviceRegistrationToken();


    const registrationReference =
        doc(
            db,
            "employeeDeviceRegistrations",
            employeeNumber
        );


    const deviceReference =
        doc(
            db,
            "registeredDevices",
            safeDeviceId
        );


    // =================================================
    // Make Sure Device Is Not Already Owned
    // =================================================

    const existingDeviceOwner =
        await getDoc(
            deviceReference
        );


    if (
        existingDeviceOwner.exists()
        &&
        existingDeviceOwner.data().active === true
        &&
        String(
            existingDeviceOwner.data().employeeNumber ??
            ""
        ).trim() !==
        employeeNumber
    ) {

        throw new Error(
            "DEVICE_ALREADY_REGISTERED_TO_OTHER_EMPLOYEE"
        );

    }


    // =================================================
    // Save Employee Registration
    // =================================================

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
                deviceId,

            fingerprint:
                getFingerprint(),

            registeredAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        }
    );


    // =================================================
    // Save Device Ownership
    // =================================================

    await setDoc(
        deviceReference,
        {

            employeeNumber:
                employeeNumber,

            deviceId:
                deviceId,

            fingerprint:
                getFingerprint(),

            active:
                true,

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
// After-Hours Attendance Helpers
// =====================================================

function getAfterHoursSessions(
    attendanceRecord
) {

    if (
        !attendanceRecord
        ||
        !Array.isArray(
            attendanceRecord.afterHoursSessions
        )
    ) {

        return [];
    }


    return attendanceRecord.afterHoursSessions;

}


// =====================================================
// Get Open After-Hours Session
// =====================================================

function getOpenAfterHoursSession(
    attendanceRecord
) {

    const sessions =
        getAfterHoursSessions(
            attendanceRecord
        );


    for (
        let index =
            sessions.length - 1;

        index >= 0;

        index--
    ) {

        const session =
            sessions[index];


        const hasCheckIn =
            Boolean(
                String(
                    session?.checkInTime ??
                    ""
                ).trim()
                ||
                session?.checkInTimestamp
            );


        const hasCheckOut =
            Boolean(
                String(
                    session?.checkOutTime ??
                    ""
                ).trim()
                ||
                session?.checkOutTimestamp
            );


        if (
            hasCheckIn
            &&
            !hasCheckOut
        ) {

            return {
                index:
                    index,

                session:
                    session
            };

        }

    }


    return null;

}


// =====================================================
// Calculate After-Hours Session Minutes
// =====================================================

function calculateAfterHoursSessionMinutes(
    checkInTime,
    checkOutTime
) {

    if (
        !(checkInTime instanceof Date)
        ||
        !(checkOutTime instanceof Date)
    ) {

        return 0;
    }


    const differenceMilliseconds =
        checkOutTime.getTime()
        -
        checkInTime.getTime();


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
// Calculate Total After-Hours Minutes
// =====================================================

function calculateTotalAfterHoursMinutes(
    sessions
) {

    if (
        !Array.isArray(
            sessions
        )
    ) {

        return 0;
    }


    return sessions.reduce(
        function (
            total,
            session
        ) {

            const workedMinutes =
                Number(
                    session?.workedMinutes ??
                    0
                );


            if (
                !Number.isFinite(
                    workedMinutes
                )
                ||
                workedMinutes <
                0
            ) {

                return total;

            }


            return (
                total +
                workedMinutes
            );

        },
        0
    );

}

// =====================================================
// Format Minutes As Hours And Minutes
// =====================================================

function formatMinutesAsHoursAndMinutes(
    totalMinutes
) {

    const safeMinutes =
        Number(
            totalMinutes ??
            0
        );


    if (
        !Number.isFinite(
            safeMinutes
        )
        ||
        safeMinutes <=
        0
    ) {

        return "0h 00m";

    }


    const wholeMinutes =
        Math.floor(
            safeMinutes
        );


    const hours =
        Math.floor(
            wholeMinutes /
            60
        );


    const minutes =
        wholeMinutes %
        60;


    return (
        hours
        +
        "h "
        +
        String(
            minutes
        ).padStart(
            2,
            "0"
        )
        +
        "m"
    );

}

// =====================================================
// Start Normal Work Session
// =====================================================

async function startNormalWorkSession(
    employee,
    attendanceRecord,
    workLocation = "Office"
) {

    if (
        !employee
        ||
        !attendanceRecord?.reference
    ) {

        throw new Error(
            "NORMAL_WORK_ATTENDANCE_MISSING"
        );

    }


    const checkInTime =
        new Date(
            originalScanTime.getTime()
        );


    const checkInTimeText =
        checkInTime.toLocaleTimeString(
            "en-ZA"
        );


    const attendanceReference =
        attendanceRecord.reference;


    await runTransaction(
        db,
        async function (
            transaction
        ) {

            const attendanceSnapshot =
                await transaction.get(
                    attendanceReference
                );


            if (
                !attendanceSnapshot.exists()
            ) {

                throw new Error(
                    "ATTENDANCE_RECORD_NOT_FOUND"
                );

            }


            const currentAttendance =
                attendanceSnapshot.data();


            const sessions =
                Array.isArray(
                    currentAttendance.workSessions
                )
                    ?
                    currentAttendance.workSessions.map(
                        function (
                            session
                        ) {

                            return {
                                ...session
                            };

                        }
                    )
                    :
                    [];


            const openSession =
                sessions.find(
                    function (
                        session
                    ) {

                        return (
                            !String(
                                session.checkOutTime ??
                                ""
                            ).trim()
                            &&
                            !session.checkOutTimestamp
                        );

                    }
                );


            if (
                openSession
            ) {

                throw new Error(
                    "NORMAL_WORK_SESSION_ALREADY_OPEN"
                );

            }


            sessions.push({

                sessionNumber:
                    sessions.length + 1,

                checkInTime:
                    checkInTimeText,

                checkInTimestamp:
                    checkInTime,

                checkOutTime:
                    "",

                checkOutTimestamp:
                    null,

                workedMinutes:
                    0,

                workLocation:
                    workLocation,

                source:
                    "QR Code"

            });


            transaction.set(
                attendanceReference,
                {

                    workSessions:
                        sessions,

                    // Employee is actively working again,
                    // so clear the previous top-level checkout.
                    checkOutTime:
                        "",

                    checkOutTimestamp:
                        null,

                    checkOutMethod:
                        "",

                    earlyExit:
                        false,

                    earlyExitReason:
                        "",

                    earlyExitNote:
                        "",

                        authorisedDeparture:
    false,

authorisedDepartureReason:
    "",

authorisedDepartureNote:
    "",

                    lateCheckout:
                        false,

                    lateCheckoutReason:
                        "",

                    lateCheckoutMinutes:
                        0,

                    updatedAt:
                        serverTimestamp()

                },
                {
                    merge:
                        true
                }
            );

        }
    );


    message.style.color =
        "green";


    message.innerHTML =
        "✅ Welcome back, "
        +
        escapeHtml(
            employee.name
        )
        +
        "!<br><br>"
        +
        "Normal work session started."
        +
        "<br>Check-In Time: "
        +
        escapeHtml(
            checkInTimeText
        );


    resetCheckInForm();

    updateRegisteredDeviceDisplay();

}

// =====================================================
// Start After-Hours Session
// =====================================================

async function startAfterHoursSession(
    employee,
    attendanceRecord,
    workLocation = "Remote"
) {

    if (
        !employee
        ||
        !attendanceRecord?.reference
    ) {

        throw new Error(
            "AFTER_HOURS_ATTENDANCE_MISSING"
        );

    }

    // =========================================
// Verify Employee After-Hours Permission
// =========================================

if (
    employee.afterHoursEnabled !== true
) {

    throw new Error(
        "AFTER_HOURS_NOT_ENABLED"
    );

}


    const afterHoursCheckInTime =
        new Date(
            originalScanTime.getTime()
        );


    const attendanceReference =
        attendanceRecord.reference;


    let savedSessionNumber =
        0;


    await runTransaction(
        db,
        async function (
            transaction
        ) {

            // =========================================
            // Load Current Attendance
            // =========================================

            const attendanceSnapshot =
                await transaction.get(
                    attendanceReference
                );


            if (
                !attendanceSnapshot.exists()
            ) {

                throw new Error(
                    "ATTENDANCE_RECORD_NOT_FOUND"
                );

            }


            const currentAttendance =
                attendanceSnapshot.data();


            // =========================================
            // Normal Shift Must Be Complete
            // =========================================

            const hasNormalCheckIn =
                Boolean(
                    String(
                        currentAttendance.time ??
                        ""
                    ).trim()
                    ||
                    currentAttendance.scanTimestamp
                    ||
                    currentAttendance.checkInTimestamp
                );


            const hasNormalCheckOut =
                Boolean(
                    String(
                        currentAttendance.checkOutTime ??
                        ""
                    ).trim()
                    ||
                    currentAttendance.checkOutTimestamp
                );


            if (
                !hasNormalCheckIn
                ||
                !hasNormalCheckOut
            ) {

                throw new Error(
                    "NORMAL_SHIFT_NOT_COMPLETE"
                );

            }


            // =========================================
            // Load Existing After-Hours Sessions
            // =========================================

            const sessions =
                Array.isArray(
                    currentAttendance.afterHoursSessions
                )
                    ?
                    [
                        ...currentAttendance.afterHoursSessions
                    ]
                    :
                    [];


            // =========================================
            // Prevent Two Open Sessions
            // =========================================

            const openSession =
                getOpenAfterHoursSession({
                    afterHoursSessions:
                        sessions
                });


            if (
                openSession
            ) {

                throw new Error(
                    "AFTER_HOURS_SESSION_ALREADY_OPEN"
                );

            }


            // =========================================
            // Create New Session
            // =========================================

            const newSession = {

                sessionNumber:
                    sessions.length + 1,

                checkInTime:
                    afterHoursCheckInTime
                        .toLocaleTimeString(
                            "en-ZA"
                        ),

                checkInTimestamp:
                    afterHoursCheckInTime,

                checkOutTime:
                    "",

                checkOutTimestamp:
                    null,

                workedMinutes:
                    0,

                workLocation:
                    workLocation,

                checkInMethod:
                    "QR Code",

                checkOutMethod:
                    "",

                deviceId:
                    getDeviceId(),

                fingerprint:
                    getFingerprint()

            };


            sessions.push(
                newSession
            );


            savedSessionNumber =
                newSession.sessionNumber;


            // =========================================
            // Update SAME Attendance Record
            // =========================================

            transaction.update(
                attendanceReference,
                {

                    afterHoursSessions:
                        sessions,

                    afterHoursActive:
                        true,

                    afterHoursWorkedMinutes:
                        calculateTotalAfterHoursMinutes(
                            sessions
                        ),

                    updatedAt:
                        serverTimestamp()

                }
            );

        }
    );


    // =============================================
    // Audit Log
    // =============================================

    await writeAuditLog({

        category:
            "Attendance",

        action:
            "After-Hours Check-In",

        description:
            `${employee.name ?? employee.employeeNumber} started after-hours work at ${afterHoursCheckInTime.toLocaleTimeString("en-ZA")}.`,

        actorType:
            "Employee",

        actorName:
            employee.name ??
            employee.employeeNumber ??
            "Unknown Employee",

        actorId:
            employee.employeeNumber ??
            "",

        targetType:
            "Employee",

        targetName:
            employee.name ??
            employee.employeeNumber ??
            "Unknown Employee",

        targetId:
            employee.employeeNumber ??
            "",

        source:
            "Employee Attendance",

        metadata: {

            employeeNumber:
                employee.employeeNumber ??
                "",

            sessionNumber:
                savedSessionNumber,

            checkInTime:
                afterHoursCheckInTime
                    .toLocaleTimeString(
                        "en-ZA"
                    ),

            workLocation:
                workLocation,

            deviceId:
                getDeviceId()

        }

    });


    // =============================================
    // Employee Message
    // =============================================

    message.style.color =
        "green";


    message.innerHTML =
        "✅ After-hours work started."
        +
        "<br><br>"
        +
        "Employee: "
        +
        escapeHtml(
            employee.name ??
            employee.employeeNumber
        )
        +
        "<br>After-Hours Check In: "
        +
        escapeHtml(
            afterHoursCheckInTime
                .toLocaleTimeString(
                    "en-ZA"
                )
        );


    resetCheckInForm();

    updateRegisteredDeviceDisplay();

}

// =====================================================
// End After-Hours Session
// =====================================================

async function endAfterHoursSession(
    employee,
    attendanceRecord
) {

    if (
        !employee
        ||
        !attendanceRecord?.reference
    ) {

        throw new Error(
            "AFTER_HOURS_ATTENDANCE_MISSING"
        );

    }


    // =========================================
    // Verify Employee After-Hours Permission
    // =========================================

    if (
        employee.afterHoursEnabled !==
        true
    ) {

        throw new Error(
            "AFTER_HOURS_NOT_ENABLED"
        );

    }


    const afterHoursCheckOutTime =
        new Date(
            originalScanTime.getTime()
        );


    const attendanceReference =
        attendanceRecord.reference;


    let savedSessionNumber =
        0;


    let savedSessionMinutes =
        0;


    let savedTotalAfterHoursMinutes =
        0;


    let savedCheckInTime =
        "";


    // =============================================
    // Update Attendance Safely
    // =============================================

    await runTransaction(
        db,
        async function (
            transaction
        ) {

            // =========================================
            // Reload Current Attendance
            // =========================================

            const attendanceSnapshot =
                await transaction.get(
                    attendanceReference
                );


            if (
                !attendanceSnapshot.exists()
            ) {

                throw new Error(
                    "ATTENDANCE_RECORD_NOT_FOUND"
                );

            }


            const currentAttendance =
                attendanceSnapshot.data();


            // =========================================
            // Load Current After-Hours Sessions
            // =========================================

            const sessions =
                Array.isArray(
                    currentAttendance.afterHoursSessions
                )
                    ?
                    currentAttendance.afterHoursSessions.map(
                        function (
                            session
                        ) {

                            return {
                                ...session
                            };

                        }
                    )
                    :
                    [];


            // =========================================
            // Find Open After-Hours Session
            // =========================================

            const openSession =
                getOpenAfterHoursSession({
                    afterHoursSessions:
                        sessions
                });


            if (
                !openSession
            ) {

                throw new Error(
                    "NO_OPEN_AFTER_HOURS_SESSION"
                );

            }


            const sessionIndex =
                openSession.index;


            const session =
                sessions[
                    sessionIndex
                ];


            // =========================================
            // Determine After-Hours Check-In Date
            // =========================================

            let afterHoursCheckInDate =
                null;


            if (
                session.checkInTimestamp
            ) {

                if (
                    session.checkInTimestamp instanceof
                    Date
                ) {

                    afterHoursCheckInDate =
                        new Date(
                            session.checkInTimestamp
                        );

                } else if (
                    typeof session.checkInTimestamp.toDate ===
                    "function"
                ) {

                    afterHoursCheckInDate =
                        session.checkInTimestamp.toDate();

                }

            }


            // =========================================
            // Fallback Using Stored Check-In Time
            // =========================================

            if (
                !afterHoursCheckInDate
                &&
                session.checkInTime
            ) {

                const timeParts =
                    String(
                        session.checkInTime
                    )
                        .split(":")
                        .map(Number);


                if (
                    timeParts.length >=
                    2
                    &&
                    Number.isFinite(
                        timeParts[0]
                    )
                    &&
                    Number.isFinite(
                        timeParts[1]
                    )
                ) {

                    afterHoursCheckInDate =
                        new Date(
                            afterHoursCheckOutTime
                        );


                    afterHoursCheckInDate.setHours(
                        timeParts[0],
                        timeParts[1],
                        Number.isFinite(
                            timeParts[2]
                        )
                            ?
                            timeParts[2]
                            :
                            0,
                        0
                    );

                }

            }


            if (
                !afterHoursCheckInDate
            ) {

                throw new Error(
                    "AFTER_HOURS_CHECKIN_TIME_INVALID"
                );

            }


            // =========================================
            // Calculate Worked Minutes
            // =========================================

            const workedMinutes =
                calculateAfterHoursSessionMinutes(
                    afterHoursCheckInDate,
                    afterHoursCheckOutTime
                );


            savedSessionNumber =
                Number(
                    session.sessionNumber ??
                    sessionIndex + 1
                );


            savedSessionMinutes =
                workedMinutes;


            savedCheckInTime =
                String(
                    session.checkInTime ??
                    ""
                ).trim();


            // =========================================
            // Close Session
            // =========================================

            sessions[
                sessionIndex
            ] = {

                ...session,

                checkOutTime:
                    afterHoursCheckOutTime
                        .toLocaleTimeString(
                            "en-ZA"
                        ),

                checkOutTimestamp:
                    afterHoursCheckOutTime,

                workedMinutes:
                    workedMinutes,

                checkOutMethod:
                    "QR Code"

            };


            savedTotalAfterHoursMinutes =
                calculateTotalAfterHoursMinutes(
                    sessions
                );


            // =========================================
            // Update SAME Attendance Document
            // =========================================

            transaction.update(
                attendanceReference,
                {

                    afterHoursSessions:
                        sessions,

                    afterHoursActive:
                        false,

                    afterHoursWorkedMinutes:
                        savedTotalAfterHoursMinutes,

                    updatedAt:
                        serverTimestamp()

                }
            );

        }
    );


    // =============================================
    // Audit Log
    // =============================================

    await writeAuditLog({

        category:
            "Attendance",

        action:
            "After-Hours Check-Out",

        description:
            `${employee.name ?? employee.employeeNumber} completed after-hours work at ${afterHoursCheckOutTime.toLocaleTimeString("en-ZA")}.`,

        actorType:
            "Employee",

        actorName:
            employee.name ??
            employee.employeeNumber ??
            "Unknown Employee",

        actorId:
            employee.employeeNumber ??
            "",

        targetType:
            "Employee",

        targetName:
            employee.name ??
            employee.employeeNumber ??
            "Unknown Employee",

        targetId:
            employee.employeeNumber ??
            "",

        source:
            "Employee Attendance",

        metadata: {

            employeeNumber:
                employee.employeeNumber ??
                "",

            sessionNumber:
                savedSessionNumber,

            checkInTime:
                savedCheckInTime,

            checkOutTime:
                afterHoursCheckOutTime
                    .toLocaleTimeString(
                        "en-ZA"
                    ),

            workedMinutes:
                savedSessionMinutes,

            totalAfterHoursMinutes:
                savedTotalAfterHoursMinutes,

            deviceId:
                getDeviceId()

        }

    });


    // =============================================
    // Employee Confirmation
    // =============================================

    message.style.color =
        "green";


    message.innerHTML =
        "✅ After-hours work completed."
        +
        "<br><br>"
        +
        "Employee: "
        +
        escapeHtml(
            employee.name ??
            employee.employeeNumber
        )
        +
        "<br>After-Hours Check In: "
        +
        escapeHtml(
            savedCheckInTime ||
            "-"
        )
        +
        "<br>After-Hours Check Out: "
        +
        escapeHtml(
            afterHoursCheckOutTime
                .toLocaleTimeString(
                    "en-ZA"
                )
        )
        +
        "<br>After-Hours Worked: "
        +
        escapeHtml(
            formatMinutesAsHoursAndMinutes(
                savedSessionMinutes
            )
        )
        +
        "<br>Total After-Hours Today: "
        +
        escapeHtml(
            formatMinutesAsHoursAndMinutes(
                savedTotalAfterHoursMinutes
            )
        );


    resetCheckInForm();

    updateRegisteredDeviceDisplay();

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
// Validate Device Ownership Record
// =============================================

let deviceOwner =
    await getRegisteredDeviceOwner();

    // =============================================
// Migrate Legacy Registered Device
// =============================================

if (
    !deviceOwner
) {

    const storedDeviceId =
        String(
            firebaseRegistration.deviceId ??
            ""
        ).trim();


    const currentDeviceId =
        String(
            getDeviceId() ??
            ""
        ).trim();


    // Only migrate if the old registration
    // already proves this is the same device.
    if (
        storedDeviceId
        &&
        currentDeviceId
        &&
        storedDeviceId ===
        currentDeviceId
    ) {

        const safeDeviceId =
            encodeURIComponent(
                currentDeviceId
            );


        const deviceOwnershipReference =
            doc(
                db,
                "registeredDevices",
                safeDeviceId
            );


        await setDoc(
            deviceOwnershipReference,
            {

                employeeNumber:
                    employeeNumber,

                deviceId:
                    currentDeviceId,

                fingerprint:
                    getFingerprint(),

                active:
                    true,

                migratedFromLegacyRegistration:
                    true,

                registeredAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );

                deviceOwner =
            await getRegisteredDeviceOwner();


        console.log(
            "Legacy device registration migrated:",
            employeeNumber
        );

    }

}


if (
    !deviceOwner
    ||
    deviceOwner.active !== true
    ||
    String(
        deviceOwner.employeeNumber ??
        ""
    ).trim() !==
    employeeNumber
) {

    console.warn(
        "DEVICE OWNERSHIP VALIDATION FAILED",
        {
            employeeNumber:
                employeeNumber,

            deviceId:
                getDeviceId()
        }
    );


    localStorage.removeItem(
        DEVICE_REGISTRATION_KEY
    );


    return null;

}


// =============================================
// Confirm Firebase Registration Device ID
// =============================================

const firebaseDeviceId =
    String(
        firebaseRegistration.deviceId ??
        ""
    ).trim();


const currentDeviceId =
    String(
        getDeviceId() ??
        ""
    ).trim();


if (
    !firebaseDeviceId
    ||
    firebaseDeviceId !==
    currentDeviceId
) {

    console.warn(
        "REGISTERED DEVICE ID MISMATCH",
        {
            employeeNumber:
                employeeNumber,

            storedDeviceId:
                firebaseDeviceId,

            currentDeviceId:
                currentDeviceId
        }
    );


    localStorage.removeItem(
        DEVICE_REGISTRATION_KEY
    );


    return null;

}


        // =============================================
        // Load Current Employee Record
        // =============================================

        const authenticatedUser =
    attendanceAuth.currentUser;

if (
    !authenticatedUser
) {
    return null;
}

const employeeQuery =
    query(
        collection(
            db,
            "employees"
        ),
        where(
            "authUid",
            "==",
            authenticatedUser.uid
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

        // =============================================
// Verify Authenticated Employee Matches
// Registered Device Employee
// =============================================

const authenticatedEmployeeNumber =
    String(
        employee.employeeNumber ??
        ""
    ).trim();


if (
    authenticatedEmployeeNumber !==
    employeeNumber
) {

    console.error(
        "REGISTERED DEVICE EMPLOYEE MISMATCH",
        {
            registeredEmployeeNumber:
                employeeNumber,

            authenticatedEmployeeNumber:
                authenticatedEmployeeNumber
        }
    );


    localStorage.removeItem(
        DEVICE_REGISTRATION_KEY
    );


    await signOut(
        attendanceAuth
    );


    return null;

}

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
// Start Registered Employee Attendance
// =====================================================

async function startRegisteredEmployeeAttendance() {

    const registeredEmployeeNumber =
        getRegisteredEmployeeNumber();

    if (
        !registeredEmployeeNumber
    ) {

        return null;
    }


    try {

        // =================================================
        // Validate Registered Device
        // =================================================

        const registeredEmployee =
            await loadRegisteredEmployee();


        // =================================================
        // Registered Device Could Not Be Validated
        // =================================================

        if (
            !registeredEmployee
        ) {

            console.warn(
                "REGISTERED DEVICE VALIDATION FAILED"
            );


            // Show normal login fields.

            employeeNumberInput.style.removeProperty(
                "display"
            );

            pinInput.style.removeProperty(
                "display"
            );

            checkInButton.style.removeProperty(
                "display"
            );


            const employeeNumberLabel =
                document.querySelector(
                    'label[for="employeeNumber"]'
                );

            const pinLabel =
                document.querySelector(
                    'label[for="pin"]'
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


            message.style.color =
                "#0b5ed7";

            message.innerHTML =
                "Ready for employee attendance.";


            return null;
        }


        // =================================================
        // Registered Device Confirmed
        // =================================================

        console.log(
            "REGISTERED EMPLOYEE DEVICE CONFIRMED:",
            {
                employeeNumber:
                    registeredEmployee.employeeNumber,

                name:
                    registeredEmployee.name ??
                    ""
            }
        );


        // =================================================
        // IMPORTANT
        // =================================================
        //
        // This function ONLY validates the registered
        // employee/device.
        //
        // It MUST NOT call:
        //
        //     await checkIn();
        //
        // The automatic QR attendance action is performed
        // separately by initializeSystem().
        //
        // This prevents Firebase onAuthStateChanged() from
        // accidentally causing a second attendance action.
        //
        // =================================================

        return registeredEmployee;


    } catch (
        error
    ) {

        console.error(
            "Unable to validate registered employee device:",
            error
        );


        message.style.color =
            "red";

        message.innerHTML =
            "❌ Unable to validate registered employee device.";


        return null;

    }

}

// =====================================================
// QR Attendance Action Protection
// =====================================================
//
// One QR page load must cause a maximum of ONE
// automatic attendance action.
//
// When the employee scans the QR code again, the page
// opens/reloads and this variable starts as false again.
//
// =====================================================

let qrAttendanceActionStarted =
    false;


// =====================================================
// Start System
// =====================================================

initializeSystem();


// =====================================================
// Initialize
// =====================================================

function initializeSystem() {

    // =================================================
    // Capture QR Scan Time
    // =================================================

    originalScanTime =
        new Date();


    // =================================================
    // Start Live Clock
    // =================================================

    updateClock();


    setInterval(
        updateClock,
        1000
    );


    // =================================================
    // Manual Continue Button
    // =================================================
    //
    // This is used when:
    //
    // 1. The employee is registering this device for
    //    the first time.
    //
    // 2. The employee needs to complete another manual
    //    step such as selecting Hybrid work location.
    //
    // IMPORTANT:
    //
    // Do NOT use qrAttendanceActionStarted here.
    //
    // Some attendance flows legitimately require the
    // employee to press Continue again after selecting
    // additional information.
    //
    // =================================================

    checkInButton.addEventListener(
        "click",
        checkIn
    );


    // =================================================
    // Employee Number Changed
    // =================================================

    employeeNumberInput.addEventListener(
        "input",
        () => {

            hybridWorkLocation.value =
                "";


            hybridWorkLocationContainer.style.display =
                "none";

        }
    );


    // =================================================
    // Late Check-In Reason
    // =================================================

    submitLateReasonButton.addEventListener(
        "click",
        submitLateReason
    );


    cancelLateReasonButton.addEventListener(
        "click",
        cancelLateReason
    );


    // =================================================
    // Early Check-Out
    // =================================================

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


    // =================================================
    // Late Check-Out
    // =================================================

    submitLateCheckOutButton.addEventListener(
        "click",
        submitLateCheckOut
    );


    cancelLateCheckOutButton.addEventListener(
        "click",
        cancelLateCheckOut
    );


    // =================================================
    // Hide Optional Sections Initially
    // =================================================

    earlyExitSection.hidden =
        true;


    earlyExitOtherSection.hidden =
        true;


    lateReasonSection.hidden =
        true;


    lateCheckOutSection.hidden =
        true;


    // =================================================
    // Initial Message
    // =================================================

    message.style.color =
        "#0b5ed7";


    message.innerHTML =
        "Ready for employee attendance.";


    // =================================================
    // Firebase Authentication State
    // =====================================================
    //
    // IMPORTANT DESIGN:
    //
    // FIRST EVER QR SCAN:
    //
    // No registered device
    //      ↓
    // Show Employee Number + PIN
    //      ↓
    // Employee presses Continue
    //      ↓
    // Authenticate
    //      ↓
    // Register device
    //      ↓
    // Record attendance
    //
    //
    // FUTURE QR SCAN:
    //
    // Registered device + Firebase session
    //      ↓
    // Validate registered employee
    //      ↓
    // Automatically perform ONE attendance action
    //
    //
    // The qrAttendanceActionStarted flag prevents the
    // Firebase Auth listener from causing the same QR
    // scan to execute attendance more than once.
    //
    // =====================================================

    onAuthStateChanged(
        attendanceAuth,
        async (user) => {

            try {

                // =============================================
                // No Firebase User
                // =============================================

                if (
                    !user
                ) {

                    console.log(
                        "NO ACTIVE EMPLOYEE AUTH SESSION"
                    );


                    // =========================================
                    // Show Manual Login
                    // =========================================

                    employeeNumberInput.style.removeProperty(
                        "display"
                    );


                    pinInput.style.removeProperty(
                        "display"
                    );


                    checkInButton.style.removeProperty(
                        "display"
                    );


                    const employeeNumberLabel =
                        document.querySelector(
                            'label[for="employeeNumber"]'
                        );


                    const pinLabel =
                        document.querySelector(
                            'label[for="pin"]'
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


                    message.style.color =
                        "#0b5ed7";


                    message.innerHTML =
                        "Ready for employee attendance.";


                    return;

                }


                // =============================================
                // Firebase User Exists
                // =============================================

                console.log(
                    "ACTIVE EMPLOYEE AUTH SESSION:",
                    user.uid
                );


                // =============================================
                // Check Local Device Registration
                // =============================================

                const registeredEmployeeNumber =
                    getRegisteredEmployeeNumber();


                // =============================================
                // No Registered Device
                // =============================================
                //
                // This normally means this is the employee's
                // FIRST registration.
                //
                // authenticateEmployee() may have just caused
                // Firebase Auth to fire this listener.
                //
                // DO NOT call checkIn() from here.
                //
                // The original manual checkIn() process must
                // be allowed to continue and create the device
                // registration itself.
                //
                // =============================================

                if (
                    !registeredEmployeeNumber
                ) {

                    console.log(
                        "NO LOCAL DEVICE REGISTRATION"
                    );


                    updateRegisteredDeviceDisplay();


                    return;

                }


                // =============================================
                // Registered Device Found
                // =============================================

                updateRegisteredDeviceDisplay();


                // =============================================
                // Prevent Duplicate QR Attendance Action
                // =============================================

                if (
                    qrAttendanceActionStarted
                ) {

                    console.log(
                        "QR attendance action already started."
                    );


                    return;

                }


                // Lock this QR page load BEFORE any awaits.
                //
                // This is important because Firebase may fire
                // another authentication-state callback while
                // asynchronous work is taking place.

                qrAttendanceActionStarted =
                    true;


                // =============================================
                // Validate Registered Employee
                // =============================================

                const registeredEmployee =
                    await startRegisteredEmployeeAttendance();


                if (
                    !registeredEmployee
                ) {

                    // Validation failed.
                    //
                    // Allow the page to fall back to manual
                    // login rather than performing attendance.

                    qrAttendanceActionStarted =
                        false;


                    return;

                }


                // =============================================
                // Automatic QR Attendance Action
                // =============================================
                //
                // THIS is the ONLY automatic attendance call
                // for an already registered device.
                //
                // Morning scan:
                //     No attendance → Check In
                //
                // End-of-shift scan:
                //     Existing Check In → Check Out
                //
                // Third scan:
                //     Attendance complete → Inform employee
                //
                // =============================================

                console.log(
                    "STARTING AUTOMATIC QR ATTENDANCE:",
                    registeredEmployee.employeeNumber
                );


                message.style.color =
                    "#0b5ed7";


                message.innerHTML =
                    "Registered device detected. Starting attendance...";


                await checkIn();


                       } catch (
                error
            ) {

                console.error(
                    "QR attendance initialization error:",
                    error
                );


                // IMPORTANT:
                // Do NOT reset qrAttendanceActionStarted here.
                //
                // Once an automatic QR attendance action has begun,
                // this page load must remain locked.
                //
                // If attendance partially succeeded before an error,
                // allowing another Firebase auth callback to run could
                // accidentally cause a second attendance action.


                message.style.color =
                    "red";


                message.innerHTML =
                    "❌ Unable to complete attendance."
                    +
                    "<br>Please scan the QR code again.";

            }

        }
    );

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
        employeeNumberInput.value
            .trim();

    const enteredPin =
        pinInput.value
            .trim();


    try {

        // =================================================
        // STEP 1
        // Load Employee Record
        // =================================================
        //
        // We MUST load the employee record BEFORE
        // Firebase Authentication because the Firebase
        // Auth email is stored in the employee record.
        //
        // The employee never sees this email.
        //
        // =================================================

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
                "❌ Employee account could not be found.";

            return null;

        }


        // =================================================
        // STEP 2
        // Build Employee Object
        // =================================================

        const employeeDocument =
            employeeSnapshot.docs[0];


        const employee = {

            id:
                employeeDocument.id,

            ...employeeDocument.data()

        };


        // =================================================
        // STEP 3
        // Check Employee Active Status
        // =================================================

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


        // =================================================
        // STEP 4
        // Get Stored Firebase Authentication Email
        // =================================================
        //
        // IMPORTANT:
        //
        // DO NOT construct:
        //
        // employeeNumber@attendance.local
        //
        // The employee record contains the actual hidden
        // Firebase Authentication email.
        //
        // =================================================

        const employeeAuthEmail =
            String(
                employee.authEmail ??
                ""
            ).trim();


        if (
            !employeeAuthEmail
        ) {

            console.error(
                "Employee authentication email is missing.",
                employee
            );

            message.style.color =
                "red";

            message.innerHTML =
                "❌ Employee authentication account is not configured.";

            return null;

        }


        // =================================================
        // DEBUG INFORMATION
        // =================================================

        console.log(
            "EMPLOYEE AUTHENTICATION:"
        );

        console.log({
            employeeNumber:
                employee.employeeNumber,

            authEmail:
                employeeAuthEmail,

            storedAuthUid:
                employee.authUid
        });


        // =================================================
        // STEP 5
        // Authenticate With Firebase
        // =================================================

        const userCredential =
            await signInWithEmailAndPassword(
                attendanceAuth,
                employeeAuthEmail,
                enteredPin
            );


        const authenticatedUser =
            userCredential.user;


        // =================================================
        // STEP 6
        // Verify Firebase UID
        // =================================================
        //
        // This is an important security check.
        //
        // The Firebase Auth account MUST belong to the
        // employee record we just loaded.
        //
        // =================================================

        if (
            !employee.authUid
        ) {

            await signOut(
                attendanceAuth
            );


            message.style.color =
                "red";

            message.innerHTML =
                "❌ Employee authentication account is not linked.";

            return null;

        }


        if (
            employee.authUid !==
            authenticatedUser.uid
        ) {

            console.error(
                "AUTH UID MISMATCH:",
                {
                    employeeAuthUid:
                        employee.authUid,

                    authenticatedUid:
                        authenticatedUser.uid
                }
            );


            await signOut(
                attendanceAuth
            );


            message.style.color =
                "red";

            message.innerHTML =
                "❌ Employee authentication account does not match.";

            return null;

        }


        // =================================================
        // STEP 7
        // Authentication Successful
        // =================================================
        //
        // DO NOT sign out here.
        //
        // Firestore Security Rules require the employee
        // Firebase Authentication session to remain active
        // while attendance is being written.
        //
        // =================================================

        console.log(
            "EMPLOYEE AUTHENTICATION SUCCESSFUL:",
            {
                employeeNumber:
                    employee.employeeNumber,

                authUid:
                    authenticatedUser.uid
            }
        );


        return employee;


    } catch (
        error
    ) {

        console.error(
            "Employee authentication error:",
            error
        );


        // =================================================
        // Clean Up Failed Authentication
        // =================================================

        try {

            await signOut(
                attendanceAuth
            );

        } catch (
            signOutError
        ) {

            console.error(
                "Employee Auth sign-out error:",
                signOutError
            );

        }


        // =================================================
        // Display Authentication Error
        // =================================================

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

    const scanTime =
        new Date(
            originalScanTime.getTime()
        );


    // =================================================
    // Shared Check-In Variables
    // =================================================

    let employee = null;

    let location = null;

    let distanceMetres = 0;

    let locationStatus = "Remote";


    checkInButton.disabled =
        true;

    message.style.color =
        "#0b5ed7";

    message.innerHTML =
        "Starting attendance verification...";


    try {

        hybridWorkLocationContainer.style.display =
            "none";

// =================================================
// Determine Authentication State
// =================================================

const authenticatedUser =
    attendanceAuth.currentUser;


// =================================================
// Registered / Authenticated Device
// =================================================

if (
    authenticatedUser
) {

    employee =
        await loadRegisteredEmployee();
}


// =================================================
// Manual Employee Login
// =================================================

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
}

// =================================================
// BLOCK DEVICE OWNED BY ANOTHER EMPLOYEE
// =================================================

const currentDeviceOwner =
    await getRegisteredDeviceOwner();


if (
    currentDeviceOwner
    &&
    currentDeviceOwner.active === true
    &&
    String(
        currentDeviceOwner.employeeNumber ??
        ""
    ).trim() !==
    String(
        employee.employeeNumber ??
        ""
    ).trim()
) {

    message.style.color =
        "red";


    message.innerHTML =
        "❌ This device is registered to another employee."
        +
        "<br><br>"
        +
        "Please contact an administrator.";


    checkInButton.disabled =
        false;


    await saveFailedAttendanceAttempt(
        employee,
        "Device belongs to another employee"
    );


    await writeAuditLog({

        category:
            "Security",

        action:
            "Blocked Device Ownership Attempt",

        description:
            `${employee.name ?? employee.employeeNumber} attempted attendance from a device assigned to another employee.`,

        actorType:
            "Employee",

        actorName:
            employee.name ??
            employee.employeeNumber ??
            "Unknown Employee",

        actorId:
            employee.employeeNumber ??
            "",

        targetType:
            "Device",

        targetName:
            getDeviceId(),

        targetId:
            getDeviceId(),

        source:
            "Employee Attendance",

        metadata: {

            attemptedEmployeeNumber:
                employee.employeeNumber ??
                "",

            registeredEmployeeNumber:
                currentDeviceOwner.employeeNumber ??
                "",

            deviceId:
                getDeviceId(),

            fingerprint:
                getFingerprint()

        }

    });


    return;

}


// =================================================
// Check Existing Firebase Registration
// =================================================

const existingRegistration =
    await getFirebaseDeviceRegistration(
        employee.employeeNumber
    );

    // =================================================
// Recover Missing Local Device Registration
// =================================================
//
// This handles cases where browser localStorage was
// cleared but Firebase still proves:
//
// 1. This device belongs to this employee
// 2. The employee registration is active
// 3. The stored Firebase device ID matches this device
// 4. A valid registration token still exists
//
// =================================================

if (
    !getRegisteredEmployeeNumber()
    &&
    existingRegistration
    &&
    existingRegistration.active === true
    &&
    currentDeviceOwner
    &&
    currentDeviceOwner.active === true
    &&
    String(
        currentDeviceOwner.employeeNumber ??
        ""
    ).trim() ===
    String(
        employee.employeeNumber ??
        ""
    ).trim()
) {

    const registeredDeviceId =
        String(
            existingRegistration.deviceId ??
            ""
        ).trim();


    const currentDeviceId =
        String(
            getDeviceId() ??
            ""
        ).trim();


    const registrationToken =
        String(
            existingRegistration.registrationToken ??
            ""
        ).trim();


    if (
        registeredDeviceId
        &&
        currentDeviceId
        &&
        registeredDeviceId ===
        currentDeviceId
        &&
        registrationToken
    ) {

        saveLocalDeviceRegistration(
            employee.employeeNumber,
            registrationToken
        );


        console.log(
            "LOCAL DEVICE REGISTRATION RECOVERED:",
            employee.employeeNumber
        );


        await writeAuditLog({

            category:
                "Security",

            action:
                "Local Device Registration Recovered",

            description:
                `${employee.name ?? employee.employeeNumber} had the local device registration restored from the verified Firebase registration.`,

            actorType:
                "Employee",

            actorName:
                employee.name ??
                employee.employeeNumber ??
                "Unknown Employee",

            actorId:
                employee.employeeNumber ??
                "",

            targetType:
                "Device",

            targetName:
                currentDeviceId,

            targetId:
                currentDeviceId,

            source:
                "Employee Attendance",

            metadata: {

                employeeNumber:
                    employee.employeeNumber ??
                    "",

                deviceId:
                    currentDeviceId,

                recoveryReason:
                    "Browser local registration missing"

            }

        });

    }

}


// =================================================
// Determine Whether This Is The Current
// Registered Device
// =================================================

const isCurrentRegisteredDevice =
    Boolean(
        authenticatedUser &&
        getRegisteredEmployeeNumber() ===
        String(
            employee.employeeNumber ??
            ""
        ).trim()
    );


// =================================================
// Block A Different Device
// =================================================

if (
    existingRegistration &&
    existingRegistration.active === true &&
    !isCurrentRegisteredDevice
) {

    message.style.color =
        "red";

    message.innerHTML =
        "❌ This employee already has a registered device."
        +
        "<br>Please contact an administrator to reset the device registration.";

    checkInButton.disabled =
        false;


    await writeAuditLog({

        category:
            "Security",

        action:
            "Device Registration Blocked",

        description:
            `${employee.name ?? employee.employeeNumber} attempted attendance registration from another device while an active registered device already existed.`,

        actorType:
            "Employee",

        actorName:
            employee.name ??
            employee.employeeNumber ??
            "Unknown Employee",

        actorId:
            employee.employeeNumber ??
            "",

        targetType:
            "Employee",

        targetName:
            employee.name ??
            employee.employeeNumber ??
            "Unknown Employee",

        targetId:
            employee.employeeNumber ??
            "",

        source:
            "Employee Attendance",

        metadata: {

            employeeNumber:
                employee.employeeNumber ??
                "",

            reason:
                "Active registered device already exists",

            attemptedDeviceId:
                getDeviceId(),

            attemptedFingerprint:
                getFingerprint()

        }

    });


    return;
}


// =================================================
// Create New Registration
// =================================================

if (
    !existingRegistration ||
    existingRegistration.active !== true
) {

    try {

        const registrationToken =
            await createFirebaseDeviceRegistration(
                employee
            );


        saveLocalDeviceRegistration(
            employee.employeeNumber,
            registrationToken
        );

    } catch (
        error
    ) {

        // =============================================
        // Device Already Belongs To Another Employee
        // =============================================

        if (
            error.message ===
            "DEVICE_ALREADY_REGISTERED_TO_OTHER_EMPLOYEE"
        ) {

            message.style.color =
                "red";


            message.innerHTML =
                "❌ This device is already registered to another employee."
                +
                "<br><br>"
                +
                "Please contact an administrator.";


            // =========================================
            // Failed Attendance Attempt
            // =========================================

            await saveFailedAttendanceAttempt(
                employee,
                "Device already registered to another employee"
            );


            // =========================================
            // Audit Log
            // =========================================

            await writeAuditLog({

                category:
                    "Security",

                action:
                    "Blocked Device Registration",

                description:
                    `${employee.name ?? employee.employeeNumber} attempted to register a device already assigned to another employee.`,

                actorType:
                    "Employee",

                actorName:
                    employee.name ??
                    employee.employeeNumber ??
                    "Unknown Employee",

                actorId:
                    employee.employeeNumber ??
                    "",

                targetType:
                    "Device",

                targetName:
                    getDeviceId(),

                targetId:
                    getDeviceId(),

                source:
                    "Employee Attendance",

                metadata: {

                    employeeNumber:
                        employee.employeeNumber ??
                        "",

                    reason:
                        "Device already registered to another employee",

                    attemptedDeviceId:
                        getDeviceId(),

                    attemptedFingerprint:
                        getFingerprint()

                }

            });


            return;

        }


        // =============================================
        // Unknown Registration Error
        // =============================================

        throw error;

    }

}


        // =================================================
        // Check Existing Attendance
        // =================================================

                const existingAttendance =
            await getTodayAttendanceRecord(
                employee
            );


        // =================================================
        // Determine Existing Attendance State
        // =================================================

        const hasExistingCheckIn =
            Boolean(
                existingAttendance
                &&
                (
                    String(
                        existingAttendance.time ??
                        ""
                    ).trim()
                    ||
                    existingAttendance.scanTimestamp
                    ||
                    existingAttendance.checkInTimestamp
                )
            );


        const hasExistingCheckOut =
            Boolean(
                existingAttendance
                &&
                (
                    String(
                        existingAttendance.checkOutTime ??
                        ""
                    ).trim()
                    ||
                    existingAttendance.checkOutTimestamp
                )
            );

            // =================================================
// Check For Open Normal Work Session
// =================================================

const openNormalWorkSession =
    existingAttendance
        &&
        Array.isArray(
            existingAttendance.workSessions
        )
            ?
            existingAttendance.workSessions.find(
                function (
                    session
                ) {

                    return (
                        !String(
                            session.checkOutTime ??
                            ""
                        ).trim()
                        &&
                        !session.checkOutTimestamp
                    );

                }
            )
            :
            null;


const hasOpenNormalWorkSession =
    Boolean(
        openNormalWorkSession
    );


        // =================================================
        // INVALID / ORPHAN CHECK-OUT
        // =================================================
        //
        // A check-out may NEVER exist without a check-in.
        //
        // Older broken versions of the attendance system
        // could accidentally create:
        //
        // Check In:  -
        // Check Out: 14:24
        //
        // If such a record is found, repair it before
        // continuing with the employee's real check-in.
        //
        // =================================================

        if (
            existingAttendance
            &&
            !hasExistingCheckIn
            &&
            hasExistingCheckOut
        ) {

            console.warn(
                "ORPHAN CHECK-OUT DETECTED:",
                {
                    employeeNumber:
                        employee.employeeNumber,

                    attendanceId:
                        existingAttendance.id,

                    checkOutTime:
                        existingAttendance.checkOutTime ??
                        null
                }
            );


            await updateDoc(
                existingAttendance.reference,
                {

                    checkOutTime:
                        "",

                    checkOutTimestamp:
                        null,

                    checkOutMethod:
                        "",

                    earlyExit:
                        false,

                    earlyExitReason:
                        "",

                    earlyExitNote:
                        "",

                    lateCheckout:
                        false,

                    lateCheckoutReason:
                        "",

                    lateCheckoutMinutes:
                        0,

                    updatedAt:
                        serverTimestamp()

                }
            );


            // Treat repaired record as having no completed
            // attendance state so check-in may continue.

            existingAttendance.checkOutTime =
                "";

            existingAttendance.checkOutTimestamp =
                null;

        }


        // =================================================
        // EXISTING VALID CHECK-IN → BEGIN CHECK-OUT
        // =================================================

        if (
    existingAttendance
    &&
    hasExistingCheckIn
    &&
    (
        !hasExistingCheckOut
        ||
        hasOpenNormalWorkSession
    )
) {

    await beginCheckOut(
        employee,
        existingAttendance
    );

    return;
}


        // =================================================
// EXISTING COMPLETE ATTENDANCE
// =================================================
//
// Normal attendance is complete.
//
// Employees with afterHoursEnabled === true
// may start or end an after-hours session.
//
// Employees without permission keep the original
// "attendance complete" behaviour.
//
// =================================================

if (
    existingAttendance
    &&
    hasExistingCheckIn
    &&
    hasExistingCheckOut
) {

    


    // =============================================
    // Check Existing After-Hours State
    // =============================================

    const openAfterHoursSession =
        getOpenAfterHoursSession(
            existingAttendance
        );


    // =============================================
    // Open Session → After-Hours Check-Out
    // =============================================

    if (
        openAfterHoursSession
    ) {

        await endAfterHoursSession(
            employee,
            existingAttendance
        );


        return;

    }


    // =============================================
// No Open Session
// =============================================
//
// After-hours may ONLY start once the employee's
// scheduled normal work end time has been reached.
//
// If the employee checked out early and returns
// before scheduled end, do NOT start after-hours.
// That return belongs to normal working time.
//
// =============================================

const employeeScheduledEndTime =
    String(
        employee.endTime ??
        existingAttendance.scheduledEndTime ??
        ""
    ).trim();


const currentScanTime =
    new Date(
        originalScanTime.getTime()
    );


let scheduledEndDateTime =
    null;


if (
    employeeScheduledEndTime
) {

    const [
        endHour,
        endMinute
    ] =
        employeeScheduledEndTime
            .split(":")
            .map(Number);


    if (
        Number.isFinite(
            endHour
        )
        &&
        Number.isFinite(
            endMinute
        )
    ) {

        scheduledEndDateTime =
            new Date(
                currentScanTime
            );


        scheduledEndDateTime.setHours(
            endHour,
            endMinute,
            0,
            0
        );

    }

}


// =============================================
// Return Before Scheduled End
// =============================================
//
// Employee previously checked out early,
// but has returned before normal working
// hours have ended.
//
// Start another NORMAL work session.
// Do NOT start after-hours.
//
// =============================================

if (
    scheduledEndDateTime
    &&
    currentScanTime <
    scheduledEndDateTime
) {

    const normalWorkLocation =
        getEmployeeWorkArrangement(
            employee
        );


    await startNormalWorkSession(
        employee,
        existingAttendance,
        normalWorkLocation
    );


    return;

}

// =============================================
    // After-Hours Not Enabled
    // =============================================

    if (
        employee.afterHoursEnabled !==
        true
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

// =============================================
// Scheduled End Reached → After-Hours Allowed
// =============================================

const afterHoursWorkLocation =
    getEmployeeWorkArrangement(
        employee
    );


await startAfterHoursSession(
    employee,
    existingAttendance,
    afterHoursWorkLocation
);


return;

}


        // =================================================
// EXISTING LEAVE RECORD
// =================================================

let endedLeaveSession =
    null;


if (
    existingAttendance
    &&
    !hasExistingCheckIn
    &&
    isLeaveStatus(
        existingAttendance.status
    )
) {

    endedLeaveSession =
        await closeActiveLeaveForCheckIn(
            employee,
            existingAttendance,
            scanTime
        );


    if (
        endedLeaveSession
    ) {

        existingAttendance.leaveSessions =
            endedLeaveSession.leaveSessions;

        existingAttendance.activeLeave =
            false;

        existingAttendance.activeLeaveType =
            "";

    }

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


    // =============================================
    // Hybrid Requires Manual Continue
    // =============================================

    checkInButton.style.setProperty(
        "display",
        "block",
        "important"
    );

    checkInButton.disabled =
        false;

    checkInButton.textContent =
        "Continue";


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

        // Reset location information
        location =
            null;

        distanceMetres =
            0;

        locationStatus =
            "Remote";


        // =================================================
        // Get Office Location
        // =================================================

        if (
            selectedWorkLocation ===
            "Office"
        ) {

            message.innerHTML =
                "Getting your current location...";

            location =
                await getCurrentLocation();


            // Make sure GPS returned a valid location
            if (
                !location ||
                typeof location.latitude !== "number" ||
                typeof location.longitude !== "number"
            ) {

                throw new Error(
                    "GPS_LOCATION_UNAVAILABLE"
                );

            }


            // =================================================
            // Calculate Distance From Office
            // =================================================

            distanceMetres =
                calculateDistanceFromOfficeBoundary(
                    location.latitude,
                    location.longitude
                );


            // =================================================
            // Determine Location Status
            // =================================================

            locationStatus =
                getLocationStatus(
                    location.latitude,
                    location.longitude
                );


            // =================================================
            // Apply Office Boundary Buffer
            // =================================================

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

            await writeAuditLog({
    category:
        "Security",

    action:
        "Attendance Location Denied",

    description:
        locationStatus ===
        "Location Uncertain"
            ?
            `${employee.name ?? employee.employeeNumber} was denied check-in because the GPS location accuracy was insufficient.`
            :
            `${employee.name ?? employee.employeeNumber} was denied check-in because the device was outside the office boundary.`,

    actorType:
        "Employee",

    actorName:
        employee.name ??
        employee.employeeNumber ??
        "Unknown Employee",

    actorId:
        employee.employeeNumber ??
        "",

    targetType:
        "Employee",

    targetName:
        employee.name ??
        employee.employeeNumber ??
        "Unknown Employee",

    targetId:
        employee.employeeNumber ??
        "",

    source:
        "Employee Attendance",

    metadata: {
        employeeNumber:
            employee.employeeNumber ??
            "",

        department:
            employee.department ??
            "",

        reason:
            locationStatus ===
            "Location Uncertain"
                ?
                "GPS location was not accurate enough"
                :
                "Outside office boundary",

        locationStatus:
            locationStatus,

        distanceFromOfficeMetres:
            Math.round(
                distanceMetres
            ),

        locationAccuracyMetres:
            location
                ?
                Math.round(
                    location.accuracy
                )
                :
                null,

        deviceId:
            getDeviceId(),

        fingerprint:
            getFingerprint()
    }
});

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
    &&
    !endedLeaveSession
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
    selectedWorkLocation,
Boolean(
    endedLeaveSession
),
endedLeaveSession
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

        const securityFailureMessages = {
    EMPLOYEE_ALREADY_CHECKED_IN:
        "Employee already checked in today",

    DEVICE_ALREADY_USED:
        "Device already used for attendance today",

    FINGERPRINT_ALREADY_USED:
        "Browser fingerprint already used for attendance today"
};

const securityFailureReason =
    securityFailureMessages[
        error.message
    ];


if (
    securityFailureReason
) {

    const attemptedEmployeeNumber =
        employeeNumberInput.value.trim()
        ||
        getRegisteredEmployeeNumber()
        ||
        "";

    await writeAuditLog({
        category:
            "Security",

        action:
            "Attendance Security Blocked",

        description:
            `Attendance attempt for employee number ${attemptedEmployeeNumber || "Unknown"} was blocked: ${securityFailureReason}.`,

        actorType:
            "Employee",

        actorName:
            attemptedEmployeeNumber ||
            "Unknown Employee",

        actorId:
            attemptedEmployeeNumber,

        targetType:
            "Employee",

        targetName:
            attemptedEmployeeNumber ||
            "Unknown Employee",

        targetId:
            attemptedEmployeeNumber,

        source:
            "Employee Attendance",

        metadata: {
            employeeNumber:
                attemptedEmployeeNumber,

            reason:
                securityFailureReason,

            errorCode:
                error.message,

            deviceId:
                getDeviceId(),

            fingerprint:
                getFingerprint()
        }
    });

}

        handleAttendanceSaveError(
            error,
            message
        );

        await writeAuditLog({
    category:
        "Security",

    action:
        "Check-Out Location Denied",

    description:
        locationStatus ===
        "Location Uncertain"
            ?
            `${employee.name ?? employee.employeeNumber} was denied check-out because the GPS location accuracy was insufficient.`
            :
            `${employee.name ?? employee.employeeNumber} was denied check-out because the device was outside the office boundary.`,

    actorType:
        "Employee",

    actorName:
        employee.name ??
        employee.employeeNumber ??
        "Unknown Employee",

    actorId:
        employee.employeeNumber ??
        "",

    targetType:
        "Employee",

    targetName:
        employee.name ??
        employee.employeeNumber ??
        "Unknown Employee",

    targetId:
        employee.employeeNumber ??
        "",

    source:
        "Employee Attendance",

    metadata: {
        employeeNumber:
            employee.employeeNumber ??
            "",

        department:
            employee.department ??
            "",

        reason:
            locationStatus ===
            "Location Uncertain"
                ?
                "GPS location was not accurate enough"
                :
                "Outside office boundary",

        locationStatus:
            locationStatus,

        distanceFromOfficeMetres:
            Math.round(
                distanceMetres
            ),

        locationAccuracyMetres:
            location
                ?
                Math.round(
                    location.accuracy
                )
                :
                null,

        deviceId:
            getDeviceId(),

        fingerprint:
            getFingerprint()
    }
});

        checkInButton.disabled =
            false;

    }

}

// =====================================================
// Employee Work Arrangement
// =====================================================

// =====================================================
// Employee Work Arrangement
// =====================================================

function getEmployeeWorkArrangement(
    employee
) {
    const arrangement =
        String(
            employee?.workArrangement ??
            "Office"
        )
            .trim()
            .toLowerCase();

    if (
        arrangement === "remote"
    ) {
        return "Remote";
    }

    if (
        arrangement === "hybrid"
    ) {
        return "Hybrid";
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

        // =====================================================
// Determine Check-Out Work Location
// =====================================================

// The employee's current work arrangement is authoritative
// for Remote employees.
//
// This prevents an old/stale attendance record containing
// "Office" from forcing a Remote employee through GPS
// validation.

const employeeWorkArrangement =
    getEmployeeWorkArrangement(
        employee
    );

let workLocation =
    employeeWorkArrangement;

// Remote employees are ALWAYS treated as Remote.
// No historical attendance workLocation can override this.
if (
    employeeWorkArrangement ===
    "Remote"
) {
    workLocation =
        "Remote";
}

// Office employees are ALWAYS treated as Office.
else if (
    employeeWorkArrangement ===
    "Office"
) {
    workLocation =
        "Office";
}

// Hybrid employees use the location recorded when
// they checked in that day.
else if (
    employeeWorkArrangement ===
    "Hybrid"
) {
    const recordedWorkLocation =
        String(
            attendanceRecord.workLocation ??
            ""
        )
            .trim()
            .toLowerCase();

    if (
        recordedWorkLocation ===
        "remote"
    ) {
        workLocation =
            "Remote";
    } else {
        workLocation =
            "Office";
    }
}

console.log(
    "CHECKOUT WORK LOCATION:",
    {
        employeeNumber:
            employee.employeeNumber,
        employeeWorkArrangement:
            employeeWorkArrangement,
        attendanceRecordWorkLocation:
            attendanceRecord.workLocation ??
            null,
        finalWorkLocation:
            workLocation
    }
);


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

        // =====================================================
    // SAFETY: Check-Out Requires A Real Check-In
    // =====================================================

    const hasValidCheckIn =
        Boolean(
            String(
                attendanceRecord.time ??
                ""
            ).trim()
            ||
            attendanceRecord.scanTimestamp
            ||
            attendanceRecord.checkInTimestamp
        );


    if (
        !hasValidCheckIn
    ) {

        console.error(
            "CHECK-OUT BLOCKED - NO CHECK-IN:",
            {
                employeeNumber:
                    employee.employeeNumber,

                attendanceId:
                    attendanceRecord.id
            }
        );


        throw new Error(
            "CHECKOUT_WITHOUT_CHECKIN"
        );

    }

    const checkOutTimeText =
    checkOutTime.toLocaleTimeString(
        "en-ZA"
    );


// =====================================================
// Preserve Normal Work Sessions
// =====================================================

const existingWorkSessions =
    Array.isArray(
        attendanceRecord.workSessions
    )
        ?
        attendanceRecord.workSessions.map(
            function (
                session
            ) {

                return {
                    ...session
                };

            }
        )
        :
        [];


let workSessions =
    existingWorkSessions;


// =====================================================
// Find Open Normal Work Session
// =====================================================

let openWorkSessionIndex =
    workSessions.findIndex(
        function (
            session
        ) {

            return (
                !String(
                    session.checkOutTime ??
                    ""
                ).trim()
                &&
                !session.checkOutTimestamp
            );

        }
    );


// =====================================================
// Legacy / First Normal Work Session
// =====================================================
//
// Existing attendance records may not yet have
// workSessions.
//
// Build the first session from the normal QR check-in.
//
// =====================================================

if (
    openWorkSessionIndex ===
    -1
    &&
    workSessions.length ===
    0
) {

    const originalCheckInTime =
        String(
            attendanceRecord.time ??
            attendanceRecord.checkInTime ??
            ""
        ).trim();


    const originalCheckInTimestamp =
        attendanceRecord.scanTimestamp ??
        attendanceRecord.checkInTimestamp ??
        null;


    workSessions.push({

        sessionNumber:
            1,

        checkInTime:
            originalCheckInTime,

        checkInTimestamp:
            originalCheckInTimestamp,

        checkOutTime:
            "",

        checkOutTimestamp:
            null,

        workedMinutes:
            0,

        workLocation:
            String(
                attendanceRecord.workLocation ??
                "Office"
            ).trim(),

        source:
            attendanceRecord.checkInMethod ??
            "QR Code"

    });


    openWorkSessionIndex =
        0;

}


// =====================================================
// Close Current Normal Work Session
// =====================================================

if (
    openWorkSessionIndex >=
    0
) {

    const currentSession =
        workSessions[
            openWorkSessionIndex
        ];


    let sessionCheckInDate =
        null;


    if (
        currentSession.checkInTimestamp
    ) {

        if (
            currentSession.checkInTimestamp instanceof
            Date
        ) {

            sessionCheckInDate =
                new Date(
                    currentSession.checkInTimestamp
                );

        } else if (
            typeof currentSession.checkInTimestamp.toDate ===
            "function"
        ) {

            sessionCheckInDate =
                currentSession.checkInTimestamp.toDate();

        }

    }


    let workedMinutes =
        0;


    if (
        sessionCheckInDate
    ) {

        workedMinutes =
            Math.max(
                0,
                Math.floor(
                    (
                        checkOutTime.getTime()
                        -
                        sessionCheckInDate.getTime()
                    )
                    /
                    60000
                )
            );

    }


    workSessions[
        openWorkSessionIndex
    ] = {

        ...currentSession,

        checkOutTime:
            checkOutTimeText,

        checkOutTimestamp:
            checkOutTime,

        workedMinutes:
            workedMinutes,

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
                ""

    };

}


// =====================================================
// Save Check-Out
// =====================================================

await updateDoc(
    attendanceReference,
    {

        workSessions:
            workSessions,

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


// Keep the local record synchronized.
attendanceRecord.workSessions =
    workSessions;

attendanceRecord.checkOutTime =
    checkOutTimeText;

attendanceRecord.checkOutTimestamp =
    checkOutTime;

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
    selectedWorkLocation = "Office",
    returningFromLeave = false,
    preparedLeaveSession = null
) {

    const submittedTime =
        new Date();

    const dateKey =
        getLocalDateKey(
            scanTime
        );

        console.log(
    "SAVE ATTENDANCE DEBUG:",
    {
        employeeNumber:
            employee.employeeNumber,

        attendanceStatus:
            attendanceStatus,

        returningFromLeave:
            returningFromLeave
    }
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

    // =============================================
    // Employee Daily Lock
    // =============================================

    if (
        employeeLock.exists()
        &&
        !returningFromLeave
    ) {

        throw new Error(
            "EMPLOYEE_ALREADY_CHECKED_IN"
        );

    }


    // =============================================
    // Device Daily Lock
    // =============================================

    if (
        deviceLock.exists()
    ) {

        const lockedEmployeeNumber =
            String(
                deviceLock.data().employeeNumber ??
                ""
            ).trim();


        const currentEmployeeNumber =
            String(
                employee.employeeNumber ??
                ""
            ).trim();

            console.log(
    "DEVICE LOCK DEBUG:",
    {
        returningFromLeave:
            returningFromLeave,

        lockedEmployeeNumber:
            lockedEmployeeNumber,

        currentEmployeeNumber:
            currentEmployeeNumber,

        sameEmployee:
            lockedEmployeeNumber ===
            currentEmployeeNumber,

        lockData:
            deviceLock.data()
    }
);


        const sameEmployee =
            lockedEmployeeNumber ===
            currentEmployeeNumber;


        if (
            !returningFromLeave
            ||
            !sameEmployee
        ) {

            throw new Error(
                "DEVICE_ALREADY_USED"
            );

        }

    }


    // =============================================
    // Fingerprint Daily Lock
    // =============================================

    if (
        fingerprintLock.exists()
    ) {

        const lockedEmployeeNumber =
            String(
                fingerprintLock.data().employeeNumber ??
                ""
            ).trim();


        const currentEmployeeNumber =
            String(
                employee.employeeNumber ??
                ""
            ).trim();


        const sameEmployee =
            lockedEmployeeNumber ===
            currentEmployeeNumber;


        if (
            !returningFromLeave
            ||
            !sameEmployee
        ) {

            throw new Error(
                "FINGERPRINT_ALREADY_USED"
            );

        }

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
            serverTimestamp(),

        // =========================================
        // Clear Active Leave State
        // =========================================

        leaveDuration:
    "",

leaveTime:
    "",

activeLeave:
    false,

activeLeaveType:
    "",


// =========================================
// Commit Leave Return Only With Check-In
// =========================================

...(
    returningFromLeave
    &&
    preparedLeaveSession
        ?
        {

            leaveSessions:
                preparedLeaveSession.leaveSessions,

            totalLeaveMinutes:
                preparedLeaveSession.totalLeaveMinutes

        }
        :
        {}
)

    },
    {
        merge:
            true
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

        await writeAuditLog({
        category:
            "Attendance",

        action:
            attendanceStatus ===
            "Late"
                ?
                "Employee Late Check-In"
                :
                "Employee Check-In",

        description:
            attendanceStatus ===
            "Late"
                ?
                `${employee.name ?? employee.employeeNumber} checked in late at ${scanTime.toLocaleTimeString("en-ZA")}.`
                :
                `${employee.name ?? employee.employeeNumber} checked in at ${scanTime.toLocaleTimeString("en-ZA")}.`,

        actorType:
            "Employee",

        actorName:
            employee.name ??
            employee.employeeNumber ??
            "Unknown Employee",

        actorId:
            employee.employeeNumber ??
            "",

        targetType:
            "Employee",

        targetName:
            employee.name ??
            employee.employeeNumber ??
            "Unknown Employee",

        targetId:
            employee.employeeNumber ??
            "",

        source:
            "Employee Attendance",

        metadata: {

            employeeNumber:
                employee.employeeNumber ??
                "",

            department:
                employee.department ??
                "",

            status:
                attendanceStatus,

            checkInTime:
                scanTime.toLocaleTimeString(
                    "en-ZA"
                ),

            workLocation:
                selectedWorkLocation,

            locationStatus:
                locationStatus,

            lateReason:
                attendanceStatus ===
                "Late"
                    ?
                    lateReason
                    :
                    ""
        }
    });

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
