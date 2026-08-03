// Firebase Imports
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// =====================================
// Firebase Configuration
// =====================================

const firebaseConfig = {

    apiKey:
        "AIzaSyAjDSlD5XGcMocLK0-kotjlxYLYV81_l-U",

    authDomain:
        "attendancesystem-359f7.firebaseapp.com",

    projectId:
        "attendancesystem-359f7",

    storageBucket:
        "attendancesystem-359f7.firebasestorage.app",

    messagingSenderId:
        "125700549800",

    appId:
        "1:125700549800:web:44cb03a1917b4d5d3ba69d",

    measurementId:
        "G-1VE1305FMJ"

};


// =====================================
// Initialize Main Firebase App
// =====================================

const app =
    initializeApp(firebaseConfig);


// =====================================
// Initialize Firestore
// =====================================

const db =
    getFirestore(app);


// =====================================
// Initialize Authentication
// =====================================

const auth =
    getAuth(app);


// =====================================
// Exports
// =====================================

export {
    app,
    db,
    auth,
    firebaseConfig
};
