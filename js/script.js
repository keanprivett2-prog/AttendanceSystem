// =========================================
// SAMPLE EMPLOYEE DATABASE
// =========================================

const employees = [

    {
        employeeNumber: "1001",
        pin: "1234",
        name: "John Smith",
        department: "Finance"
    },

    {
        employeeNumber: "1002",
        pin: "5678",
        name: "Jane Doe",
        department: "HR"
    },

    {
        employeeNumber: "1003",
        pin: "4321",
        name: "Michael Brown",
        department: "IT"
    }

];
// =====================================
// Employee Attendance System
// =====================================

// Update the clock every second
function updateClock() {

    const now = new Date();

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };

    const date = now.toLocaleDateString("en-ZA", options);
    const time = now.toLocaleTimeString("en-ZA");

    document.getElementById("clock").innerHTML =
        date + "<br>" + time;
}

// Run immediately
updateClock();

// Update every second
setInterval(updateClock, 1000);
// =====================================
// Check In Button
// =====================================

const checkInButton = document.getElementById("checkInButton");
const message = document.getElementById("message");

checkInButton.addEventListener("click", checkIn);

// =====================================
// Main Check In Function
// =====================================

function checkIn() {


    // Get the values entered by the user
    const employeeNumber =
        document.getElementById("employeeNumber").value.trim();

    const pin =
        document.getElementById("pin").value.trim();

    // Check Employee Number
    if (employeeNumber === "") {

        message.style.color = "red";
        message.innerHTML =
            "❌ Please enter your Employee Number.";

        return;
    }

    // Check PIN
    if (pin === "") {

        message.style.color = "red";
        message.innerHTML =
            "❌ Please enter your PIN.";

        return;
    }

    const employee = findEmployee(employeeNumber);

    if (!employee) {

        message.style.color = "red";
        message.innerHTML =
            "❌ Employee Number not found.";

        return;
    }

    // Check PIN
    if (employee.pin !== pin) {

        message.style.color = "red";
        message.innerHTML =
            "❌ Incorrect PIN.";

        return;
    }

    // Prevent duplicate check-ins
    if (!securityCheck(employee)) {
        return;
    }

    // Get attendance status
    const attendanceStatus = getAttendanceStatus();

    // Save attendance
    saveAttendance(employee, attendanceStatus);

    // Success message
    message.style.color = "green";
    message.innerHTML =
        "✅ Welcome, " +
        employee.name +
        "! (" +
        attendanceStatus +
        ")";


}
// =========================================
// FIND EMPLOYEE
// =========================================

function findEmployee(employeeNumber) {

    return employees.find(employee =>
        employee.employeeNumber === employeeNumber
    );

}