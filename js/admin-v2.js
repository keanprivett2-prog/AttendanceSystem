// =====================================
// Firebase
// =====================================

import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// =====================================
// Load Attendance
// =====================================

async function loadAttendance() {

    const snapshot = await getDocs(collection(db, "attendance"));

    console.log("Attendance Records:", snapshot.size);

    snapshot.forEach((doc) => {

        console.log(doc.id, doc.data());

    });

}

loadAttendance();
