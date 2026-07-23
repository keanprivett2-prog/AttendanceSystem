// =====================================================
// DEVICE MANAGER
// =====================================================

// Temporary device lock storage
let deviceLocks = [];

// =====================================================
// Generate Device ID
// =====================================================

function getDeviceId() {

    let deviceId = localStorage.getItem("attendanceDeviceId");

    if (deviceId === null) {

        deviceId = crypto.randomUUID();

        localStorage.setItem("attendanceDeviceId", deviceId);

    }

    return deviceId;

}

// =====================================================
// Browser Fingerprint
// =====================================================

function getFingerprint() {

    return btoa(
        navigator.userAgent +
        navigator.language +
        screen.width +
        "x" +
        screen.height +
        Intl.DateTimeFormat().resolvedOptions().timeZone
    );

}