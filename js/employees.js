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
    updateDoc
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

    try {

        await addDoc(collection(db, "employees"), {
            employeeNumber: employeeNumber,
            name: employeeName,
            department: employeeDepartment,
            pin: employeePin,
            active: true
        });

        employeeForm.reset();
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

    <button class="employee-action-btn disable-btn" data-id="${doc.id}">
        Disable
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
}

loadEmployees();
