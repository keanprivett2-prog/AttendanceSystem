// =====================================================
// ATTENDANCE MANAGER
// =====================================================

// Temporary attendance storage
let todayAttendance = [];

// =====================================================
// Check if Employee Already Checked In
// =====================================================

function employeeAlreadyCheckedIn(employee) {

    return todayAttendance.some(record =>
        record.employeeNumber === employee.employeeNumber
    );

}

// =====================================================
// Save Attendance
// =====================================================

function saveAttendance(employee) {

    todayAttendance.push({

        employeeNumber: employee.employeeNumber,
        name: employee.name,
        time: new Date().toLocaleTimeString("en-ZA")

    });

}