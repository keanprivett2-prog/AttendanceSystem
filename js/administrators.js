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
// Secondary Firebase App
// =====================================

// This separate Firebase app creates new
// administrators without logging out the
// administrator currently using the system.

const administratorCreatorApp =
    initializeApp(
        firebaseConfig,
        "administratorCreator"
    );

const administratorCreatorAuth =
    getAuth(administratorCreatorApp);


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

const logoutButton =
    document.getElementById(
        "logoutButton"
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

let editingAdministratorId = null;


// =====================================
// Start Page
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

    logoutButton.addEventListener(
        "click",
        logoutAdministrator
    );

}


// =====================================
// Open Modal
// =====================================

function openAdministratorModal() {

    editingAdministratorId = null;

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

    administratorMessage.textContent = "";

    administratorForm.reset();

    administratorModal.hidden = false;

    administratorModal.classList.add(
        "modal-open"
    );

}


// =====================================
// Close Modal
// =====================================

function closeAdministratorModal() {

    administratorModal.classList.remove(
        "modal-open"
    );

    administratorModal.hidden = true;

    administratorForm.reset();

    administratorMessage.textContent = "";

}

// =====================================
// Load Administrators
// =====================================

async function loadAdministrators() {

    try {

        administratorTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">
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
                    <td colspan="6" class="empty-row">
                        No administrators found.
                    </td>
                </tr>
            `;

            return;

        }

        administratorTableBody.innerHTML = "";

        snapshot.forEach(
            (administratorDocument) => {

                const administrator =
                    administratorDocument.data();

                const row =
                    document.createElement("tr");

                row.innerHTML = `
                    <td>
                        ${administrator.fullName ?? ""}
                    </td>

                    <td>
                        ${administrator.email ?? ""}
                    </td>

                    <td>
                        ${formatAdministratorRole(
                            administrator.role
                        )}
                    </td>

                    <td>
    <span
    class="administrator-status ${
        (administrator.status ?? "Active") === "Active"
            ? "administrator-status-active"
            : "administrator-status-disabled"
    }"
>
    ${administrator.status ?? "Active"}
</span>
</td>

<td>
    ${formatAdministratorDate(
        administrator.createdAt
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
            data-status="${administrator.status ?? "Active"}"
        >
            ${
                (administrator.status ?? "Active") === "Active"
                    ? "Disable"
                    : "Enable"
            }
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
                <td colspan="6" class="empty-row">
                    Administrators could not be loaded.
                </td>
            </tr>
        `;

    }

}


// =====================================
// Format Role
// =====================================

function formatAdministratorRole(role) {

    if (role === "superAdministrator") {
        return "Super Administrator";
    }

    if (role === "administrator") {
        return "Administrator";
    }

    if (role === "manager") {
        return "Manager";
    }

    if (role === "readOnly") {
        return "Read Only";
    }

    return role ?? "";

}


// =====================================
// Format Date
// =====================================

function formatAdministratorDate(timestamp) {

    if (!timestamp) {
        return "-";
    }

    const date =
        timestamp.toDate();

    return date.toLocaleDateString(
        "en-ZA",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

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

        if (!administratorSnapshot.exists()) {

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
            administrator.fullName ?? "";

        administratorEmailInput.value =
            administrator.email ?? "";

        administratorRoleInput.value =
            administrator.role ?? "";

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
// Administrator Actions
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
// Update Administrator
// =====================================

async function updateAdministrator() {

    const fullName =
        administratorNameInput.value.trim();

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
                fullName,
                email,
                role
            }
        );

        showAdministratorMessage(
            "Administrator updated successfully.",
            "success"
        );

        await loadAdministrators();

        setTimeout(
            () => {
                closeAdministratorModal();
            },
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
                status: newStatus
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
// Create Administrator
// =====================================

async function createAdministrator(event) {

    event.preventDefault();

    const fullName =
        administratorNameInput.value.trim();

    const email =
        administratorEmailInput.value
            .trim()
            .toLowerCase();

    const password =
        administratorPasswordInput.value;

    const role =
        administratorRoleInput.value;


    // ---------------------------------
    // Validation
    // ---------------------------------

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

        showAdministratorMessage(
            "Creating administrator...",
            "info"
        );


        // =====================================
        // Create Firebase Authentication User
        // =====================================

        const userCredential =
            await createUserWithEmailAndPassword(
                administratorCreatorAuth,
                email,
                password
            );

        const newAdministrator =
            userCredential.user;


        // =====================================
        // Save Administrator Profile
        // =====================================

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


        // =====================================
        // Sign Out Secondary Account
        // =====================================

        await signOut(
            administratorCreatorAuth
        );


        // =====================================
        // Success
        // =====================================

        showAdministratorMessage(
            "Administrator created successfully.",
            "success"
        );

        administratorForm.reset();
        await loadAdministrators();


        setTimeout(
            () => {

                closeAdministratorModal();

            },
            1200
        );


    } catch (error) {

        console.error(
            "Create administrator error:",
            error
        );


        // Make sure secondary account
        // is signed out if creation partially worked.

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
                "Secondary sign out error:",
                signOutError
            );

        }


        // =====================================
        // Friendly Error Messages
        // =====================================

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

    }

    if (type === "error") {

        administratorMessage.style.color =
            "red";

    }

    if (type === "info") {

        administratorMessage.style.color =
            "#0b5ed7";

    }

}


// =====================================
// Logout
// =====================================

async function logoutAdministrator() {

    try {

        await signOut(auth);

        window.location.href =
            "index.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}
