import "./admin-session.js";

// =====================================
// R-E-D Attendance
// Employee Management
// =====================================


// =====================================
// Firebase
// =====================================

import {
    db,
    auth
} from "../firebase/firebase.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    applySidebarPermissions,
    protectPage,
    hasPermission
} from "./role-permissions.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================
// Page Elements
// =====================================

const modal =
    document.getElementById("employeeModal");

const addEmployeeButton =
    document.getElementById("addEmployeeButton");

const saveEmployeeButton =
    document.getElementById("saveEmployeeButton");

const closeEmployeeModalButton =
    document.getElementById("closeEmployeeModal");

const cancelEmployeeButton =
    document.getElementById("cancelEmployeeButton");

const employeeForm =
    document.getElementById("employeeForm");

const employeeTableBody =
    document.getElementById("employeeTableBody");

const employeeSearch =
    document.getElementById("employeeSearch");


const employeeNumberInput =
    document.getElementById("employeeNumber");

const employeeNameInput =
    document.getElementById("employeeName");

const employeeRoleInput =
    document.getElementById("employeeRole");

const employeeDepartmentInput =
    document.getElementById("employeeDepartment");

const employeeStartTimeInput =
    document.getElementById("employeeStartTime");

const employeeEndTimeInput =
    document.getElementById("employeeEndTime");

const employeePinInput =
    document.getElementById("employeePin");


const deleteModal =
    document.getElementById("deleteModal");

const deleteMessage =
    document.getElementById("deleteMessage");

const cancelDeleteButton =
    document.getElementById("cancelDeleteButton");

const closeDeleteModalButton =
    document.getElementById("closeDeleteModal");

const confirmDeleteButton =
    document.getElementById("confirmDeleteButton");


const resetPinModal =
    document.getElementById("resetPinModal");

const resetPinEmployeeName =
    document.getElementById("resetPinEmployeeName");

const newEmployeePin =
    document.getElementById("newEmployeePin");

const confirmEmployeePin =
    document.getElementById("confirmEmployeePin");

const closeResetPinModalButton =
    document.getElementById("closeResetPinModal");

const cancelResetPinButton =
    document.getElementById("cancelResetPinButton");

const saveResetPinButton =
    document.getElementById("saveResetPinButton");


const statusModal =
    document.getElementById("statusModal");

const statusModalTitle =
    document.getElementById("statusModalTitle");

const statusModalMessage =
    document.getElementById("statusModalMessage");

const closeStatusModalButton =
    document.getElementById("closeStatusModal");

const cancelStatusButton =
    document.getElementById("cancelStatusButton");

const confirmStatusButton =
    document.getElementById("confirmStatusButton");


const notification =
    document.getElementById("notification");

const notificationMessage =
    document.getElementById("notificationMessage");


const logoutButton =
    document.getElementById("logoutButton");


// =====================================
// Page State
// =====================================

let employees = [];

let organisationDepartments = [];

let organisationEmployeeRoles = [];

let editingEmployeeId = null;

let employeeToDelete = null;

let employeeToResetPin = null;

let employeeToChangeStatus = null;

let newEmployeeStatus = null;


// =====================================
// Initialize Page
// =====================================

initializeEmployeePage();

function initializeEmployeePage() {

    if (!protectPage("employees")) {
    return;
}

applySidebarPermissions();

    if (addEmployeeButton) {

        addEmployeeButton.addEventListener(
            "click",
            openAddEmployeeModal
        );

    }

    if (closeEmployeeModalButton) {

        closeEmployeeModalButton.addEventListener(
            "click",
            closeEmployeeModal
        );

    }

    if (cancelEmployeeButton) {

        cancelEmployeeButton.addEventListener(
            "click",
            closeEmployeeModal
        );

    }

    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (event.target === modal) {
                    closeEmployeeModal();
                }

            }
        );

    }

    if (employeeForm) {

        employeeForm.addEventListener(
            "submit",
            saveEmployee
        );

    }

    if (employeeTableBody) {

        employeeTableBody.addEventListener(
            "click",
            handleEmployeeAction
        );

    }

    if (employeeSearch) {

        employeeSearch.addEventListener(
            "input",
            displayFilteredEmployees
        );

    }

    if (cancelDeleteButton) {

        cancelDeleteButton.addEventListener(
            "click",
            closeDeleteConfirmation
        );

    }

    if (closeDeleteModalButton) {

        closeDeleteModalButton.addEventListener(
            "click",
            closeDeleteConfirmation
        );

    }

    if (confirmDeleteButton) {

        confirmDeleteButton.addEventListener(
            "click",
            deleteSelectedEmployee
        );

    }

    if (cancelResetPinButton) {

        cancelResetPinButton.addEventListener(
            "click",
            closeResetPinConfirmation
        );

    }

    if (closeResetPinModalButton) {

        closeResetPinModalButton.addEventListener(
            "click",
            closeResetPinConfirmation
        );

    }

    if (saveResetPinButton) {

        saveResetPinButton.addEventListener(
            "click",
            saveEmployeePin
        );

    }

    if (cancelStatusButton) {

        cancelStatusButton.addEventListener(
            "click",
            closeStatusConfirmation
        );

    }

    if (closeStatusModalButton) {

        closeStatusModalButton.addEventListener(
            "click",
            closeStatusConfirmation
        );

    }

    if (confirmStatusButton) {

        confirmStatusButton.addEventListener(
            "click",
            saveEmployeeStatus
        );

    }

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutAdministrator
        );

    } else {

        console.error(
            'Logout button not found. Check that employees.html contains id="logoutButton".'
        );

    }

    loadOrganisationStructure();

loadEmployees();

}

// =====================================
// Load Organisation Structure
// =====================================

async function loadOrganisationStructure() {

    try {

        const organisationReference =
            doc(
                db,
                "systemSettings",
                "organisation"
            );

        const organisationSnapshot =
            await getDoc(
                organisationReference
            );

        if (
            !organisationSnapshot.exists()
        ) {

            organisationDepartments = [];
            organisationEmployeeRoles = [];

            populateOrganisationDropdowns();

            return;

        }

        const organisation =
            organisationSnapshot.data();

        organisationDepartments =
            Array.isArray(
                organisation.departments
            )
                ? organisation.departments
                : [];

        organisationEmployeeRoles =
            Array.isArray(
                organisation.employeeRoles
            )
                ? organisation.employeeRoles
                : [];

        organisationDepartments.sort(
            (a, b) =>
                a.localeCompare(b)
        );

        organisationEmployeeRoles.sort(
            (a, b) =>
                a.localeCompare(b)
        );

        populateOrganisationDropdowns();

    } catch (error) {

        console.error(
            "Load organisation structure error:",
            error
        );

        showNotification(
            "⚠️ Employee roles and departments could not be loaded.",
            "warning"
        );

    }

}


// =====================================
// Populate Organisation Dropdowns
// =====================================

function populateOrganisationDropdowns() {

    if (
        employeeRoleInput
    ) {

        const selectedRole =
            employeeRoleInput.value;

        employeeRoleInput.innerHTML = `
            <option value="">
                Select role
            </option>
        `;

        organisationEmployeeRoles.forEach(
            function (role) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    role;

                option.textContent =
                    role;

                employeeRoleInput.appendChild(
                    option
                );

            }
        );

        employeeRoleInput.value =
            selectedRole;

    }

    if (
        employeeDepartmentInput
    ) {

        const selectedDepartment =
            employeeDepartmentInput.value;

        employeeDepartmentInput.innerHTML = `
            <option value="">
                Select department
            </option>
        `;

        organisationDepartments.forEach(
            function (department) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    department;

                option.textContent =
                    department;

                employeeDepartmentInput.appendChild(
                    option
                );

            }
        );

        employeeDepartmentInput.value =
            selectedDepartment;

    }

}


// =====================================
// Notification
// =====================================

function showNotification(
    message,
    type = "success"
) {

    if (
        !notification ||
        !notificationMessage
    ) {

        console.log(message);
        return;

    }

    notificationMessage.textContent =
        message;

    notification.classList.remove(
        "error",
        "warning"
    );

    if (type === "error") {

        notification.classList.add(
            "error"
        );

    }

    if (type === "warning") {

        notification.classList.add(
            "warning"
        );

    }

    notification.classList.add(
        "show"
    );

    setTimeout(
        function () {

            notification.classList.remove(
                "show"
            );

        },
        3000
    );

}


// =====================================
// Audit Log
// =====================================

async function writeAuditLog(
    action,
    employee,
    details = ""
) {

    try {

        const currentUser =
            auth.currentUser;

        let administratorName =
            currentUser?.email ??
            "Unknown Administrator";

        if (currentUser) {

            const administratorReference =
                doc(
                    db,
                    "administrators",
                    currentUser.uid
                );

            const administratorSnapshot =
                await getDoc(
                    administratorReference
                );

            if (
                administratorSnapshot.exists()
            ) {

                const administratorData =
                    administratorSnapshot.data();

                administratorName =
                    administratorData.fullName ||
                    currentUser.email ||
                    "Unknown Administrator";

            }

        }

        await addDoc(
            collection(
                db,
                "auditLog"
            ),
            {
                action,
                employee,
                details,

                administrator:
                    administratorName,

                administratorUid:
                    currentUser?.uid ?? "",

                timestamp:
                    serverTimestamp()
            }
        );

    } catch (error) {

        console.error(
            "Audit log error:",
            error
        );

    }

}


// =====================================
// Open Add Employee Modal
// =====================================

function openAddEmployeeModal() {

    editingEmployeeId =
        null;

    employeeForm.reset();

    saveEmployeeButton.textContent =
        "Save Employee";

    modal.classList.add(
        "active"
    );

}


// =====================================
// Close Employee Modal
// =====================================

function closeEmployeeModal() {

    modal.classList.remove(
        "active"
    );

    employeeForm.reset();

    editingEmployeeId =
        null;

    saveEmployeeButton.textContent =
        "Save Employee";

}


// =====================================
// Save Employee
// =====================================

async function saveEmployee(event) {

    event.preventDefault();

    const employeeNumber =
        employeeNumberInput.value.trim();

    const employeeName =
        employeeNameInput.value.trim();

    const employeeRole =
    employeeRoleInput.value.trim();

const employeeDepartment =
    employeeDepartmentInput.value.trim();

const employeeStartTime =
    employeeStartTimeInput.value.trim();

const employeeEndTime =
    employeeEndTimeInput.value.trim();

const employeePin =
    employeePinInput.value.trim();


   if (
    employeeNumber === "" ||
    employeeName === "" ||
       employeeRole === "" ||
    employeeDepartment === "" ||
    employeeStartTime === "" ||
    employeeEndTime === "" ||
    employeePin === ""
) {

    showNotification(
        "⚠️ Please complete all employee fields.",
        "warning"
    );

    return;
}

    if (
    employeeEndTime <=
    employeeStartTime
) {

    showNotification(
        "⚠️ End Time must be later than Start Time.",
        "warning"
    );

    return;
}

    if (
        !/^\d{4,6}$/.test(
            employeePin
        )
    ) {

        showNotification(
            "⚠️ PIN must contain 4 to 6 numbers.",
            "warning"
        );

        return;

    }


    try {

        saveEmployeeButton.disabled =
            true;

        saveEmployeeButton.textContent =
            editingEmployeeId
                ? "Updating..."
                : "Saving...";


        const duplicateQuery =
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

        const duplicateSnapshot =
            await getDocs(
                duplicateQuery
            );

        const duplicateEmployee =
            duplicateSnapshot.docs.find(
                function (employeeDocument) {

                    return (
                        employeeDocument.id !==
                        editingEmployeeId
                    );

                }
            );

        if (duplicateEmployee) {

            showNotification(
                "⚠️ Employee Number already exists.",
                "warning"
            );

            return;

        }


       if (editingEmployeeId) {

    await updateExistingEmployee(
        employeeNumber,
        employeeName,
        employeeRole,
        employeeDepartment,
        employeeStartTime,
        employeeEndTime,
        employeePin
    );

} else {

    await createNewEmployee(
        employeeNumber,
        employeeName,
        employeeRole,
        employeeDepartment,
        employeeStartTime,
        employeeEndTime,
        employeePin
    );

}
        closeEmployeeModal();

        await loadEmployees();

    } catch (error) {

        console.error(
            "Save employee error:",
            error
        );

        showNotification(
            "❌ Employee could not be saved.",
            "error"
        );

    } finally {

        saveEmployeeButton.disabled =
            false;

        saveEmployeeButton.textContent =
            editingEmployeeId
                ? "Update Employee"
                : "Save Employee";

    }

}


// =====================================
// Create Employee
// =====================================

async function createNewEmployee(
    employeeNumber,
    employeeName,
    employeeRole,
    employeeDepartment,
    employeeStartTime,
    employeeEndTime,
    employeePin
) {

    await addDoc(
        collection(
            db,
            "employees"
        ),
        {
            employeeNumber,

            name:
                employeeName,

            role:
                employeeRole,

            department:
                employeeDepartment,

            startTime:
                employeeStartTime,

            endTime:
                employeeEndTime,

            pin:
                employeePin,

            active:
                true,

            createdAt:
                serverTimestamp()
        }
    );

    await writeAuditLog(
        "Added Employee",
        employeeName,
        `Employee Number: ${employeeNumber}, Role: ${employeeRole}, Department: ${employeeDepartment}, Start Time: ${employeeStartTime}, End Time: ${employeeEndTime}`
    );

    showNotification(
        "✅ Employee added successfully."
    );

}

// =====================================
// Update Employee
// =====================================

async function updateExistingEmployee(
    employeeNumber,
    employeeName,
    employeeRole,
    employeeDepartment,
    employeeStartTime,
    employeeEndTime,
    employeePin
) {

    const employeeReference =
        doc(
            db,
            "employees",
            editingEmployeeId
        );

    const previousEmployeeSnapshot =
        await getDoc(
            employeeReference
        );

    if (
        !previousEmployeeSnapshot.exists()
    ) {

        throw new Error(
            "Employee could not be found."
        );

    }

    const previousEmployee =
        previousEmployeeSnapshot.data();

    await updateDoc(
        employeeReference,
        {
            employeeNumber,

            name:
                employeeName,

            role:
                employeeRole,

            department:
                employeeDepartment,

            startTime:
                employeeStartTime,

            endTime:
                employeeEndTime,

            pin:
                employeePin
        }
    );

    await writeAuditLog(
        "Updated Employee",
        employeeName,
        `Previous: Employee Number: ${previousEmployee.employeeNumber}, Name: ${previousEmployee.name}, Role: ${previousEmployee.role ?? "-"}, Department: ${previousEmployee.department}, Start Time: ${previousEmployee.startTime ?? "-"}, End Time: ${previousEmployee.endTime ?? "-"} | Updated: Employee Number: ${employeeNumber}, Name: ${employeeName}, Role: ${employeeRole}, Department: ${employeeDepartment}, Start Time: ${employeeStartTime}, End Time: ${employeeEndTime}`
    );

    showNotification(
        "✅ Employee updated successfully."
    );

}
// =====================================
// Load Employees
// =====================================

async function loadEmployees() {

    if (!employeeTableBody) {
        return;
    }

    employeeTableBody.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="empty-row"
            >
                Loading employees...
            </td>
        </tr>
    `;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );

        employees =
            snapshot.docs.map(
                function (employeeDocument) {

                    return {
                        id:
                            employeeDocument.id,

                        ...employeeDocument.data()
                    };

                }
            );

        employees.sort(
            function (a, b) {

                return String(
                    a.name ?? ""
                ).localeCompare(
                    String(
                        b.name ?? ""
                    )
                );

            }
        );

        displayFilteredEmployees();

    } catch (error) {

        console.error(
            "Load employees error:",
            error
        );

        employeeTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-row"
                >
                    Employees could not be loaded.
                </td>
            </tr>
        `;

    }

}


// =====================================
// Search Employees
// =====================================

function displayFilteredEmployees() {

    const searchText =
        employeeSearch
            ? employeeSearch.value
                .trim()
                .toLowerCase()
            : "";

    const filteredEmployees =
        employees.filter(
            function (employee) {

                const employeeNumber =
                    String(
                        employee.employeeNumber ?? ""
                    ).toLowerCase();

                const employeeName =
                    String(
                        employee.name ?? ""
                    ).toLowerCase();

                const department =
                    String(
                        employee.department ?? ""
                    ).toLowerCase();

                return (
                    employeeNumber.includes(
                        searchText
                    ) ||
                    employeeName.includes(
                        searchText
                    ) ||
                    department.includes(
                        searchText
                    )
                );

            }
        );

    displayEmployees(
        filteredEmployees
    );

}


// =====================================
// Display Employees
// =====================================

function displayEmployees(employeeList) {

    employeeTableBody.innerHTML =
        "";

    if (employeeList.length === 0) {

        employeeTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-row"
                >
                    No employees found.
                </td>
            </tr>
        `;

        return;

    }

    employeeList.forEach(
        function (employee) {

            const isActive =
                employee.active !== false;

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    ${escapeHtml(
                        employee.employeeNumber ??
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        employee.name ??
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        employee.department ??
                        "-"
                    )}
                </td>

                <td>
                    <span
                        class="administrator-status ${
                            isActive
                                ? "administrator-status-active"
                                : "administrator-status-disabled"
                        }"
                    >
                        ${
                            isActive
                                ? "Active"
                                : "Inactive"
                        }
                    </span>
                </td>

                <td>

                    <button
                        type="button"
                        class="employee-action-btn edit-btn"
                        data-id="${employee.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="employee-action-btn reset-pin-btn"
                        data-id="${employee.id}"
                    >
                        Reset PIN
                    </button>

                    <button
                        type="button"
                        class="employee-action-btn status-btn"
                        data-id="${employee.id}"
                    >
                        ${
                            isActive
                                ? "Disable"
                                : "Enable"
                        }
                    </button>

                    <button
                        type="button"
                        class="employee-action-btn delete-btn"
                        data-id="${employee.id}"
                    >
                        Delete
                    </button>

                </td>
            `;

            employeeTableBody.appendChild(
                row
            );

        }
    );

}


// =====================================
// Handle Employee Actions
// =====================================

function handleEmployeeAction(event) {

    const button =
        event.target.closest(
            "button[data-id]"
        );

    if (!button) {
        return;
    }

    const employeeId =
        button.dataset.id;

    if (
        button.classList.contains(
            "edit-btn"
        )
    ) {

        openEditEmployee(
            employeeId
        );

        return;

    }

    if (
        button.classList.contains(
            "reset-pin-btn"
        )
    ) {

        openResetPinModal(
            employeeId
        );

        return;

    }

    if (
        button.classList.contains(
            "status-btn"
        )
    ) {

        openStatusModal(
            employeeId
        );

        return;

    }

    if (
        button.classList.contains(
            "delete-btn"
        )
    ) {

        openDeleteModal(
            employeeId
        );

    }

}


// =====================================
// Find Employee
// =====================================

function findEmployee(employeeId) {

    return employees.find(
        function (employee) {

            return (
                employee.id ===
                employeeId
            );

        }
    );

}


// =====================================
// Edit Employee
// =====================================

function openEditEmployee(employeeId) {

    const employee =
        findEmployee(
            employeeId
        );

    if (!employee) {

        showNotification(
            "❌ Employee could not be found.",
            "error"
        );

        return;

    }

    editingEmployeeId =
        employeeId;

    employeeNumberInput.value =
        employee.employeeNumber ?? "";

    employeeNameInput.value =
        employee.name ?? "";

   employeeRoleInput.value =
    employee.role ?? "";

employeeDepartmentInput.value =
    employee.department ?? "";

employeeStartTimeInput.value =
    employee.startTime ?? "08:00";
employeeEndTimeInput.value =
    employee.endTime ?? "17:00";

employeePinInput.value =
    employee.pin ?? "";

    saveEmployeeButton.textContent =
        "Update Employee";

    modal.classList.add(
        "active"
    );

}


// =====================================
// Delete Employee
// =====================================

function openDeleteModal(employeeId) {

    const employee =
        findEmployee(
            employeeId
        );

    if (!employee) {
        return;
    }

    employeeToDelete =
        employeeId;

    deleteMessage.textContent =
        `Are you sure you want to delete ${employee.name}?`;

    deleteModal.classList.add(
        "active"
    );

}


function closeDeleteConfirmation() {

    deleteModal.classList.remove(
        "active"
    );

    employeeToDelete =
        null;

}


async function deleteSelectedEmployee() {

    if (!employeeToDelete) {
        return;
    }

    try {

        const employee =
            findEmployee(
                employeeToDelete
            );

        if (!employee) {

            throw new Error(
                "Employee could not be found."
            );

        }

        const employeeReference =
            doc(
                db,
                "employees",
                employeeToDelete
            );

        await writeAuditLog(
            "Deleted Employee",
            employee.name,
            `Employee Number: ${employee.employeeNumber}`
        );

        await deleteDoc(
            employeeReference
        );

        closeDeleteConfirmation();

        await loadEmployees();

        showNotification(
            "✅ Employee deleted successfully."
        );

    } catch (error) {

        console.error(
            "Delete employee error:",
            error
        );

        showNotification(
            "❌ Employee could not be deleted.",
            "error"
        );

    }

}


// =====================================
// Reset Employee PIN
// =====================================

function openResetPinModal(employeeId) {

    const employee =
        findEmployee(
            employeeId
        );

    if (!employee) {
        return;
    }

    employeeToResetPin =
        employeeId;

    resetPinEmployeeName.textContent =
        `Reset PIN for ${employee.name}`;

    newEmployeePin.value =
        "";

    confirmEmployeePin.value =
        "";

    resetPinModal.classList.add(
        "active"
    );

}


function closeResetPinConfirmation() {

    resetPinModal.classList.remove(
        "active"
    );

    employeeToResetPin =
        null;

    newEmployeePin.value =
        "";

    confirmEmployeePin.value =
        "";

}


async function saveEmployeePin() {

    if (!employeeToResetPin) {
        return;
    }

    const pin =
        newEmployeePin.value.trim();

    const confirmedPin =
        confirmEmployeePin.value.trim();

    if (
        !pin ||
        !confirmedPin
    ) {

        showNotification(
            "⚠️ Please enter and confirm the new PIN.",
            "warning"
        );

        return;

    }

    if (
        !/^\d{4,6}$/.test(pin)
    ) {

        showNotification(
            "⚠️ PIN must contain 4 to 6 numbers.",
            "warning"
        );

        return;

    }

    if (pin !== confirmedPin) {

        showNotification(
            "⚠️ The PINs do not match.",
            "warning"
        );

        return;

    }


    try {

        const employee =
            findEmployee(
                employeeToResetPin
            );

        if (!employee) {

            throw new Error(
                "Employee could not be found."
            );

        }

        const employeeReference =
            doc(
                db,
                "employees",
                employeeToResetPin
            );

        await updateDoc(
            employeeReference,
            {
                pin
            }
        );

        await writeAuditLog(
            "Reset PIN",
            employee.name,
            "Employee PIN was reset."
        );

        closeResetPinConfirmation();

        showNotification(
            "✅ Employee PIN reset successfully."
        );

    } catch (error) {

        console.error(
            "Reset PIN error:",
            error
        );

        showNotification(
            "❌ Employee PIN could not be reset.",
            "error"
        );

    }

}


// =====================================
// Employee Status
// =====================================

function openStatusModal(employeeId) {

    const employee =
        findEmployee(
            employeeId
        );

    if (!employee) {
        return;
    }

    const isActive =
        employee.active !== false;

    employeeToChangeStatus =
        employeeId;

    newEmployeeStatus =
        !isActive;

    statusModalTitle.textContent =
        isActive
            ? "Disable Employee"
            : "Enable Employee";

    statusModalMessage.textContent =
        `Are you sure you want to ${
            isActive
                ? "disable"
                : "enable"
        } ${employee.name}?`;

    confirmStatusButton.textContent =
        isActive
            ? "Disable Employee"
            : "Enable Employee";

    statusModal.classList.add(
        "active"
    );

}


function closeStatusConfirmation() {

    statusModal.classList.remove(
        "active"
    );

    employeeToChangeStatus =
        null;

    newEmployeeStatus =
        null;

}


async function saveEmployeeStatus() {

    if (!employeeToChangeStatus) {
        return;
    }

    try {

        const employee =
            findEmployee(
                employeeToChangeStatus
            );

        if (!employee) {

            throw new Error(
                "Employee could not be found."
            );

        }

        const employeeReference =
            doc(
                db,
                "employees",
                employeeToChangeStatus
            );

        await updateDoc(
            employeeReference,
            {
                active:
                    newEmployeeStatus
            }
        );

        await writeAuditLog(
            newEmployeeStatus
                ? "Enabled Employee"
                : "Disabled Employee",

            employee.name,

            `Employee Number: ${employee.employeeNumber}`
        );

        const resultText =
            newEmployeeStatus
                ? "enabled"
                : "disabled";

        closeStatusConfirmation();

        await loadEmployees();

        showNotification(
            `✅ Employee ${resultText} successfully.`
        );

    } catch (error) {

        console.error(
            "Employee status error:",
            error
        );

        showNotification(
            "❌ Unable to update employee status.",
            "error"
        );

    }

}


// =====================================
// Escape HTML
// =====================================

function escapeHtml(value) {

    return String(
        value ?? ""
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


// =====================================
// Administrator Logout
// =====================================

async function logoutAdministrator() {

    try {

        logoutButton.disabled =
            true;

        logoutButton.textContent =
            "Logging out...";

        await signOut(auth);

        sessionStorage.clear();

        window.location.replace(
            "admin-login.html"
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        logoutButton.disabled =
            false;

        logoutButton.textContent =
            "Logout";

        alert(
            "Unable to log out. Please try again."
        );

    }

}
