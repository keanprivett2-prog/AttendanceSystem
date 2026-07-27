// =====================================
// Firebase Admin Authentication
// =====================================

import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// Sign in administrator
async function loginAdmin(email, password) {

    const userCredential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    return userCredential.user;
}


// Sign out administrator
async function logoutAdmin() {

    await signOut(auth);
}

// Check whether an administrator is signed in
function protectAdminPage() {

    onAuthStateChanged(auth, function (user) {

        if (!user) {
            window.location.href = "admin-login.html";
        }

    });
}

// Export authentication functions
export {
    loginAdmin,
    logoutAdmin,
    protectAdminPage
};
