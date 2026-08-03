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
    serverTimestamp
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


// =====================================
// Start Page
// =====================================

initializeAdministratorsPage();

function initializeAdministratorsPage() {

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
