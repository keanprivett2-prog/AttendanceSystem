import { auth, db } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const auditTableBody =
    document.getElementById("auditTableBody");

const logoutButton =
    document.getElementById("logoutButton");

async function loadAuditLog() {

    auditTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="empty-row">
                No audit records have been created yet.
            </td>
        </tr>
    `;

}

loadAuditLog();

logoutButton.addEventListener("click", async () => {

    await auth.signOut();

    window.location.href = "index.html";

});
