// =====================================
// R-E-D Attendance
// Administrators
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
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================
// Secondary Firebase Application
// =====================================

// This secondary Firebase application creates a new
// administrator without replacing the administrator
// currently signed into the main application.

const administratorCreatorApp =
    initializeApp(
        firebaseConfig,
        "administratorCreator"
    );

const administratorCreatorAuth =
    getAuth(
        administratorCreatorApp
    );


// =====================================
// Page Elements
// =====================================

const addAdministratorButton =
    document.getElementById(
        "addAdministratorButton"
    );

const administratorModal =
    document.getElementById(
        "administratorModal"
    );

const closeAdministratorModalButton =
    document.getElementById(
        "closeAdministratorModalButton"
    );

const cancelAdministratorButton =
    document.getElementById(
        "cancelAdministratorButton"
    );

const administratorForm =
    document.getElementById(
        "administratorForm"
    );

const administratorNameInput =
    document.getElementById(
        "administratorName"
    );

const administratorEmailInput =
    document.getElementById(
        "administratorEmail"
    );

const administratorPasswordInput =
    document.getElementById(
        "administratorPassword"
    );

const administratorRoleInput =
    document.getElementById(
        "administratorRole"
    );

const administratorMessage =
    document.getElementById(
        "administratorMessage"
    );

const administratorTableBody =
    document.getElementById(
        "administratorTableBody"
    );

const administratorModalTitle =
    document.getElementById(
        "administratorModalTitle"
    );

const saveAdministratorButton =
    document.getElementById(
        "saveAdministratorButton"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// =====================================
// Page State
// =====================================

let editingAdministratorId =
    null;


// =====================================
// Start Administrators Page
// =====================================

initializeAdministratorsPage();

function initializeAdministratorsPage() {

    loadAdministrators();

    addAdministratorButton.addEventListener(
        "click",
        openAdministratorModal
    );

    closeAdministratorModalButton.addEventListener(
        "click",
        closeAdministratorModal
    );

    cancelAdministratorButton.addEventListener(
        "click",
        closeAdministratorModal
    );

    administratorForm.addEventListener(
        "submit",
        handleAdministratorSubmit
    );

    administratorTableBody.addEventListener(
        "click",
        handleAdministratorActions
    );

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutAdministrator
        );

    }

}


// =====================================
// Open Add Administrator Modal
// =====================================

function openAdministratorModal() {

    editingAdministratorId =
        null;

    administratorForm.reset();

    administratorModalTitle.textContent =
        "Add Administrator";

    saveAdministratorButton.textContent =
        "Create Administrator";

    administratorPasswordInput.disabled =
        false;

    administratorPasswordInput.required =
        true;

    administratorPasswordInput.placeholder =
        "";

    administratorMessage.textContent =
        "";

    administratorModal.hidden =
        false;

    administratorModal.classList.add(
        "modal-open"
    );

}


// =====================================
// Close Administrator Modal
// =====================================

function closeAdministratorModal() {

    administratorModal.classList.remove(
        "modal-open"
    );

    administratorModal.hidden =
        true;

    administratorForm.reset();

    administratorMessage.textContent =
        "";

    editingAdministratorId =
        null;

    administratorPasswordInput.disabled =
        false;

    administratorPasswordInput.required =
        true;

    administratorPasswordInput.placeholder =
        "";

}


// =====================================
// Load Administrators
// =====================================

async function loadAdministrators() {

    try {

        administratorTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-row"
                >
                    Loading administrators...
                </td>
            </tr>
        `;

        const administratorsQuery =
            query(
                collection(
                    db,
                    "administrators"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const snapshot =
            await getDocs(
                administratorsQuery
            );

        if (snapshot.empty) {

            administratorTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="empty-row"
                    >
                        No administrators found.
                    </td>
                </tr>
            `;

            return;

        }

        administratorTableBody.innerHTML =
            "";

        snapshot.forEach(
            (administratorDocument) => {

                const administrator =
                    administratorDocument.data();

                const status =
                    administrator.status ??
                    "Active";

                const statusClass =
                    status === "Active"
                        ? "administrator-status-active"
                        : "administrator-status-disabled";

                const toggleButtonText =
                    status === "Active"
                        ? "Disable"
                        : "Enable";

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `
                    <td>
                        ${escapeHtml(
                            administrator.fullName ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            administrator.email ??
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            formatAdministratorRole(
                                administrator.role
                            )
                        )}
                    </td>

                    <td>
                        <span
                            class="administrator-status ${statusClass}"
                        >
                            ${escapeHtml(status)}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(
                            formatAdministratorDate(
                                administrator.createdAt
                            )
                        )}
                    </td>

                    <td>

                        <div class="administrator-actions">

                            <button
                                type="button"
                                class="admin-action-btn edit-admin-btn"
                                data-id="${administratorDocument.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="admin-action-btn toggle-admin-btn"
                                data-id="${administratorDocument.id}"
                                data-status="${escapeHtml(status)}"
                            >
                                ${toggleButtonText}
                            </button>

                        </div>

                    </td>
                `;

                administratorTableBody.appendChild(
                    row
                );

            }
        );

    } catch (error) {

        console.error(
            "Load administrators error:",
            error
        );

        administratorTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-row"
                >
                    Administrators could not be loaded.
                </td>
            </tr>
        `;

    }

}


// =====================================
// Handle Administrator Table Actions
// =====================================

function handleAdministratorActions(event) {

    const editButton =
        event.target.closest(
            ".edit-admin-btn"
        );

    if (editButton) {

        const administratorId =
            editButton.dataset.id;

        openEditAdministrator(
            administratorId
        );

        return;

    }

    const toggleButton =
        event.target.closest(
            ".toggle-admin-btn"
        );

    if (toggleButton) {

        const administratorId =
            toggleButton.dataset.id;

        const currentStatus =
            toggleButton.dataset.status;

        toggleAdministratorStatus(
            administratorId,
            currentStatus
        );

    }

}


// =====================================
// Open Edit Administrator
// =====================================

async function openEditAdministrator(
    administratorId
) {

    try {

        const administratorReference =
            doc(
                db,
                "administrators",
                administratorId
            );

        const administratorSnapshot =
            await getDoc(
                administratorReference
            );

        if (
            !administratorSnapshot.exists()
        ) {

            alert(
                "Administrator could not be found."
            );

            return;

        }

        const administrator =
            administratorSnapshot.data();

        editingAdministratorId =
            administratorId;

        administratorModalTitle.textContent =
            "Edit Administrator";

        saveAdministratorButton.textContent =
            "Save Changes";

        administratorNameInput.value =
            administrator.fullName ??
            "";

        administratorEmailInput.value =
            administrator.email ??
            "";

        administratorRoleInput.value =
            administrator.role ??
            "";

        administratorPasswordInput.value =
            "";

        administratorPasswordInput.required =
            false;

        administratorPasswordInput.disabled =
            true;

        administratorPasswordInput.placeholder =
            "Password cannot be changed here";

        administratorMessage.textContent =
            "";

        administratorModal.hidden =
            false;

        administratorModal.classList.add(
            "modal-open"
        );

    } catch (error) {

        console.error(
            "Open administrator error:",
            error
        );

        alert(
            "The administrator could not be opened."
        );

    }

}


// =====================================
// Handle Form Submission
// =====================================

async function handleAdministratorSubmit(
    event
) {

    event.preventDefault();

    if (editingAdministratorId) {

        await updateAdministrator();

        return;

    }

    await createAdministrator();

}


// =====================================
// Create Administrator
// =====================================

async function createAdministrator() {

    const fullName =
        administratorNameInput.value
            .trim();

    const email =
        administratorEmailInput.value
            .trim()
            .toLowerCase();

    const password =
        administratorPasswordInput.value;

    const role =
        administratorRoleInput.value;


    if (fullName === "") {

        showAdministratorMessage(
            "Please enter the administrator's full name.",
            "error"
        );

        return;

    }

    if (email === "") {

        showAdministratorMessage(
            "Please enter an email address.",
            "error"
        );

        return;

    }

    if (password.length < 6) {

        showAdministratorMessage(
            "The temporary password must contain at least 6 characters.",
            "error"
        );

        return;

    }

    if (role === "") {

        showAdministratorMessage(
            "Please select an administrator role.",
            "error"
        );

        return;

    }


    try {

        setSaveButtonState(
            true,
            "Creating..."
        );

        showAdministratorMessage(
            "Creating administrator...",
            "info"
        );

        const userCredential =
            await createUserWithEmailAndPassword(
                administratorCreatorAuth,
                email,
                password
            );

        const newAdministrator =
            userCredential.user;

        await setDoc(
            doc(
                db,
                "administrators",
                newAdministrator.uid
            ),
            {
                uid:
                    newAdministrator.uid,

                fullName:
                    fullName,

                email:
                    email,

                role:
                    role,

                status:
                    "Active",

                createdAt:
                    serverTimestamp()
            }
        );

        await signOut(
            administratorCreatorAuth
        );

        showAdministratorMessage(
            "Administrator created successfully.",
            "success"
        );

        administratorForm.reset();

        await loadAdministrators();

        setTimeout(
            closeAdministratorModal,
            1200
        );

    } catch (error) {

        console.error(
            "Create administrator error:",
            error
        );

        try {

            if (
                administratorCreatorAuth.currentUser
            ) {

                await signOut(
                    administratorCreatorAuth
                );

            }

        } catch (signOutError) {

            console.error(
                "Secondary sign-out error:",
                signOutError
            );

        }

        showCreateAdministratorError(
            error
        );

    } finally {

        setSaveButtonState(
            false,
            "Create Administrator"
        );

    }

}


// =====================================
// Update Administrator
// =====================================

async function updateAdministrator() {

    const fullName =
        administratorNameInput.value
            .trim();

    const email =
        administratorEmailInput.value
            .trim()
            .toLowerCase();

    const role =
        administratorRoleInput.value;


    if (fullName === "") {

        showAdministratorMessage(
            "Please enter the administrator's full name.",
            "error"
        );

        return;

    }

    if (email === "") {

        showAdministratorMessage(
            "Please enter an email address.",
            "error"
        );

        return;

    }

    if (role === "") {

        showAdministratorMessage(
            "Please select an administrator role.",
            "error"
        );

        return;

    }


    try {

        setSaveButtonState(
            true,
            "Saving..."
        );

        showAdministratorMessage(
            "Saving changes...",
            "info"
        );

        const administratorReference =
            doc(
                db,
                "administrators",
                editingAdministratorId
            );

        await updateDoc(
            administratorReference,
            {
                fullName:
                    fullName,

                email:
                    email,

                role:
                    role
            }
        );

        showAdministratorMessage(
            "Administrator updated successfully.",
            "success"
        );

        await loadAdministrators();

        setTimeout(
            closeAdministratorModal,
            1000
        );

    } catch (error) {

        console.error(
            "Update administrator error:",
            error
        );

        showAdministratorMessage(
            "The administrator could not be updated.",
            "error"
        );

    } finally {

        setSaveButtonState(
            false,
            "Save Changes"
        );

    }

}


// =====================================
// Toggle Administrator Status
// =====================================

async function toggleAdministratorStatus(
    administratorId,
    currentStatus
) {

    const newStatus =
        currentStatus === "Active"
            ? "Disabled"
            : "Active";

    const actionWord =
        newStatus === "Disabled"
            ? "disable"
            : "enable";

    const confirmed =
        confirm(
            `Are you sure you want to ${actionWord} this administrator?`
        );

    if (!confirmed) {
        return;
    }


    try {

        const administratorReference =
            doc(
                db,
                "administrators",
                administratorId
            );

        await updateDoc(
            administratorReference,
            {
                status:
                    newStatus
            }
        );

        await loadAdministrators();

    } catch (error) {

        console.error(
            "Toggle administrator status error:",
            error
        );

        alert(
            "The administrator status could not be changed."
        );

    }

}


// =====================================
// Friendly Account-Creation Errors
// =====================================

function showCreateAdministratorError(
    error
) {

    if (
        error.code ===
        "auth/email-already-in-use"
    ) {

        showAdministratorMessage(
            "An account already exists with this email address.",
            "error"
        );

        return;

    }

    if (
        error.code ===
        "auth/invalid-email"
    ) {

        showAdministratorMessage(
            "Please enter a valid email address.",
            "error"
        );

        return;

    }

    if (
        error.code ===
        "auth/weak-password"
    ) {

        showAdministratorMessage(
            "The temporary password is too weak.",
            "error"
        );

        return;

    }

    showAdministratorMessage(
        "The administrator could not be created.",
        "error"
    );

}


// =====================================
// Format Administrator Role
// =====================================

function formatAdministratorRole(role) {

    if (
        role ===
        "superAdministrator"
    ) {

        return "Super Administrator";

    }

    if (
        role ===
        "administrator"
    ) {

        return "Administrator";

    }

    if (
        role ===
        "manager"
    ) {

        return "Manager";

    }

    if (
        role ===
        "readOnly"
    ) {

        return "Read Only";

    }

    return role ??
        "-";

}


// =====================================
// Format Administrator Date
// =====================================

function formatAdministratorDate(
    timestamp
) {

    if (!timestamp) {
        return "-";
    }

    try {

        return timestamp
            .toDate()
            .toLocaleDateString(
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

    } catch (error) {

        console.error(
            "Administrator date format error:",
            error
        );

        return "-";

    }

}


// =====================================
// Administrator Message
// =====================================

function showAdministratorMessage(
    message,
    type
) {

    administratorMessage.textContent =
        message;

    if (type === "success") {

        administratorMessage.style.color =
            "green";

    } else if (type === "error") {

        administratorMessage.style.color =
            "red";

    } else {

        administratorMessage.style.color =
            "#0b5ed7";

    }

}


// =====================================
// Save Button State
// =====================================

function setSaveButtonState(
    disabled,
    text
) {

    saveAdministratorButton.disabled =
        disabled;

    saveAdministratorButton.textContent =
        text;

}


// =====================================
// Escape HTML
// =====================================

function escapeHtml(value) {

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

        await signOut(auth);

        sessionStorage.clear();

        window.location.href =
            "admin-login.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to log out. Please try again."
        );

    }

}
