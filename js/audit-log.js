// =====================================
// R-E-D Attendance
// Audit Log
// =====================================


// =====================================
// Firebase
// =====================================

import {
    auth,
    db
} from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// =====================================
// Page Elements
// =====================================

const auditTableBody =
    document.getElementById(
        "auditTableBody"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// =====================================
// Start Audit Log Page
// =====================================

initializeAuditLogPage();

function initializeAuditLogPage() {

    loadAuditLog();

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutAdministrator
        );

    }

}


// =====================================
// Load Audit Log
// =====================================

async function loadAuditLog() {

    try {

        auditTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-row"
                >
                    Loading audit records...
                </td>
            </tr>
        `;

        const auditQuery =
            query(
                collection(
                    db,
                    "auditLog"
                ),
                orderBy(
                    "timestamp",
                    "desc"
                )
            );

        const snapshot =
            await getDocs(
                auditQuery
            );

        auditTableBody.innerHTML =
            "";

        if (snapshot.empty) {

            auditTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="empty-row"
                    >
                        No audit records have been created yet.
                    </td>
                </tr>
            `;

            return;

        }

        snapshot.forEach(
            (documentSnapshot) => {

                const record =
                    documentSnapshot.data();

                const formattedDate =
                    formatAuditDate(
                        record.timestamp
                    );

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `
                    <td>
                        ${escapeHtml(formattedDate)}
                    </td>

                    <td>
                        ${escapeHtml(
                            record.administrator ?? "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            record.action ?? "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            record.employee ?? "-"
                        )}
                    </td>

                    <td class="audit-details">
                        ${formatAuditDetails(
                            record.details
                        )}
                    </td>
                `;

                auditTableBody.appendChild(
                    row
                );

            }
        );

    } catch (error) {

        console.error(
            "Error loading audit records:",
            error
        );

        auditTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-row"
                >
                    Unable to load audit records.
                </td>
            </tr>
        `;

    }

}


// =====================================
// Format Audit Date
// =====================================

function formatAuditDate(timestamp) {

    if (!timestamp) {
        return "Pending";
    }

    try {

        return timestamp
            .toDate()
            .toLocaleString(
                "en-ZA",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );

    } catch (error) {

        console.error(
            "Audit date format error:",
            error
        );

        return "Pending";

    }

}


// =====================================
// Format Audit Details
// =====================================

function formatAuditDetails(details) {

    if (!details) {
        return "-";
    }

    const safeDetails =
        String(details);

    if (
        safeDetails.includes(
            "Previous:"
        ) &&
        safeDetails.includes(
            "| Updated:"
        )
    ) {

        const parts =
            safeDetails.split(
                "| Updated:"
            );

        const previousDetails =
            parts[0]
                .replace(
                    "Previous:",
                    ""
                )
                .trim();

        const updatedDetails =
            parts
                .slice(1)
                .join(
                    "| Updated:"
                )
                .trim();

        return `
            <div class="audit-comparison">

                <div class="audit-value old-value">

                    <span class="audit-label">
                        Previous
                    </span>

                    <span>
                        ${escapeHtml(
                            previousDetails
                        )}
                    </span>

                </div>

                <div class="audit-value new-value">

                    <span class="audit-label">
                        Updated
                    </span>

                    <span>
                        ${escapeHtml(
                            updatedDetails
                        )}
                    </span>

                </div>

            </div>
        `;

    }

    return `
        <div class="audit-single-detail">
            ${escapeHtml(safeDetails)}
        </div>
    `;

}


// =====================================
// Escape HTML
// =====================================

function escapeHtml(value) {

    return String(
        value ?? ""
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
