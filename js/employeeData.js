// =========================================
// EMPLOYEE DATABASE
// (Temporary until Firebase is connected)
// =========================================

const employees = [

    {
        employeeNumber: "1001",
        pin: "1234",
        name: "John Smith",
        department: "Finance",
        active: true
    },

    {
        employeeNumber: "1002",
        pin: "5678",
        name: "Jane Doe",
        department: "HR",
        active: true
    },

    {
        employeeNumber: "1003",
        pin: "4321",
        name: "Michael Brown",
        department: "IT",
        active: true
    }

];

// Search employee
function findEmployee(employeeNumber){

    return employees.find(emp =>
        emp.employeeNumber === employeeNumber &&
        emp.active === true
    );

}
// =========================================
// TODAY'S ATTENDANCE
// (Temporary until Firebase is connected)
// =========================================

