// =====================================
// R-E-D Attendance
// Role Permissions
// =====================================


// =====================================
// Current Administrator Role
// =====================================

const currentAdministratorRole =
    sessionStorage.getItem(
        "adminRole"
    ) ?? "";


// =====================================
// Permission Map
// =====================================

const rolePermissions = {

    superAdministrator: {

        dashboard: true,

        employees: true,
        manageEmployees: true,

        attendance: true,
        reports: true,

        settings: true,
        administrators: true,
        auditLog: true

    },

    administrator: {

        dashboard: true,

        employees: true,
        manageEmployees: true,

        attendance: true,
        reports: true,

        settings: false,
        administrators: true,
        auditLog: true

    },

    manager: {

        dashboard: true,

        employees: false,
        manageEmployees: false,

        attendance: true,
        reports: true,

        settings: false,
        administrators: false,
        auditLog: false

    },

    readOnly: {

        dashboard: true,

        employees: true,
        manageEmployees: false,

        attendance: true,
        reports: true,

        settings: false,
        administrators: false,
        auditLog: false

    }

};


// =====================================
// Check Permission
// =====================================

function hasPermission(
    permissionName
) {

    const permissions =
        rolePermissions[
            currentAdministratorRole
        ];

    if (!permissions) {
        return false;
    }

    return (
        permissions[
            permissionName
        ] === true
    );

}


// =====================================
// Hide Restricted Sidebar Links
// =====================================

function applySidebarPermissions() {

    const restrictedLinks =
        document.querySelectorAll(
            "[data-permission]"
        );

    restrictedLinks.forEach(
        (link) => {

            const requiredPermission =
                link.dataset.permission;

            if (
                !hasPermission(
                    requiredPermission
                )
            ) {

                link.hidden = true;

            } else {

                link.hidden = false;

            }

        }
    );

}


// =====================================
// Protect Current Page
// =====================================

function protectPage(
    requiredPermission
) {

    if (
        hasPermission(
            requiredPermission
        )
    ) {

        return true;

    }

    alert(
        "You do not have permission to access this page."
    );

    window.location.replace(
        "admin-v2.html"
    );

    return false;

}


// =====================================
// Exports
// =====================================

export {
    currentAdministratorRole,
    hasPermission,
    applySidebarPermissions,
    protectPage
};
