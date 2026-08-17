const {setGlobalOptions} =
    require("firebase-functions");

const {
    onCall,
    HttpsError
} =
    require("firebase-functions/v2/https");

const {
    initializeApp
} =
    require("firebase-admin/app");

const {
    getFirestore
} =
    require("firebase-admin/firestore");


// =====================================
// Firebase Admin
// =====================================

initializeApp();

const db =
    getFirestore();


// =====================================
// Global Function Settings
// =====================================

setGlobalOptions({
    maxInstances: 10
});


// =====================================
// Authenticate Employee
// =====================================

exports.authenticateEmployee =
    onCall(
        {
            cors: true
        },
        async (
            request
        ) => {

            const employeeNumber =
                String(
                    request.data?.employeeNumber ??
                    ""
                ).trim();

            const pin =
                String(
                    request.data?.pin ??
                    ""
                ).trim();


            // =====================================
            // Validate Request
            // =====================================

            if (
                !employeeNumber
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "Employee Number is required."
                );

            }


            if (
                !pin
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "PIN is required."
                );

            }


            // =====================================
            // Find Employee
            // =====================================

            const employeeSnapshot =
                await db
                    .collection(
                        "employees"
                    )
                    .where(
                        "employeeNumber",
                        "==",
                        employeeNumber
                    )
                    .limit(
                        1
                    )
                    .get();


            if (
                employeeSnapshot.empty
            ) {

                throw new HttpsError(
                    "not-found",
                    "Employee Number not found."
                );

            }


            const employeeDocument =
                employeeSnapshot.docs[
                    0
                ];

            const employee =
                employeeDocument.data();


            // =====================================
            // Active Employee Check
            // =====================================

            if (
                employee.active ===
                false
            ) {

                throw new HttpsError(
                    "permission-denied",
                    "Employee account is inactive."
                );

            }


            // =====================================
            // Validate PIN
            // =====================================

            if (
                String(
                    employee.pin ??
                    ""
                ) !==
                pin
            ) {

                throw new HttpsError(
                    "permission-denied",
                    "Incorrect PIN."
                );

            }


            // =====================================
            // Return Safe Employee Data
            // =====================================

            return {

                id:
                    employeeDocument.id,

                employeeNumber:
                    employee.employeeNumber ??
                    "",

                name:
                    employee.name ??
                    "",

                department:
                    employee.department ??
                    "",

                role:
                    employee.role ??
                    "",

                startTime:
                    employee.startTime ??
                    "",

                endTime:
                    employee.endTime ??
                    "",

                workArrangement:
                    employee.workArrangement ??
                    "Office",

                active:
                    employee.active !==
                    false

            };

        }
    );