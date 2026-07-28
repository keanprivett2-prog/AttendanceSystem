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

    try {

        const auditQuery = query(
            collection(db, "auditLog"),
            orderBy("timestamp", "desc")
        );

        const snapshot = await getDocs(auditQuery);

        auditTableBody.innerHTML = "";

        if (snapshot.empty) {

            auditTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-row">
                        No audit records have been created yet.
                    </td>
                </tr>
            `;

            return;
        }

        snapshot.forEach((documentSnapshot) => {

            const record = documentSnapshot.data();

            let formattedDate = "Pending";

            if (record.timestamp) {

                formattedDate =
                    record.timestamp.toDate().toLocaleString();

            }

            auditTableBody.innerHTML += `
    <tr>
        <td>${formattedDate}</td>
        <td>${record.administrator ?? "-"}</td>
        <td>${record.action ?? "-"}</td>
        <td>${record.employee ?? "-"}</td>
        <td class="audit-details">
            ${formatAuditDetails(record.details)}
        </td>
    </tr>
`;

        });

    } catch (error) {

        console.error(
            "Error loading audit records:",
            error
        );

        auditTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    Unable to load audit records.
                </td>
            </tr>
        `;

    }

}
function formatAuditDetails(details) {

    if (!details) {
        return "-";
    }

    if (
        details.includes("Previous:") &&
        details.includes("| Updated:")
    ) {

        const parts =
            details.split("| Updated:");

        const previousDetails =
            parts[0].replace("Previous:", "").trim();

        const updatedDetails =
            parts[1].trim();

        return `
            <div class="audit-comparison">

                <div class="audit-value old-value">
                    <span class="audit-label">
                        Previous
                    </span>

                    <span>
                        ${previousDetails}
                    </span>
                </div>

                <div class="audit-value new-value">
                    <span class="audit-label">
                        Updated
                    </span>

                    <span>
                        ${updatedDetails}
                    </span>
                </div>

            </div>
        `;
    }

    return `
        <div class="audit-single-detail">
            ${details}
        </div>
    `;
}
loadAuditLog();
