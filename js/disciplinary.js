// =====================================
// R-E-D Attendance
// Disciplinary Management
// =====================================

import "./admin-session.js";


// =====================================
// Firebase
// =====================================

import {
    db,
    auth
} from "../firebase/firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    applySidebarPermissions,
    protectPage
} from "./role-permissions.js";


// =====================================
// Page Elements
// =====================================

const assignWarningButton =
    document.getElementById(
        "assignWarningButton"
    );

const warningModal =
    document.getElementById(
        "warningModal"
    );

const closeWarningModalButton =
    document.getElementById(
        "closeWarningModalButton"
    );

const cancelWarningButton =
    document.getElementById(
        "cancelWarningButton"
    );

const warningForm =
    document.getElementById(
        "warningForm"
    );

const warningEmployee =
    document.getElementById(
        "warningEmployee"
    );

const warningType =
    document.getElementById(
        "warningType"
    );

const warningDate =
    document.getElementById(
        "warningDate"
    );

const warningReason =
    document.getElementById(
        "warningReason"
    );

const saveWarningButton =
    document.getElementById(
        "saveWarningButton"
    );

const warningMessage =
    document.getElementById(
        "warningMessage"
    );

const disciplinaryTableBody =
    document.getElementById(
        "disciplinaryTableBody"
    );

const notification =
    document.getElementById(
        "notification"
    );

const notificationMessage =
    document.getElementById(
        "notificationMessage"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// =====================================
// Page State
// =====================================

let employees = [];


// =====================================
// Initialize Page
// =====================================

initializeDisciplinaryPage();

function initializeDisciplinaryPage() {

    if (
        !protectPage(
            "disciplinary"
        )
    ) {

        return;

    }

    applySidebarPermissions();

    setDefaultWarningDate();

    if (
        assignWarningButton
    ) {

        assignWarningButton.addEventListener(
            "click",
            openWarningModal
        );

    }

    if (
        closeWarningModalButton
    ) {

        closeWarningModalButton.addEventListener(
            "click",
            closeWarningModal
        );

    }

    if (
        cancelWarningButton
    ) {

        cancelWarningButton.addEventListener(
            "click",
            closeWarningModal
        );

    }

    if (
        warningModal
    ) {

        warningModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    warningModal
                ) {

                    closeWarningModal();

                }

            }
        );

    }

    if (
        warningForm
    ) {

        warningForm.addEventListener(
            "submit",
            saveWarning
        );

    }

    if (
        logoutButton
    ) {

        logoutButton.addEventListener(
            "click",
            logoutAdministrator
        );

    }

    loadEmployees();

    loadWarnings();

}


// =====================================
// Default Warning Date
// =====================================

function setDefaultWarningDate() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );

    warningDate.value =
        `${year}-${month}-${day}`;

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

        console.log(
            message
        );

        return;

    }

    notificationMessage.textContent =
        message;

    notification.classList.remove(
        "error",
        "warning"
    );

    if (
        type ===
        "error"
    ) {

        notification.classList.add(
            "error"
        );

    }

    if (
        type ===
        "warning"
    ) {

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
// Open Warning Modal
// =====================================

function openWarningModal() {

    warningForm.reset();

    setDefaultWarningDate();

    populateEmployeeDropdown();

    warningMessage.textContent =
        "";

    warningModal.classList.add(
        "active"
    );

}


// =====================================
// Close Warning Modal
// =====================================

function closeWarningModal() {

    warningModal.classList.remove(
        "active"
    );

    warningForm.reset();

    warningMessage.textContent =
        "";

}


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

        employees =
            snapshot.docs.map(
                function (
                    employeeDocument
                ) {

                    return {

                        id:
                            employeeDocument.id,

                        ...employeeDocument.data()

                    };

                }
            );

        employees =
            employees.filter(
                function (
                    employee
                ) {

                    return (
                        employee.active !==
                        false
                    );

                }
            );

        employees.sort(
            function (
                firstEmployee,
                secondEmployee
            ) {

                return String(
                    firstEmployee.name ??
                    ""
                ).localeCompare(
                    String(
                        secondEmployee.name ??
                        ""
                    )
                );

            }
        );

        populateEmployeeDropdown();

    } catch (error) {

        console.error(
            "Unable to load employees:",
            error
        );

        showNotification(
            "❌ Employees could not be loaded.",
            "error"
        );

    }

}


// =====================================
// Populate Employee Dropdown
// =====================================

function populateEmployeeDropdown() {

    if (
        !warningEmployee
    ) {

        return;

    }

    warningEmployee.innerHTML = `
        <option value="">
            Select employee
        </option>
    `;

    employees.forEach(
        function (
            employee
        ) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                employee.id;

            option.textContent =
                `${employee.employeeNumber ?? "-"} - ${employee.name ?? "Unnamed Employee"}`;

            warningEmployee.appendChild(
                option
            );

        }
    );

}


// =====================================
// Find Employee
// =====================================

function findEmployee(
    employeeId
) {

    return employees.find(
        function (
            employee
        ) {

            return (
                employee.id ===
                employeeId
            );

        }
    );

}


// =====================================
// Save Warning
// =====================================

async function saveWarning(
    event
) {

    event.preventDefault();

    const employeeId =
        warningEmployee.value;

    const selectedWarningType =
        warningType.value;

    const selectedWarningDate =
        warningDate.value;

    const reason =
        warningReason.value
            .trim();

    if (
        !employeeId ||
        !selectedWarningType ||
        !selectedWarningDate
    ) {

        warningMessage.style.color =
            "red";

        warningMessage.textContent =
            "Please complete all required fields.";

        return;

    }

    const employee =
        findEmployee(
            employeeId
        );

    if (
        !employee
    ) {

        warningMessage.style.color =
            "red";

        warningMessage.textContent =
            "Employee could not be found.";

        return;

    }

    try {

        saveWarningButton.disabled =
            true;

        saveWarningButton.textContent =
            "Saving...";

        warningMessage.style.color =
            "#0b5ed7";

        warningMessage.textContent =
            "Saving warning...";

        const currentUser =
            auth.currentUser;

        const assignedByName =
            sessionStorage.getItem(
                "adminName"
            )
            ||
            currentUser?.email
            ||
            "Unknown Administrator";

        const assignedByUid =
            currentUser?.uid ??
            "";

        await addDoc(
            collection(
                db,
                "disciplinaryWarnings"
            ),
            {

                employeeId:
                    employee.id,

                employeeNumber:
                    employee.employeeNumber ??
                    "",

                employeeName:
                    employee.name ??
                    "",

                department:
                    employee.department ??
                    "",

                warningType:
                    selectedWarningType,

                warningDate:
                    selectedWarningDate,

                reason:
                    reason,

                assignedByUid:
                    assignedByUid,

                assignedByName:
                    assignedByName,

                createdAt:
                    serverTimestamp()

            }
        );

        showNotification(
            "✅ Warning assigned successfully."
        );

        closeWarningModal();

        await loadWarnings();

    } catch (error) {

        console.error(
            "Save warning error:",
            error
        );

        warningMessage.style.color =
            "red";

        warningMessage.textContent =
            "Warning could not be saved.";

    } finally {

        saveWarningButton.disabled =
            false;

        saveWarningButton.textContent =
            "Save Warning";

    }

}


// =====================================
// Load Warning History
// =====================================

async function loadWarnings() {

    disciplinaryTableBody.innerHTML = `
        <tr>
            <td
                colspan="7"
                class="empty-row"
            >
                Loading disciplinary warnings...
            </td>
        </tr>
    `;

    try {

        const warningsQuery =
            query(
                collection(
                    db,
                    "disciplinaryWarnings"
                ),
                orderBy(
                    "warningDate",
                    "desc"
                )
            );

        const snapshot =
            await getDocs(
                warningsQuery
            );

        disciplinaryTableBody.innerHTML =
            "";

        if (
            snapshot.empty
        ) {

            disciplinaryTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="empty-row"
                    >
                        No disciplinary warnings have been recorded.
                    </td>
                </tr>
            `;

            return;

        }

        snapshot.forEach(
            function (
                warningDocument
            ) {

                const warning =
                    warningDocument.data();

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `

                    <td>
                        ${escapeHtml(
                            formatWarningDate(
                                warning.warningDate
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.employeeName ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.employeeNumber ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.department ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.warningType ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.reason ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            warning.assignedByName ??
                            "-"
                        )}
                    </td>

                `;

                disciplinaryTableBody.appendChild(
                    row
                );

            }
        );

    } catch (error) {

        console.error(
            "Unable to load warnings:",
            error
        );

        disciplinaryTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-row"
                >
                    Unable to load disciplinary warnings.
                </td>
            </tr>
        `;

    }

}


// =====================================
// Format Warning Date
// =====================================

function formatWarningDate(
    dateKey
) {

    if (
        !dateKey
    ) {

        return "-";

    }

    const date =
        new Date(
            `${dateKey}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-ZA",
        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"

        }
    );

}


// =====================================
// Escape HTML
// =====================================

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


// =====================================
// Administrator Logout
// =====================================

async function logoutAdministrator() {

    try {

        logoutButton.disabled =
            true;

        logoutButton.textContent =
            "Logging out...";

        await signOut(
            auth
        );

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
