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
        createAdministrator
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

    administratorMessage.textContent = "";

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
    <span class="administrator-status administrator-status-active">
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
            class="admin-action-btn disable-admin-btn"
            data-id="${administratorDocument.id}"
        >
            Disable
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
