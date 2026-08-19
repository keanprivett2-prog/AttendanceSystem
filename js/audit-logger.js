// =====================================
// R-E-D Attendance
// Central Audit Logger
// =====================================

import {
    db
} from "../firebase/firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================
// Write Audit Log
// =====================================

export async function writeAuditLog(
    auditData = {}
) {

    try {

        const actorType =
            String(
                auditData.actorType ??
                "System"
            ).trim();

        const actorName =
            String(
                auditData.actorName ??
                "System"
            ).trim();

        const actorId =
            String(
                auditData.actorId ??
                ""
            ).trim();

        const targetType =
            String(
                auditData.targetType ??
                ""
            ).trim();

        const targetName =
            String(
                auditData.targetName ??
                ""
            ).trim();

        const targetId =
            String(
                auditData.targetId ??
                ""
            ).trim();

        const category =
            String(
                auditData.category ??
                "System"
            ).trim();

        const action =
            String(
                auditData.action ??
                "Unknown Action"
            ).trim();

        const description =
            String(
                auditData.description ??
                ""
            ).trim();

        const source =
            String(
                auditData.source ??
                "R-E-D Attendance"
            ).trim();

        const metadata =
            auditData.metadata &&
            typeof auditData.metadata ===
                "object"
                ?
                auditData.metadata
                :
                {};


        await addDoc(
            collection(
                db,
                "auditLog"
            ),
            {

                timestamp:
                    serverTimestamp(),

                category:
                    category,

                action:
                    action,

                description:
                    description,

                source:
                    source,


                actorType:
                    actorType,

                actorName:
                    actorName,

                actorId:
                    actorId,


                targetType:
                    targetType,

                targetName:
                    targetName,

                targetId:
                    targetId,


                metadata:
                    metadata,


                // =====================================
                // Legacy Compatibility
                // =====================================

                administrator:
                    actorType ===
                    "Administrator"
                        ?
                        actorName
                        :
                        "",

                employee:
                    targetType ===
                    "Employee"
                        ?
                        targetName
                        :
                        "",

                details:
                    description

            }
        );

    } catch (
        error
    ) {

        console.error(
            "Unable to write audit log:",
            error
        );

        // Audit logging must never stop
        // the main portal action from completing.

    }

}