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
    auth,
    firebaseConfig
} from "../firebase/firebase.js";

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    signOut,
    deleteUser,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updatePassword,
    updateEmail
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
// Secondary Firebase App
// Used for employee Auth account creation
// without signing the administrator out.
// =====================================

const employeeAuthApp =
    initializeApp(
        firebaseConfig,
        "employee-auth"
    );

const employeeAuth =
    getAuth(
        employeeAuthApp
    );

    // =====================================
// Employee Authentication Helpers
// =====================================

function getEmployeeAuthEmail(
    employeeNumber
) {

    return `${String(
        employeeNumber ?? ""
    ).trim()}@attendance.local`;

}


async function clearEmployeeAuthSession() {

    try {

        if (
            employeeAuth.currentUser
        ) {

            await signOut(
                employeeAuth
            );

        }

    } catch (
        error
    ) {

        console.error(
            "Employee Auth sign-out error:",
            error
        );

    }

}


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

    const employeeWorkArrangementInput =
    document.getElementById(
        "employeeWorkArrangement"
    );

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

    const attendanceProfileModal =
    document.getElementById(
        "attendanceProfileModal"
    );

const attendanceProfileName =
    document.getElementById(
        "attendanceProfileName"
    );

const attendanceProfileDetails =
    document.getElementById(
        "attendanceProfileDetails"
    );

const closeAttendanceProfileModalButton =
    document.getElementById(
        "closeAttendanceProfileModal"
    );

const closeAttendanceProfileButton =
    document.getElementById(
        "closeAttendanceProfileButton"
    );

const profileAttendanceHistory =
    document.getElementById(
        "profileAttendanceHistory"
    );

    const profileAttendanceRate =
    document.getElementById(
        "profileAttendanceRate"
    );

const profileAverageHours =
    document.getElementById(
        "profileAverageHours"
    );

const profileLateCount =
    document.getElementById(
        "profileLateCount"
    );

const profileAbsentCount =
    document.getElementById(
        "profileAbsentCount"
    );

const profileEarlyExitCount =
    document.getElementById(
        "profileEarlyExitCount"
    );

const profileTotalHours =
    document.getElementById(
        "profileTotalHours"
    );

const profilePerformanceStatus =
    document.getElementById(
        "profilePerformanceStatus"
    );

const profilePerformanceReasons =
    document.getElementById(
        "profilePerformanceReasons"
    );

    const attendanceProfilePeriod =
    document.getElementById(
        "attendanceProfilePeriod"
    );

const profileExpectedHours =
    document.getElementById(
        "profileExpectedHours"
    );

    const profileHoursBalance =
    document.getElementById(
        "profileHoursBalance"
    );


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

let currentAttendanceProfileRecords = [];

let currentAttendanceProfileEmployee =
    null;

    let standardWorkStartTime =
    "08:00";

let unpaidBreakMinutes =
    30;

    let publicHolidays =
    [];

    let automaticPublicHolidays =
    [];


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

   

    if (
    attendanceProfilePeriod
) {

    attendanceProfilePeriod.addEventListener(
        "change",
        function () {

            if (
                !currentAttendanceProfileEmployee
            ) {

                return;

            }

            refreshAttendanceProfile();

        }
    );

}

    if (
    closeAttendanceProfileModalButton
) {

    closeAttendanceProfileModalButton.addEventListener(
        "click",
        closeAttendanceProfile
    );

}

if (
    closeAttendanceProfileButton
) {

    closeAttendanceProfileButton.addEventListener(
        "click",
        closeAttendanceProfile
    );

}

if (
    attendanceProfileModal
) {

    attendanceProfileModal.addEventListener(
        "click",
        function (
            event
        ) {

            if (
                event.target ===
                attendanceProfileModal
            ) {

                closeAttendanceProfile();

            }

        }
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

loadEmployeeAttendanceSettings();

loadEmployeePublicHolidays();

loadEmployeeAutomaticPublicHolidays();

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

const employeeWorkArrangement =
    employeeWorkArrangementInput.value.trim();

const employeePin =
    employeePinInput.value.trim();


   if (
    employeeNumber === "" ||
    employeeName === "" ||
       employeeRole === "" ||
    employeeDepartment === "" ||
    employeeStartTime === "" ||
    employeeEndTime === "" ||
    employeeWorkArrangement === "" ||
    employeePin === ""
) {

    showNotification(
        "Please complete all employee fields.",
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
    !/^\d{6}$/.test(
        employeePin
    )
) {

    showNotification(
        "⚠️ PIN must contain exactly 6 numbers.",
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
    employeeWorkArrangement,
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
    employeeWorkArrangement,
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
    employeeWorkArrangement,
    employeePin
) {

    // =====================================
    // Hidden Employee Auth Identity
    // =====================================

    const employeeAuthEmail =
        `${employeeNumber}@attendance.local`;

    let employeeAuthUser =
        null;


    try {

        // =====================================
        // Create Firebase Auth Account
        // =====================================

        const userCredential =
            await createUserWithEmailAndPassword(
                employeeAuth,
                employeeAuthEmail,
                employeePin
            );

        employeeAuthUser =
            userCredential.user;


        // =====================================
        // Create Employee Firestore Record
        // =====================================

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

                workArrangement:
                    employeeWorkArrangement,

                // Firebase Auth UID links the
                // employee record to the hidden
                // authentication account.

                authUid:
    employeeAuthUser.uid,

pin:
    employeePin,

active:
    true,

                createdAt:
                    serverTimestamp()
            }
        );


        // =====================================
        // Audit Log
        // =====================================

        await writeAuditLog(
            "Added Employee",
            employeeName,
            `Employee Number: ${employeeNumber}, Role: ${employeeRole}, Department: ${employeeDepartment}, Start Time: ${employeeStartTime}, End Time: ${employeeEndTime}`
        );


        showNotification(
            "✅ Employee added successfully."
        );


    } catch (error) {

        // =====================================
        // Roll Back Auth Account
        // =====================================

        if (
            employeeAuthUser
        ) {

            try {

                await deleteUser(
                    employeeAuthUser
                );

            } catch (
                cleanupError
            ) {

                console.error(
                    "Employee Auth cleanup error:",
                    cleanupError
                );

            }

        }

        console.error(
            "Create employee error:",
            error
        );

        throw error;


    } finally {

        // =====================================
        // Clear Secondary Auth Session
        // =====================================

        try {

            await signOut(
                employeeAuth
            );

        } catch (
            signOutError
        ) {

            console.error(
                "Employee Auth sign-out error:",
                signOutError
            );

        }

    }

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
    employeeWorkArrangement,
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

    const previousEmployeeNumber =
        String(
            previousEmployee.employeeNumber ??
            ""
        ).trim();

    const previousPin =
        String(
            previousEmployee.pin ??
            ""
        ).trim();

    await clearEmployeeAuthSession();

    try {

        let employeeAuthUser =
            null;

        if (
            previousEmployee.authUid
        ) {

            const userCredential =
                await signInWithEmailAndPassword(
                    employeeAuth,
                    getEmployeeAuthEmail(
                        previousEmployeeNumber
                    ),
                    previousPin
                );

            employeeAuthUser =
                userCredential.user;

            if (
                employeeAuthUser.uid !==
                previousEmployee.authUid
            ) {

                throw new Error(
                    "Employee authentication account does not match the employee record."
                );

            }

            if (
                previousEmployeeNumber !==
                employeeNumber
            ) {

                await updateEmail(
                    employeeAuthUser,
                    getEmployeeAuthEmail(
                        employeeNumber
                    )
                );

            }

            if (
                previousPin !==
                employeePin
            ) {

                await updatePassword(
                    employeeAuthUser,
                    employeePin
                );

            }

        } else {

            const userCredential =
                await createUserWithEmailAndPassword(
                    employeeAuth,
                    getEmployeeAuthEmail(
                        employeeNumber
                    ),
                    employeePin
                );

            employeeAuthUser =
                userCredential.user;

        }

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

                workArrangement:
                    employeeWorkArrangement,

                pin:
                    employeePin,

                authUid:
                    employeeAuthUser.uid
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

    } finally {

        await clearEmployeeAuthSession();

    }

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
                colspan="6"
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
                    colspan="6"
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
                    colspan="6"
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
        employee.role ??
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
    class="employee-action-btn profile-btn"
    data-id="${employee.id}"
>
    Profile
</button>

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
    class="employee-action-btn reset-device-btn"
    data-id="${employee.id}"
>
    Reset Device
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
        "profile-btn"
    )
) {

    openAttendanceProfile(
        employeeId
    );

    return;

}

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

    // =====================================
// Reset Registered Device
// =====================================

    if (
    button.classList.contains(
        "reset-device-btn"
    )
) {

    resetEmployeeDevice(
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
// Reset Employee Registered Device
// =====================================

async function resetEmployeeDevice(
    employeeId
) {

    const employee =
        findEmployee(
            employeeId
        );

    if (
        !employee
    ) {

        showNotification(
            "❌ Employee could not be found.",
            "error"
        );

        return;

    }

    const confirmed =
        window.confirm(
            `Reset the registered device for ${employee.name ?? "this employee"}?\n\n`
            +
            "They will need to register their device again the next time they scan the attendance QR code."
        );

    if (
        !confirmed
    ) {

        return;

    }

    try {

        const employeeNumber =
            String(
                employee.employeeNumber ??
                ""
            ).trim();

        if (
            !employeeNumber
        ) {

            throw new Error(
                "Employee number is missing."
            );

        }

        const registrationReference =
            doc(
                db,
                "employeeDeviceRegistrations",
                employeeNumber
            );

        await deleteDoc(
            registrationReference
        );

        await writeAuditLog(
            "Reset Employee Device",
            employee.name ?? employeeNumber,
            `Registered device reset for Employee Number: ${employeeNumber}`
        );

        showNotification(
            "✅ Registered device reset successfully."
        );

    } catch (
        error
    ) {

        console.error(
            "Reset employee device error:",
            error
        );

        showNotification(
            "❌ Registered device could not be reset.",
            "error"
        );

    }

}

// =====================================
// Load Attendance Settings
// =====================================

async function loadEmployeeAttendanceSettings() {

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

            return;

        }


        const settings =
            settingsSnapshot.data();


        standardWorkStartTime =
            String(
                settings.standardStartTime ??
                "08:00"
            ).trim();


        unpaidBreakMinutes =
            Number(
                settings.unpaidBreakMinutes ??
                30
            );


        if (
            !Number.isFinite(
                unpaidBreakMinutes
            )
            ||
            unpaidBreakMinutes <
            0
        ) {

            unpaidBreakMinutes =
                30;

        }


    } catch (
        error
    ) {

        console.error(
            "Unable to load attendance settings:",
            error
        );

        standardWorkStartTime =
            "08:00";

        unpaidBreakMinutes =
            30;

    }

}

 // =====================================
// Load Public Holidays
// =====================================

async function loadEmployeePublicHolidays() {

    try {

        const holidaysReference =
            doc(
                db,
                "systemSettings",
                "holidays"
            );

        const holidaysSnapshot =
            await getDoc(
                holidaysReference
            );

        if (
            !holidaysSnapshot.exists()
        ) {

            publicHolidays =
                [];

            return;

        }

        const holidaysData =
            holidaysSnapshot.data();

        publicHolidays =
            Array.isArray(
                holidaysData.publicHolidays
            )
                ?
                holidaysData.publicHolidays
                :
                [];

    } catch (
        error
    ) {

        console.error(
            "Unable to load public holidays:",
            error
        );

        publicHolidays =
            [];

    }

}

// =====================================
// Load Automatic South African Holidays
// =====================================

async function loadEmployeeAutomaticPublicHolidays() {

    try {

        const automaticReference =
            doc(
                db,
                "systemSettings",
                "automaticHolidays"
            );

        const automaticSnapshot =
            await getDoc(
                automaticReference
            );

        if (
            !automaticSnapshot.exists()
        ) {

            automaticPublicHolidays =
                [];

            return;

        }

        const automaticData =
            automaticSnapshot.data();

        automaticPublicHolidays =
            Array.isArray(
                automaticData.holidays
            )
                ?
                automaticData.holidays
                :
                [];

    } catch (
        error
    ) {

        console.error(
            "Unable to load automatic public holidays:",
            error
        );

        automaticPublicHolidays =
            [];

    }

}

// =====================================
// Check Public Holiday
// Manual + Automatic + Sunday Rule
// =====================================

function isPublicHoliday(
    date
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

    const dateKey =
        `${year}-${month}-${day}`;

    const monthDay =
        `${month}-${day}`;


    // =====================================
    // Combine Manual + Automatic Holidays
    // =====================================

    const allPublicHolidays =
        [
            ...publicHolidays,
            ...automaticPublicHolidays
        ];


    // =====================================
    // Check Direct Holiday
    // =====================================

    const directHoliday =
        allPublicHolidays.some(
            function (
                holiday
            ) {

                const holidayDate =
                    String(
                        holiday.date ??
                        ""
                    );


                // Manual recurring holidays

                if (
                    holiday.recurring ===
                    true
                ) {

                    return (
                        holidayDate.slice(
                            5
                        ) ===
                        monthDay
                    );

                }


                // Automatic holidays and
                // non-recurring manual holidays

                return (
                    holidayDate ===
                    dateKey
                );

            }
        );


    if (
        directHoliday
    ) {

        return true;

    }


    // =====================================
    // South African Sunday -> Monday Rule
    // =====================================

    if (
        date.getDay() ===
        1
    ) {

        const previousDay =
            new Date(
                date
            );

        previousDay.setDate(
            previousDay.getDate() -
            1
        );


        const previousYear =
            previousDay.getFullYear();

        const previousMonth =
            String(
                previousDay.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const previousDate =
            String(
                previousDay.getDate()
            ).padStart(
                2,
                "0"
            );


        const previousDateKey =
            `${previousYear}-${previousMonth}-${previousDate}`;

        const previousMonthDay =
            `${previousMonth}-${previousDate}`;


        const sundayWasPublicHoliday =
            allPublicHolidays.some(
                function (
                    holiday
                ) {

                    const holidayDate =
                        String(
                            holiday.date ??
                            ""
                        );


                    if (
                        holiday.recurring ===
                        true
                    ) {

                        return (
                            holidayDate.slice(
                                5
                            ) ===
                            previousMonthDay
                        );

                    }


                    return (
                        holidayDate ===
                        previousDateKey
                    );

                }
            );


        if (
            sundayWasPublicHoliday
        ) {

            return true;

        }

    }


    return false;

}

// =====================================
// Employee Attendance Profile
// =====================================

async function openAttendanceProfile(
    employeeId
) {

    const employee =
        findEmployee(
            employeeId
        );

    if (
        !employee
    ) {

        showNotification(
            "❌ Employee could not be found.",
            "error"
        );

        return;

    }

    currentAttendanceProfileEmployee =
    employee;

attendanceProfilePeriod.value =
    "this-week";


    attendanceProfileName.textContent =
        employee.name ??
        "Employee Attendance Profile";

    attendanceProfileDetails.textContent =
        `${employee.employeeNumber ?? "-"} • ${employee.department ?? "Unassigned"} • ${employee.role ?? "-"}`;


    profileAttendanceHistory.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="empty-row"
            >
                Loading attendance history...
            </td>
        </tr>
    `;


    attendanceProfileModal.classList.add(
        "active"
    );


    try {

        const attendanceQuery =
            query(
                collection(
                    db,
                    "attendance"
                ),
                where(
                    "employeeNumber",
                    "==",
                    employee.employeeNumber
                )
            );

        const attendanceSnapshot =
            await getDocs(
                attendanceQuery
            );

        const attendanceRecords =
            attendanceSnapshot.docs.map(
                function (
                    attendanceDocument
                ) {

                    return {

                        id:
                            attendanceDocument.id,

                        ...attendanceDocument.data()

                    };

                }
            );


        attendanceRecords.sort(
            function (
                firstRecord,
                secondRecord
            ) {

                return String(
                    secondRecord.dateKey ??
                    secondRecord.date ??
                    ""
                ).localeCompare(
                    String(
                        firstRecord.dateKey ??
                        firstRecord.date ??
                        ""
                    )
                );

            }
        );


        currentAttendanceProfileRecords =
    attendanceRecords;

refreshAttendanceProfile();

    } catch (
        error
    ) {

        console.error(
            "Attendance profile error:",
            error
        );

        profileAttendanceHistory.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-row"
                >
                    Attendance history could not be loaded.
                </td>
            </tr>
        `;

    }

}

// =====================================
// Refresh Attendance Profile
// =====================================

function refreshAttendanceProfile() {

    if (
        !currentAttendanceProfileEmployee
    ) {

        return;

    }


    const selectedPeriod =
        attendanceProfilePeriod.value;


    const filteredRecords =
        filterAttendanceProfileRecords(
            currentAttendanceProfileRecords,
            selectedPeriod
        );


    displayAttendanceProfileHistory(
        filteredRecords.slice(
            0,
            10
        )
    );


    updateAttendanceProfileSummary(
        filteredRecords
    );

}

// =====================================
// Calculate Profile Expected Minutes
// =====================================

function calculateProfileExpectedMinutes() {

    if (
        !currentAttendanceProfileEmployee
        ||
        !attendanceProfilePeriod
    ) {

        return 0;

    }


    // =====================================
    // Employee Schedule
    // =====================================

    const employee =
        currentAttendanceProfileEmployee;


    const startTime =
        String(
            employee.startTime ??
            "08:00"
        );


    const endTime =
        String(
            employee.endTime ??
            "17:00"
        );


    const startParts =
        startTime
            .split(":")
            .map(Number);


    const endParts =
        endTime
            .split(":")
            .map(Number);


    if (
        startParts.length <
        2
        ||
        endParts.length <
        2
        ||
        startParts.some(
            Number.isNaN
        )
        ||
        endParts.some(
            Number.isNaN
        )
    ) {

        return 0;

    }


    const dailyStartMinutes =
        (
            startParts[0] *
            60
        )
        +
        startParts[1];


    const dailyEndMinutes =
        (
            endParts[0] *
            60
        )
        +
        endParts[1];


    const elapsedScheduledMinutes =
        dailyEndMinutes -
        dailyStartMinutes;


    const scheduledMinutesPerDay =
        Math.max(
            0,
            elapsedScheduledMinutes -
            unpaidBreakMinutes
        );


    if (
        scheduledMinutesPerDay <=
        0
    ) {

        return 0;

    }


    // =====================================
    // Selected Profile Period
    // =====================================

    const period =
        attendanceProfilePeriod.value;


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    let periodStart =
        new Date(
            today
        );


    let periodEnd =
        new Date(
            today
        );


    switch (
        period
    ) {


        // =====================================
        // This Week
        // =====================================

        case "this-week": {

            const day =
                today.getDay();


            const daysSinceMonday =
                day ===
                0
                    ?
                    6
                    :
                    day -
                    1;


            periodStart =
                new Date(
                    today
                );


            periodStart.setDate(
                today.getDate() -
                daysSinceMonday
            );


            periodStart.setHours(
                0,
                0,
                0,
                0
            );


            periodEnd =
                new Date(
                    periodStart
                );


            periodEnd.setDate(
                periodStart.getDate() +
                6
            );


            periodEnd.setHours(
                23,
                59,
                59,
                999
            );


            break;

        }


        // =====================================
        // This Month
        // =====================================

        case "this-month": {

            periodStart =
                new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                );


            break;

        }


        // =====================================
        // Last Month
        // =====================================

        case "last-month": {

            periodStart =
                new Date(
                    today.getFullYear(),
                    today.getMonth() -
                    1,
                    1
                );


            periodEnd =
                new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    0
                );


            break;

        }


        // =====================================
        // Last 3 Months
        // =====================================

        case "last-3-months": {

            periodStart =
                new Date(
                    today
                );


            periodStart.setMonth(
                periodStart.getMonth() -
                3
            );


            break;

        }


        // =====================================
        // This Year
        // =====================================

        case "this-year": {

            periodStart =
                new Date(
                    today.getFullYear(),
                    0,
                    1
                );


            break;

        }


        // =====================================
        // Last 12 Months
        // =====================================

        case "last-12-months": {

            periodStart =
                new Date(
                    today
                );


            periodStart.setFullYear(
                periodStart.getFullYear() -
                1
            );


            break;

        }


        // =====================================
        // All Time
        // =====================================

        case "all-time": {

            /*
                We cannot reliably calculate
                all-time expected hours without
                an employee employment/start date.
            */

            if (
                profileExpectedHours
            ) {

                profileExpectedHours.textContent =
                    "Expected hours unavailable";

            }


            return 0;

        }

    }

   // =====================================
// Only Count Completed Working Days
// =====================================

const todayStart =
    new Date();

todayStart.setHours(
    0,
    0,
    0,
    0
);


// For current/live periods, do not count
// today until the working day is complete.

const currentPeriods =
    [
        "this-week",
        "this-month",
        "last-3-months",
        "this-year",
        "last-12-months"
    ];


if (
    currentPeriods.includes(
        period
    )
) {

    const yesterdayEnd =
        new Date(
            todayStart
        );

    yesterdayEnd.setDate(
        yesterdayEnd.getDate() -
        1
    );

    yesterdayEnd.setHours(
        23,
        59,
        59,
        999
    );


    if (
        periodEnd >
        yesterdayEnd
    ) {

        periodEnd =
            yesterdayEnd;

    }

}


    // =====================================
    // Leave Statuses
    // =====================================

    const leaveStatuses =
        [
            "Annual Leave",
            "Sick Leave",
            "Family Responsibility Leave",
            "Maternity Leave",
            "Unpaid Leave"
        ];


    // =====================================
    // Calculate Expected Minutes
    // =====================================

    let totalExpectedMinutes =
        0;


    const currentDate =
        new Date(
            periodStart
        );


    while (
        currentDate <=
        periodEnd
    ) {

        const dayOfWeek =
            currentDate.getDay();


        // =====================================
        // Weekend Check
        // =====================================

        const isWeekday =
            dayOfWeek !==
            0
            &&
            dayOfWeek !==
            6;


        if (
            !isWeekday
        ) {

            currentDate.setDate(
                currentDate.getDate() +
                1
            );

            continue;

        }


        // =====================================
        // Public Holiday Check
        // =====================================

        if (
            isPublicHoliday(
                currentDate
            )
        ) {

            currentDate.setDate(
                currentDate.getDate() +
                1
            );

            continue;

        }


        // =====================================
        // Date Key
        // =====================================

        const year =
            currentDate.getFullYear();


        const month =
            String(
                currentDate.getMonth() +
                1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                currentDate.getDate()
            ).padStart(
                2,
                "0"
            );


        const dateKey =
            `${year}-${month}-${day}`;


        // =====================================
        // Find Attendance Record For Day
        // =====================================

        const attendanceRecord =
            currentAttendanceProfileRecords.find(
                function (
                    record
                ) {

                    const recordDate =
                        record.dateKey ??
                        record.date ??
                        "";


                    return (
                        String(
                            recordDate
                        ) ===
                        dateKey
                    );

                }
            );


        // =====================================
        // Normal Working Day
        // =====================================

        if (
            !attendanceRecord
        ) {

            totalExpectedMinutes +=
                scheduledMinutesPerDay;


            currentDate.setDate(
                currentDate.getDate() +
                1
            );


            continue;

        }


        const attendanceStatus =
            String(
                attendanceRecord.status ??
                ""
            ).trim();


        const leaveDuration =
            String(
                attendanceRecord.leaveDuration ??
                ""
            ).trim();


        const leaveTime =
            String(
                attendanceRecord.leaveTime ??
                ""
            ).trim();


        // =====================================
        // Not A Leave Record
        // =====================================

        if (
            !leaveStatuses.includes(
                attendanceStatus
            )
        ) {

            totalExpectedMinutes +=
                scheduledMinutesPerDay;


            currentDate.setDate(
                currentDate.getDate() +
                1
            );


            continue;

        }


        // =====================================
        // Full Day Leave
        // =====================================

        if (
            leaveDuration ===
            "full-day"
        ) {

            /*
                Full-day leave removes the
                employee's expected working
                requirement for this day.
            */

            currentDate.setDate(
                currentDate.getDate() +
                1
            );


            continue;

        }


        // =====================================
        // Half Day Leave
        // =====================================

        if (
            leaveDuration ===
            "half-day"
        ) {

            totalExpectedMinutes +=
                Math.round(
                    scheduledMinutesPerDay /
                    2
                );


            currentDate.setDate(
                currentDate.getDate() +
                1
            );


            continue;

        }


        // =====================================
        // Custom Time Leave
        // =====================================

        if (
            leaveDuration ===
            "custom"
            &&
            leaveTime
        ) {

            const leaveTimeParts =
                leaveTime
                    .split(":")
                    .map(Number);


            if (
                leaveTimeParts.length >=
                2
                &&
                Number.isFinite(
                    leaveTimeParts[0]
                )
                &&
                Number.isFinite(
                    leaveTimeParts[1]
                )
            ) {

                const leaveTimeMinutes =
                    (
                        leaveTimeParts[0] *
                        60
                    )
                    +
                    leaveTimeParts[1];


                let customExpectedMinutes =
                    leaveTimeMinutes -
                    dailyStartMinutes;


                customExpectedMinutes =
                    Math.max(
                        0,
                        customExpectedMinutes
                    );


                // =====================================
                // Deduct Break For 6+ Hours
                // =====================================

                if (
                    customExpectedMinutes >=
                    360
                ) {

                    customExpectedMinutes =
                        Math.max(
                            0,
                            customExpectedMinutes -
                            unpaidBreakMinutes
                        );

                }


                // Never exceed a full scheduled day

                customExpectedMinutes =
                    Math.min(
                        scheduledMinutesPerDay,
                        customExpectedMinutes
                    );


                totalExpectedMinutes +=
                    customExpectedMinutes;


                currentDate.setDate(
                    currentDate.getDate() +
                    1
                );


                continue;

            }

        }


        // =====================================
        // Legacy / Missing Duration
        // =====================================

        /*
            Existing leave records created before
            Leave Duration was added should not
            accidentally reduce expected hours.

            Until they are updated, treat them as
            a normal scheduled working day.
        */

        totalExpectedMinutes +=
            scheduledMinutesPerDay;


        currentDate.setDate(
            currentDate.getDate() +
            1
        );

    }


    return totalExpectedMinutes;

}

// =====================================
// Filter Attendance Profile Records
// =====================================

function filterAttendanceProfileRecords(
    records,
    selectedPeriod
) {

    if (
        selectedPeriod ===
        "all-time"
    ) {

        return records;

    }


    const today =
        new Date();

    today.setHours(
        23,
        59,
        59,
        999
    );


    let startDate =
        new Date(
            today
        );

    let endDate =
        new Date(
            today
        );


    switch (
        selectedPeriod
    ) {


        // =====================================
        // This Week
        // =====================================

        case "this-week": {

            const currentDay =
                today.getDay();

            const daysSinceMonday =
                currentDay ===
                0
                    ?
                    6
                    :
                    currentDay -
                    1;

            startDate =
                new Date(
                    today
                );

            startDate.setDate(
                today.getDate()
                -
                daysSinceMonday
            );

            startDate.setHours(
                0,
                0,
                0,
                0
            );

            break;

        }


        // =====================================
        // This Month
        // =====================================

        case "this-month": {

            startDate =
                new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                );

            break;

        }


        // =====================================
        // Last Month
        // =====================================

        case "last-month": {

            startDate =
                new Date(
                    today.getFullYear(),
                    today.getMonth() -
                    1,
                    1
                );

            endDate =
                new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    0,
                    23,
                    59,
                    59,
                    999
                );

            break;

        }


        // =====================================
        // Last 3 Months
        // =====================================

        case "last-3-months": {

            startDate =
                new Date(
                    today
                );

            startDate.setMonth(
                startDate.getMonth() -
                3
            );

            startDate.setHours(
                0,
                0,
                0,
                0
            );

            break;

        }


        // =====================================
        // This Year
        // =====================================

        case "this-year": {

            startDate =
                new Date(
                    today.getFullYear(),
                    0,
                    1
                );

            break;

        }


        // =====================================
        // Last 12 Months
        // =====================================

        case "last-12-months": {

            startDate =
                new Date(
                    today
                );

            startDate.setFullYear(
                startDate.getFullYear() -
                1
            );

            startDate.setHours(
                0,
                0,
                0,
                0
            );

            break;

        }


        default: {

            return records;

        }

    }


    return records.filter(
        function (
            record
        ) {

            const dateKey =
                record.dateKey ??
                record.date;

            if (
                !dateKey
            ) {

                return false;

            }


            const recordDate =
                new Date(
                    `${dateKey}T00:00:00`
                );


            if (
                Number.isNaN(
                    recordDate.getTime()
                )
            ) {

                return false;

            }


            return (
                recordDate >=
                startDate
                &&
                recordDate <=
                endDate
            );

        }
    );

}


function closeAttendanceProfile() {

    if (
        !attendanceProfileModal
    ) {

        return;

    }

    attendanceProfileModal.classList.remove(
        "active"
    );

}

// =====================================
// Update Attendance Profile Summary
// =====================================

function updateAttendanceProfileSummary(
    records
) {

    const totalRecords =
        records.length;

    const lateRecords =
        records.filter(
            function (
                record
            ) {

                return (
                    String(
                        record.status ??
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                    "late"
                );

            }
        );

    const absentRecords =
        records.filter(
            function (
                record
            ) {

                return (
                    String(
                        record.status ??
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                    "absent"
                );

            }
        );

    const earlyExitRecords =
        records.filter(
            function (
                record
            ) {

                return (
                    record.earlyExit ===
                    true
                );

            }
        );


    let totalWorkedMinutes =
        0;

    let workedDayCount =
        0;


    records.forEach(
        function (
            record
        ) {

            const workedMinutes =
                calculateProfileWorkedMinutes(
                    record
                );

            if (
                workedMinutes ===
                null
            ) {

                return;

            }

            totalWorkedMinutes +=
                workedMinutes;

            workedDayCount++;

        }
    );


    const attendedRecords =
        records.filter(
            function (
                record
            ) {

                const status =
                    String(
                        record.status ??
                        ""
                    )
                        .trim()
                        .toLowerCase();

                return (
                    status ===
                    "on time"
                    ||
                    status ===
                    "late"
                );

            }
        ).length;


    const attendancePercentage =
        totalRecords >
        0
            ?
            Math.round(
                (
                    attendedRecords /
                    totalRecords
                ) *
                100
            )
            :
            0;


    const averageMinutes =
        workedDayCount >
        0
            ?
            Math.round(
                totalWorkedMinutes /
                workedDayCount
            )
            :
            0;


    profileAttendanceRate.textContent =
        `${attendancePercentage}%`;

    profileAverageHours.textContent =
        formatProfileMinutes(
            averageMinutes
        );

    profileLateCount.textContent =
        lateRecords.length;

    profileAbsentCount.textContent =
        absentRecords.length;

    profileEarlyExitCount.textContent =
        earlyExitRecords.length;

    profileTotalHours.textContent =
        formatProfileMinutes(
            totalWorkedMinutes
        );

        // =====================================
// Expected Hours
// =====================================

const expectedMinutes =
    calculateProfileExpectedMinutes();

    const hoursBalanceMinutes =
    totalWorkedMinutes -
    expectedMinutes;

if (
    profileExpectedHours
) {

    profileExpectedHours.textContent =
    formatProfileMinutes(
        expectedMinutes
    );

}

if (
    profileHoursBalance
) {

    profileHoursBalance.textContent =
        formatProfileBalance(
            hoursBalanceMinutes
        );

}

}

// =====================================
// Calculate Profile Worked Minutes
// =====================================

function calculateProfileWorkedMinutes(
    record
) {

    const checkInTimestamp =
        record.scanTimestamp;

    const checkOutTimestamp =
        record.checkOutTimestamp;


    // =====================================
    // Preferred Firebase Timestamp Method
    // =====================================

    if (
        checkInTimestamp &&
        checkOutTimestamp &&
        typeof checkInTimestamp.toDate ===
            "function" &&
        typeof checkOutTimestamp.toDate ===
            "function"
    ) {

        const actualCheckInDate =
            checkInTimestamp.toDate();

        const checkOutDate =
            checkOutTimestamp.toDate();


        const standardStartParts =
            String(
                standardWorkStartTime
            )
                .split(":")
                .map(Number);


        const standardStartDate =
            new Date(
                actualCheckInDate
            );

        standardStartDate.setHours(
            standardStartParts[0],
            standardStartParts[1],
            0,
            0
        );


        const effectiveCheckInDate =
            actualCheckInDate <
            standardStartDate
                ?
                standardStartDate
                :
                actualCheckInDate;


        const differenceMilliseconds =
            checkOutDate.getTime()
            -
            effectiveCheckInDate.getTime();


        if (
            differenceMilliseconds >=
            0
        ) {

            const elapsedMinutes =
                Math.floor(
                    differenceMilliseconds /
                    60000
                );


            let totalMinutes =
                elapsedMinutes;


            // =====================================
            // Deduct Unpaid Break
            // =====================================

            if (
                elapsedMinutes >=
                360
            ) {

                totalMinutes =
                    Math.max(
                        0,
                        elapsedMinutes -
                        unpaidBreakMinutes
                    );

            }


            return totalMinutes;

        }

    }


    // =====================================
    // Fallback For Older Records
    // =====================================

    if (
        record.time &&
        record.checkOutTime
    ) {

        const checkInParts =
            String(
                record.time
            )
                .split(":")
                .map(Number);

        const checkOutParts =
            String(
                record.checkOutTime
            )
                .split(":")
                .map(Number);


        if (
            checkInParts.length <
                2
            ||
            checkOutParts.length <
                2
            ||
            checkInParts.some(
                Number.isNaN
            )
            ||
            checkOutParts.some(
                Number.isNaN
            )
        ) {

            return null;

        }


        const actualCheckInMinutes =
            (
                checkInParts[0] *
                60
            )
            +
            checkInParts[1];


        const standardStartParts =
            String(
                standardWorkStartTime
            )
                .split(":")
                .map(Number);


        const standardStartMinutes =
            (
                standardStartParts[0] *
                60
            )
            +
            standardStartParts[1];


        const effectiveCheckInMinutes =
            Math.max(
                actualCheckInMinutes,
                standardStartMinutes
            );


        const checkOutMinutes =
            (
                checkOutParts[0] *
                60
            )
            +
            checkOutParts[1];


        const elapsedMinutes =
            checkOutMinutes -
            effectiveCheckInMinutes;


        if (
            elapsedMinutes <
            0
        ) {

            return null;

        }


        let totalMinutes =
            elapsedMinutes;


        // =====================================
        // Deduct Unpaid Break
        // =====================================

        if (
            elapsedMinutes >=
            360
        ) {

            totalMinutes =
                Math.max(
                    0,
                    elapsedMinutes -
                    unpaidBreakMinutes
                );

        }


        return totalMinutes;

    }


    return null;

}


// =====================================
// Format Profile Minutes
// =====================================

function formatProfileMinutes(
    totalMinutes
) {

    const hours =
        Math.floor(
            totalMinutes /
            60
        );

    const minutes =
        totalMinutes %
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

// =====================================
// Format Hours Balance
// =====================================

function formatProfileBalance(
    totalMinutes
) {

    const absoluteMinutes =
        Math.abs(
            totalMinutes
        );

    const hours =
        Math.floor(
            absoluteMinutes /
            60
        );

    const minutes =
        absoluteMinutes %
        60;

    let prefix =
        "";

    if (
        totalMinutes >
        0
    ) {

        prefix =
            "+";

    } else if (
        totalMinutes <
        0
    ) {

        prefix =
            "-";

    }

    return (
        prefix
        +
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

// =====================================
// Display Attendance Profile History
// =====================================

function displayAttendanceProfileHistory(
    records
) {

    profileAttendanceHistory.innerHTML =
        "";

    if (
        records.length ===
        0
    ) {

        profileAttendanceHistory.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-row"
                >
                    No attendance history found.
                </td>
            </tr>
        `;

        return;

    }


    records.forEach(
        function (
            record
        ) {

            const row =
                document.createElement(
                    "tr"
                );

            const statusClass =
                createStatusClass(
                    record.status
                );

            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        record.dateKey ??
                        record.date ??
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        record.time ??
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        record.checkOutTime ??
                        "Still at work"
                    )}
                </td>

                <td>
    ${escapeHtml(
        formatProfileRecordHours(
            record
        )
    )}
</td>

                <td>

                    <span
                        class="status-badge ${statusClass}"
                    >
                        ${escapeHtml(
                            record.status ??
                            "Unknown"
                        )}
                    </span>

                </td>

            `;

            profileAttendanceHistory.appendChild(
                row
            );

        }
    );

}

// =====================================
// Format Profile Record Hours
// =====================================

function formatProfileRecordHours(
    record
) {

    if (
        !record.checkOutTime &&
        !record.checkOutTimestamp
    ) {

        return "In progress";

    }


    const workedMinutes =
        calculateProfileWorkedMinutes(
            record
        );


    if (
        workedMinutes ===
        null
    ) {

        return "Not available";

    }


    return formatProfileMinutes(
        workedMinutes
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

employeeWorkArrangementInput.value =
    employee.workArrangement ?? "Office";

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

    let employeeAuthUser =
        null;

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

        const employeeNumber =
            String(
                employee.employeeNumber ??
                ""
            ).trim();

        const employeePin =
            String(
                employee.pin ??
                ""
            ).trim();

        await clearEmployeeAuthSession();

        // =====================================
        // Sign Into Hidden Employee Auth Account
        // =====================================

        if (
            employee.authUid
        ) {

            if (
                !employeeNumber ||
                !employeePin
            ) {

                throw new Error(
                    "Employee authentication details are incomplete."
                );

            }

            const userCredential =
                await signInWithEmailAndPassword(
                    employeeAuth,
                    getEmployeeAuthEmail(
                        employeeNumber
                    ),
                    employeePin
                );

            employeeAuthUser =
                userCredential.user;

            if (
                employeeAuthUser.uid !==
                employee.authUid
            ) {

                throw new Error(
                    "Employee authentication account does not match the employee record."
                );

            }

        }


        // =====================================
        // Audit Log
        // =====================================

        await writeAuditLog(
            "Deleted Employee",
            employee.name,
            `Employee Number: ${employee.employeeNumber}`
        );


        // =====================================
        // Delete Firestore Employee
        // =====================================

        const employeeReference =
            doc(
                db,
                "employees",
                employeeToDelete
            );

        await deleteDoc(
            employeeReference
        );


        // =====================================
        // Delete Hidden Firebase Auth User
        // =====================================

        if (
            employeeAuthUser
        ) {

            await deleteUser(
                employeeAuthUser
            );

            employeeAuthUser =
                null;

        }


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

    } finally {

        await clearEmployeeAuthSession();

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
        !/^\d{6}$/.test(
            pin
        )
    ) {

        showNotification(
            "⚠️ PIN must contain exactly 6 numbers.",
            "warning"
        );

        return;

    }

    if (
        pin !==
        confirmedPin
    ) {

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

        const employeeNumber =
            String(
                employee.employeeNumber ??
                ""
            ).trim();

        const currentPin =
            String(
                employee.pin ??
                ""
            ).trim();

        if (
            !employeeNumber
        ) {

            throw new Error(
                "Employee number is missing."
            );

        }

        await clearEmployeeAuthSession();

        let employeeAuthUser =
            null;

        // =====================================
        // Existing Firebase Auth Employee
        // =====================================

        if (
            employee.authUid
        ) {

            if (
                !currentPin
            ) {

                throw new Error(
                    "Current employee PIN is missing."
                );

            }

            const userCredential =
                await signInWithEmailAndPassword(
                    employeeAuth,
                    getEmployeeAuthEmail(
                        employeeNumber
                    ),
                    currentPin
                );

            employeeAuthUser =
                userCredential.user;

            if (
                employeeAuthUser.uid !==
                employee.authUid
            ) {

                throw new Error(
                    "Employee authentication account does not match the employee record."
                );

            }

            await updatePassword(
                employeeAuthUser,
                pin
            );

        }

        // =====================================
        // Existing Legacy Employee
        // No Firebase Auth Account Yet
        // =====================================

        else {

            const userCredential =
                await createUserWithEmailAndPassword(
                    employeeAuth,
                    getEmployeeAuthEmail(
                        employeeNumber
                    ),
                    pin
                );

            employeeAuthUser =
                userCredential.user;

        }


        // =====================================
        // Update Firestore
        // =====================================

        const employeeReference =
            doc(
                db,
                "employees",
                employeeToResetPin
            );

        await updateDoc(
            employeeReference,
            {
                pin:
                    pin,

                authUid:
                    employeeAuthUser.uid
            }
        );


        // =====================================
        // Audit Log
        // =====================================

        await writeAuditLog(
            "Reset PIN",
            employee.name,
            "Employee PIN was reset."
        );


        closeResetPinConfirmation();

        await loadEmployees();

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

    } finally {

        await clearEmployeeAuthSession();

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
// Create Status CSS Class
// =====================================

function createStatusClass(
    status
) {

    return `status-${String(
        status ??
        "unknown"
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        )
        .replace(
            /[^a-z0-9-]/g,
            ""
        )}`;

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
