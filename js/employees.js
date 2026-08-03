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

const closeEmployeeModal =
    document.getElementById("closeEmployeeModal");

const cancelEmployeeButton =
    document.getElementById("cancelEmployeeButton");

const employeeForm =
    document.getElementById("employeeForm");

const employeeTableBody =
    document.getElementById("employeeTableBody");


const deleteModal =
    document.getElementById("deleteModal");

const deleteMessage =
    document.getElementById("deleteMessage");

const cancelDeleteButton =
    document.getElementById("cancelDeleteButton");

const closeDeleteModal =
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

const closeResetPinModal =
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

const closeStatusModal =
    document.getElementById("closeStatusModal");

const cancelStatusButton =
    document.getElementById("cancelStatusButton");

const confirmStatusButton =
    document.getElementById("confirmStatusButton");


const logoutButton =
    document.getElementById("logoutButton");


// =====================================
// State
// =====================================

let editingEmployeeId = null;

let employeeToDelete = null;

let employeeToResetPin = null;

let employeeToChangeStatus = null;

let newEmployeeStatus = null;


// =====================================
// Notification
// =====================================

function showNotification(
    messageText,
    type = "success"
) {

    const notification =
        document.getElementById(
            "notification"
        );

    const notificationMessage =
        document.getElementById(
            "notificationMessage"
        );

    if (
        !notification ||
        !notificationMessage
    ) {

        console.log(
            "Notification:",
            messageText
        );

        return;

    }

    notificationMessage.textContent =
        messageText;

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
        () => {

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

        let administratorName =
            "Unknown Administrator";

        const currentUser =
            auth.currentUser;

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

            } else {

                administratorName =
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

        console.log(
            "Audit log written successfully."
        );

    } catch (error) {

        console.error(
            "Audit log failed:",
            error
        );

    }

}


// =====================================
// Employee Modal Controls
// =====================================

addEmployeeButton.addEventListener(
    "click",
    () => {

        editingEmployeeId = null;

        employeeForm.reset();

        saveEmployeeButton.textContent =
            "Save Employee";

        modal.classList.add(
            "active"
        );

    }
);


closeEmployeeModal.addEventListener(
    "click",
    closeEmployeeForm
);


cancelEmployeeButton.addEventListener(
    "click",
    closeEmployeeForm
);


modal.addEventListener(
    "click",
    (event) => {

        if (event.target === modal) {

            closeEmployeeForm();

        }

    }
);


function closeEmployeeForm() {

    modal.classList.remove(
        "active"
    );

    employeeForm.reset();

    editingEmployeeId = null;

    saveEmployeeButton.textContent =
        "Save Employee";

}


// =====================================
// Save Employee
// =====================================

employeeForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const employeeNumber =
            document
                .getElementById(
                    "employeeNumber"
                )
                .value
                .trim();

        const employeeName =
            document
                .getElementById(
                    "employeeName"
                )
                .value
                .trim();

        const employeeDepartment =
            document
                .getElementById(
                    "employeeDepartment"
                )
                .value
                .trim();

        const employeePin =
            document
                .getElementById(
                    "employeePin"
                )
                .value
                .trim();


        // =====================================
        // Duplicate Employee Number Check
        // =====================================

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

        const existingEmployees =
            await getDocs(
                employeeQuery
            );

        const duplicateEmployee =
            existingEmployees.docs.find(
                (employeeDocument) =>
                    employeeDocument.id !==
                    editingEmployeeId
            );

        if (duplicateEmployee) {

            showNotification(
                "⚠️ Employee Number already exists.",
                "warning"
            );

            return;

        }


        try {

            const wasEditing =
                editingEmployeeId !== null;


            // =====================================
            // Update Existing Employee
            // =====================================

            if (editingEmployeeId) {

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

                    showNotification(
                        "❌ Employee could not be found.",
                        "error"
                    );

                    return;

                }

                const previousEmployee =
                    previousEmployeeSnapshot.data();

                await updateDoc(
                    employeeReference,
                    {
                        employeeNumber,
                        name:
                            employeeName,

                        department:
                            employeeDepartment,

                        pin:
                            employeePin
                    }
                );

                await writeAuditLog(
                    "Updated Employee",
                    employeeName,
                    `Previous: Employee Number: ${previousEmployee.employeeNumber}, Name: ${previousEmployee.name}, Department: ${previousEmployee.department} | Updated: Employee Number: ${employeeNumber}, Name: ${employeeName}, Department: ${employeeDepartment}`
                );

            }


            // =====================================
            // Add New Employee
            // =====================================

            else {

                await addDoc(
                    collection(
                        db,
                        "employees"
                    ),
                    {
                        employeeNumber,
                        name:
                            employeeName,

                        department:
                            employeeDepartment,

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
                    `Employee Number: ${employeeNumber}`
                );

            }


            closeEmployeeForm();

            await loadEmployees();


            if (wasEditing) {

                showNotification(
                    "✅ Employee updated successfully."
                );

            } else {

                showNotification(
                    "✅ Employee added successfully."
                );

            }


        } catch (error) {

            console.error(
                "Error saving employee:",
                error
            );

            showNotification(
                "❌ Employee could not be saved.",
                "error"
            );

        }

    }
);


// =====================================
// Load Employees
// =====================================

async function loadEmployees() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );

        employeeTableBody.innerHTML =
            "";

        if (snapshot.empty) {

            employeeTableBody.innerHTML = `
                <tr>

                    <td
                        colspan="5"
                        class="empty-row"
                    >
                        No employees have been added yet.
                    </td>

                </tr>
            `;

            return;

        }


        snapshot.forEach(
            (employeeDocument) => {

                const employee =
                    employeeDocument.data();

                const isActive =
                    employee.active !== false;

                employeeTableBody.innerHTML += `
                    <tr>

                        <td>
                            ${employee.employeeNumber ?? "-"}
                        </td>

                        <td>
                            ${employee.name ?? "-"}
                        </td>

                        <td>
                            ${employee.department ?? "-"}
                        </td>

                        <td>
                            ${isActive ? "Active" : "Inactive"}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="employee-action-btn edit-btn"
                                data-id="${employeeDocument.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="employee-action-btn reset-pin-btn"
                                data-id="${employeeDocument.id}"
                            >
                                Reset PIN
                            </button>

                            <button
                                type="button"
                                class="employee-action-btn ${
                                    isActive
                                        ? "disable-btn"
                                        : "enable-btn"
                                }"
                                data-id="${employeeDocument.id}"
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
                                data-id="${employeeDocument.id}"
                            >
                                Delete
                            </button>

                        </td>

                    </tr>
                `;

            }
        );


        attachEmployeeActionEvents();

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
// Attach Employee Action Events
// =====================================

function attachEmployeeActionEvents() {

    attachEditEvents();

    attachResetPinEvents();

    attachDeleteEvents();

    attachStatusEvents();

}


// =====================================
// Edit Employee
// =====================================

function attachEditEvents() {

    const editButtons =
        document.querySelectorAll(
            ".edit-btn"
        );

    editButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const employeeId =
                        button.dataset.id;

                    editingEmployeeId =
                        employeeId;

                    const employeeReference =
                        doc(
                            db,
                            "employees",
                            employeeId
                        );

                    const employeeSnapshot =
                        await getDoc(
                            employeeReference
                        );

                    if (
                        !employeeSnapshot.exists()
                    ) {

                        showNotification(
                            "❌ Employee could not be found.",
                            "error"
                        );

                        return;

                    }

                    const employee =
                        employeeSnapshot.data();

                    document
                        .getElementById(
                            "employeeNumber"
                        )
                        .value =
                        employee.employeeNumber ?? "";

                    document
                        .getElementById(
                            "employeeName"
                        )
                        .value =
                        employee.name ?? "";

                    document
                        .getElementById(
                            "employeeDepartment"
                        )
                        .value =
                        employee.department ?? "";

                    document
                        .getElementById(
                            "employeePin"
                        )
                        .value =
                        employee.pin ?? "";

                    saveEmployeeButton.textContent =
                        "Update Employee";

                    modal.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


// =====================================
// Reset PIN
// =====================================

function attachResetPinEvents() {

    const resetPinButtons =
        document.querySelectorAll(
            ".reset-pin-btn"
        );

    resetPinButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const employeeId =
                        button.dataset.id;

                    const employeeReference =
                        doc(
                            db,
                            "employees",
                            employeeId
                        );

                    const employeeSnapshot =
                        await getDoc(
                            employeeReference
                        );

                    if (
                        !employeeSnapshot.exists()
                    ) {

                        showNotification(
                            "❌ Employee could not be found.",
                            "error"
                        );

                        return;

                    }

                    const employee =
                        employeeSnapshot.data();

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
            );

        }
    );

}


// =====================================
// Delete Employee
// =====================================

function attachDeleteEvents() {

    const deleteButtons =
        document.querySelectorAll(
            ".delete-btn"
        );

    deleteButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const employeeId =
                        button.dataset.id;

                    const employeeReference =
                        doc(
                            db,
                            "employees",
                            employeeId
                        );

                    const employeeSnapshot =
                        await getDoc(
                            employeeReference
                        );

                    if (
                        !employeeSnapshot.exists()
                    ) {

                        showNotification(
                            "❌ Employee could not be found.",
                            "error"
                        );

                        return;

                    }

                    const employee =
                        employeeSnapshot.data();

                    employeeToDelete =
                        employeeId;

                    deleteMessage.textContent =
                        `Are you sure you want to delete ${employee.name}?`;

                    deleteModal.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


// =====================================
// Disable / Enable Employee
// =====================================

function attachStatusEvents() {

    const statusButtons =
        document.querySelectorAll(
            ".disable-btn, .enable-btn"
        );

    statusButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const employeeId =
                        button.dataset.id;

                    const employeeReference =
                        doc(
                            db,
                            "employees",
                            employeeId
                        );

                    const employeeSnapshot =
                        await getDoc(
                            employeeReference
                        );

                    if (
                        !employeeSnapshot.exists()
                    ) {

                        showNotification(
                            "❌ Employee could not be found.",
                            "error"
                        );

                        return;

                    }

                    const employee =
                        employeeSnapshot.data();

                    const isCurrentlyActive =
                        employee.active !== false;

                    employeeToChangeStatus =
                        employeeId;

                    newEmployeeStatus =
                        !isCurrentlyActive;


                    if (isCurrentlyActive) {

                        statusModalTitle.textContent =
                            "Disable Employee";

                        statusModalMessage.textContent =
                            `Are you sure you want to disable ${employee.name}?`;

                        confirmStatusButton.textContent =
                            "Disable Employee";

                    } else {

                        statusModalTitle.textContent =
                            "Enable Employee";

                        statusModalMessage.textContent =
                            `Are you sure you want to enable ${employee.name}?`;

                        confirmStatusButton.textContent =
                            "Enable Employee";

                    }

                    statusModal.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


// =====================================
// Delete Confirmation
// =====================================

function closeDeleteConfirmation() {

    deleteModal.classList.remove(
        "active"
    );

    employeeToDelete = null;

}


cancelDeleteButton.addEventListener(
    "click",
    closeDeleteConfirmation
);


closeDeleteModal.addEventListener(
    "click",
    closeDeleteConfirmation
);


confirmDeleteButton.addEventListener(
    "click",
    async () => {

        if (!employeeToDelete) {
            return;
        }

        try {

            const employeeReference =
                doc(
                    db,
                    "employees",
                    employeeToDelete
                );

            const employeeSnapshot =
                await getDoc(
                    employeeReference
                );

            if (
                !employeeSnapshot.exists()
            ) {

                showNotification(
                    "❌ Employee could not be found.",
                    "error"
                );

                return;

            }

            const employee =
                employeeSnapshot.data();

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
                "Error deleting employee:",
                error
            );

            showNotification(
                "❌ Employee could not be deleted.",
                "error"
            );

        }

    }
);


// =====================================
// Reset PIN Confirmation
// =====================================

function closeResetPinConfirmation() {

    resetPinModal.classList.remove(
        "active"
    );

    employeeToResetPin = null;

    newEmployeePin.value = "";

    confirmEmployeePin.value = "";

}


cancelResetPinButton.addEventListener(
    "click",
    closeResetPinConfirmation
);


closeResetPinModal.addEventListener(
    "click",
    closeResetPinConfirmation
);


saveResetPinButton.addEventListener(
    "click",
    async () => {

        const newPin =
            newEmployeePin.value.trim();

        const confirmPin =
            confirmEmployeePin.value.trim();


        if (!employeeToResetPin) {
            return;
        }


        if (
            !newPin ||
            !confirmPin
        ) {

            showNotification(
                "⚠️ Please enter and confirm the new PIN.",
                "warning"
            );

            return;

        }


        if (
            !/^\d{4,6}$/.test(
                newPin
            )
        ) {

            showNotification(
                "⚠️ PIN must contain 4 to 6 numbers.",
                "warning"
            );

            return;

        }


        if (
            newPin !== confirmPin
        ) {

            showNotification(
                "⚠️ The PINs do not match.",
                "warning"
            );

            return;

        }


        try {

            const employeeReference =
                doc(
                    db,
                    "employees",
                    employeeToResetPin
                );

            const employeeSnapshot =
                await getDoc(
                    employeeReference
                );

            if (
                !employeeSnapshot.exists()
            ) {

                showNotification(
                    "❌ Employee could not be found.",
                    "error"
                );

                return;

            }

            const employee =
                employeeSnapshot.data();

            await updateDoc(
                employeeReference,
                {
                    pin:
                        newPin
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
                "Error resetting employee PIN:",
                error
            );

            showNotification(
                "❌ Employee PIN could not be reset.",
                "error"
            );

        }

    }
);


// =====================================
// Status Confirmation
// =====================================

function closeStatusConfirmation() {

    statusModal.classList.remove(
        "active"
    );

    employeeToChangeStatus =
        null;

    newEmployeeStatus =
        null;

}


cancelStatusButton.addEventListener(
    "click",
    closeStatusConfirmation
);


closeStatusModal.addEventListener(
    "click",
    closeStatusConfirmation
);


confirmStatusButton.addEventListener(
    "click",
    async () => {

        if (!employeeToChangeStatus) {
            return;
        }

        try {

            const employeeReference =
                doc(
                    db,
                    "employees",
                    employeeToChangeStatus
                );

            const employeeSnapshot =
                await getDoc(
                    employeeReference
                );

            if (
                !employeeSnapshot.exists()
            ) {

                showNotification(
                    "❌ Employee could not be found.",
                    "error"
                );

                return;

            }

            const employee =
                employeeSnapshot.data();

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

            closeStatusConfirmation();

            await loadEmployees();

            showNotification(
                `✅ Employee ${
                    newEmployeeStatus
                        ? "enabled"
                        : "disabled"
                } successfully.`
            );

        } catch (error) {

            console.error(
                "Error updating employee status:",
                error
            );

            showNotification(
                "❌ Unable to update employee status.",
                "error"
            );

        }

    }
);


// =====================================
// Administrator Logout
// =====================================

async function logoutAdministrator() {

    try {

        await signOut(auth);

        sessionStorage.clear();

        window.location.href =
            "admin-login.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}


// =====================================
// Logout Event
// =====================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logoutAdministrator
    );

}


// =====================================
// Start Employee Management
// =====================================

loadEmployees();
