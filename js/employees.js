// =====================================
// Firebase
// =====================================

import { db } from "../firebase/firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// =====================================
// Elements
// =====================================

const modal = document.getElementById("employeeModal");
const addEmployeeButton = document.getElementById("addEmployeeButton");
const closeEmployeeModal = document.getElementById("closeEmployeeModal");
const cancelEmployeeButton = document.getElementById("cancelEmployeeButton");
const employeeForm = document.getElementById("employeeForm");
const employeeTableBody = document.getElementById("employeeTableBody");

let editingEmployeeId = null;

// =====================================
// Modal Controls
// =====================================

addEmployeeButton.addEventListener("click", () => {
    modal.classList.add("active");
});

closeEmployeeModal.addEventListener("click", () => {
    modal.classList.remove("active");
});

cancelEmployeeButton.addEventListener("click", () => {
    modal.classList.remove("active");
});

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.classList.remove("active");
    }
});

// =====================================
// Save Employee
// =====================================

employeeForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const employeeNumber =
        document.getElementById("employeeNumber").value.trim();

    const employeeName =
        document.getElementById("employeeName").value.trim();

    const employeeDepartment =
        document.getElementById("employeeDepartment").value.trim();

    const employeePin =
        document.getElementById("employeePin").value.trim();

    const employeeQuery = query(
    collection(db, "employees"),
    where("employeeNumber", "==", employeeNumber)
);

const existingEmployees = await getDocs(employeeQuery);

const duplicateEmployee = existingEmployees.docs.find((employeeDoc) => {
    return employeeDoc.id !== editingEmployeeId;
});

if (duplicateEmployee) {

    alert("An employee with this Employee Number already exists.");

    return;

}

    try {

        if (editingEmployeeId) {

    const employeeReference = doc(
        db,
        "employees",
        editingEmployeeId
    );

    await updateDoc(employeeReference, {
        employeeNumber: employeeNumber,
        name: employeeName,
        department: employeeDepartment,
        pin: employeePin
    });

} else {

    await addDoc(collection(db, "employees"), {
        employeeNumber: employeeNumber,
        name: employeeName,
        department: employeeDepartment,
        pin: employeePin,
        active: true
    });

}

        
        employeeForm.reset();
        editingEmployeeId = null;
        modal.classList.remove("active");

        await loadEmployees();

        alert("Employee saved successfully.");

    } catch (error) {

        console.error("Error saving employee:", error);

        alert("Employee could not be saved.");

    }

});

// =====================================
// Load Employees
// =====================================

async function loadEmployees() {

    const snapshot = await getDocs(collection(db, "employees"));

    employeeTableBody.innerHTML = "";

    if (snapshot.empty) {

        employeeTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    No employees have been added yet.
                </td>
            </tr>
        `;

        return;
    }

    snapshot.forEach((doc) => {

        const employee = doc.data();

        employeeTableBody.innerHTML += `
            <tr>
                <td>${employee.employeeNumber ?? "-"}</td>
                <td>${employee.name ?? "-"}</td>
                <td>${employee.department ?? "-"}</td>
                <td>${employee.active ? "Active" : "Inactive"}</td>
                <td>
    <button class="employee-action-btn edit-btn" data-id="${doc.id}">
        Edit
    </button>

    <button class="employee-action-btn reset-pin-btn" data-id="${doc.id}">
        Reset PIN
    </button>

    <button
    class="employee-action-btn ${employee.active ? "disable-btn" : "enable-btn"}"
    data-id="${doc.id}"
>
    ${employee.active ? "Disable" : "Enable"}
</button>
    
    <button class="employee-action-btn delete-btn" data-id="${doc.id}">
    Delete
</button>
</td>
            </tr>
        `;

    });
    const editButtons = document.querySelectorAll(".edit-btn");

        editButtons.forEach((button) => {

        button.addEventListener("click", async () => {

            const employeeId = button.dataset.id;

            editingEmployeeId = employeeId;

            const employeeReference = doc(db, "employees", employeeId);

            const employeeSnapshot = await getDoc(employeeReference);

            if (!employeeSnapshot.exists()) {
                alert("Employee could not be found.");
                return;
            }

            const employee = employeeSnapshot.data();

            document.getElementById("employeeNumber").value =
                employee.employeeNumber ?? "";

            document.getElementById("employeeName").value =
                employee.name ?? "";

            document.getElementById("employeeDepartment").value =
                employee.department ?? "";

            document.getElementById("employeePin").value =
                employee.pin ?? "";

            modal.classList.add("active");

        });

    });

    // =====================================
    // Delete Employee
    // =====================================

    const deleteButtons = document.querySelectorAll(".delete-btn");

    deleteButtons.forEach((button) => {

        button.addEventListener("click", async () => {

            const employeeId = button.dataset.id;

            const employeeReference = doc(db, "employees", employeeId);

            const employeeSnapshot = await getDoc(employeeReference);

            if (!employeeSnapshot.exists()) {
                alert("Employee could not be found.");
                return;
            }

            const employee = employeeSnapshot.data();

            const confirmed = confirm(
                `Delete Employee?\n\n` +
                `Employee: ${employee.name}\n` +
                `Employee Number: ${employee.employeeNumber}\n\n` +
                `This action cannot be undone.`
            );

            if (!confirmed) {
                return;
            }

            await deleteDoc(employeeReference);

            await loadEmployees();

            alert("Employee deleted successfully.");

        });

    });
// =====================================
// Disable / Enable Employee
// =====================================

const disableButtons = document.querySelectorAll(".disable-btn, .enable-btn");

disableButtons.forEach((button) => {

    button.addEventListener("click", async () => {

        const employeeId = button.dataset.id;

        const employeeReference = doc(db, "employees", employeeId);

        const employeeSnapshot = await getDoc(employeeReference);

        if (!employeeSnapshot.exists()) {
            alert("Employee could not be found.");
            return;
        }

        const employee = employeeSnapshot.data();

        await updateDoc(employeeReference, {
            active: !employee.active
        });

        await loadEmployees();

        alert(
            employee.active
                ? "Employee disabled successfully."
                : "Employee enabled successfully."
        );

    });

});
}

loadEmployees();
