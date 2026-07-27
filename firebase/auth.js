// =====================================
// Firebase Admin Authentication
// =====================================

import {
    auth,
    db
} from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

// Get the signed-in administrator's profile
// Get the signed-in administrator's profile
async function getAdminProfile() {

    const user = await new Promise(resolve => {

        const unsubscribe =
            onAuthStateChanged(auth, currentUser => {

                unsubscribe();
                resolve(currentUser);

            });

    });

    if (!user) {
        return null;
    }

    const adminDocument = doc(
        db,
        "admins",
        user.uid
    );

    const adminSnapshot =
        await getDoc(adminDocument);

    if (!adminSnapshot.exists()) {
        return null;
    }

    return {
        uid: user.uid,
        ...adminSnapshot.data()
    };
}

// Export authentication functions
export {
    loginAdmin,
    logoutAdmin,
    protectAdminPage,
    getAdminProfile
};
