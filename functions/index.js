/* eslint-disable max-len */

// =====================================
// R-E-D Attendance
// Firebase Cloud Functions
// =====================================

const {
  setGlobalOptions,
} = require(
    "firebase-functions/v2",
);

const {
  onCall,
  HttpsError,
} = require(
    "firebase-functions/v2/https",
);

const {
  initializeApp,
} = require(
    "firebase-admin/app",
);

const {
  getAuth,
} = require(
    "firebase-admin/auth",
);

const {
  getFirestore,
  FieldValue,
} = require(
    "firebase-admin/firestore",
);


// =====================================
// Initialize Firebase Admin
// =====================================

initializeApp();


// =====================================
// Global Function Options
// =====================================

setGlobalOptions({
  maxInstances: 10,
});


// =====================================
// Reset Super Administrator Password
// =====================================

exports.resetSuperAdministratorPassword =
    onCall(
        async (
            request,
        ) => {
          // =====================================
          // Authentication Check
          // =====================================

          if (
            !request.auth
          ) {
            throw new HttpsError(
                "unauthenticated",
                "You must be signed in to perform this action.",
            );
          }


          const callerUid =
                request.auth.uid;

          const requestData =
    request.data ||
    {};

          const targetUid =
    String(
        requestData.targetUid ||
        "",
    ).trim();

          const temporaryPassword =
    String(
        requestData.temporaryPassword ||
        "",
    );

          // =====================================
          // Validate Request
          // =====================================

          if (
            targetUid ===
                ""
          ) {
            throw new HttpsError(
                "invalid-argument",
                "The administrator account was not specified.",
            );
          }


          if (
            temporaryPassword.length <
                8
          ) {
            throw new HttpsError(
                "invalid-argument",
                "Temporary password must contain at least 8 characters.",
            );
          }


          if (
            callerUid ===
                targetUid
          ) {
            throw new HttpsError(
                "permission-denied",
                "You cannot reset your own password from this screen.",
            );
          }


          const db =
                getFirestore();

          const auth =
                getAuth();


          // =====================================
          // Verify Calling Administrator
          // =====================================

          const callerReference =
                db
                    .collection(
                        "administrators",
                    )
                    .doc(
                        callerUid,
                    );

          const callerSnapshot =
                await callerReference.get();


          if (
            !callerSnapshot.exists
          ) {
            throw new HttpsError(
                "permission-denied",
                "Your administrator profile could not be verified.",
            );
          }


          const callerAdministrator =
                callerSnapshot.data();


          if (
            callerAdministrator.role !==
                "superAdministrator"
          ) {
            throw new HttpsError(
                "permission-denied",
                "Only a Super Administrator can reset administrator passwords.",
            );
          }


          if (
            callerAdministrator.status ===
                "Disabled"
          ) {
            throw new HttpsError(
                "permission-denied",
                "Your administrator account is disabled.",
            );
          }


          // =====================================
          // Verify Target Administrator
          // =====================================

          const targetReference =
                db
                    .collection(
                        "administrators",
                    )
                    .doc(
                        targetUid,
                    );

          const targetSnapshot =
                await targetReference.get();


          if (
            !targetSnapshot.exists
          ) {
            throw new HttpsError(
                "not-found",
                "The administrator account could not be found.",
            );
          }


          const targetAdministrator =
                targetSnapshot.data();


          if (
            targetAdministrator.role !==
                "superAdministrator"
          ) {
            throw new HttpsError(
                "permission-denied",
                "This reset option is currently limited to Super Administrators.",
            );
          }


          if (
            targetAdministrator.status ===
                "Disabled"
          ) {
            throw new HttpsError(
                "failed-precondition",
                "The administrator account is disabled.",
            );
          }


          // =====================================
          // Verify Firebase Authentication User
          // =====================================

          try {
            await auth.getUser(
                targetUid,
            );
          } catch (
            error
          ) {
            console.error(
                "Target Firebase Auth user lookup failed:",
                error,
            );

            throw new HttpsError(
                "not-found",
                "The Firebase Authentication account could not be found.",
            );
          }


          // =====================================
          // Change Authentication Password
          // =====================================

          try {
            await auth.updateUser(
                targetUid,
                {
                  password:
                            temporaryPassword,
                },
            );
          } catch (
            error
          ) {
            console.error(
                "Administrator password update failed:",
                error,
            );

            throw new HttpsError(
                "internal",
                "The administrator password could not be updated.",
            );
          }


          // =====================================
          // Force Password Change On Next Login
          // =====================================

          try {
            await targetReference.update(
                {
                  mustChangePassword:
                            true,

                  passwordResetAt:
                            FieldValue.serverTimestamp(),

                  passwordResetBy:
                            callerUid,
                },
            );
          } catch (
            error
          ) {
            console.error(
                "Administrator Firestore update failed:",
                error,
            );

            throw new HttpsError(
                "internal",
                "The password was changed, but the administrator record could not be updated.",
            );
          }


          // =====================================
          // Audit Log
          // =====================================

          try {
            await db
                .collection(
                    "auditLog",
                )
                .add(
                    {
                      action:
                                "Reset Administrator Password",

                      employee:
    targetAdministrator.fullName ||
    targetAdministrator.email ||
    targetUid,

                      details:
                                "Temporary administrator password assigned. Password change required at next login.",

                      administrator:
    callerAdministrator.fullName ||
    callerAdministrator.email ||
    "Super Administrator",
                      administratorUid:
                                callerUid,

                      targetAdministratorUid:
                                targetUid,

                      timestamp:
                                FieldValue.serverTimestamp(),
                    },
                );
          } catch (
            error
          ) {
            // Password reset must not fail because
            // the audit entry could not be written.

            console.error(
                "Password reset audit log failed:",
                error,
            );
          }


          // =====================================
          // Success
          // =====================================

          return {
            success:
                    true,

            message:
                    "Temporary password assigned successfully.",
          };
        },
    );
