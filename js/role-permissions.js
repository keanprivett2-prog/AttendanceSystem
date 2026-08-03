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
        settings: true,
        administrators: true,
        employees: true,
        attendance: true,
        reports: true,
        auditLog: true
    },

    administrator: {
        settings: false,
        administrators: true,
        employees: true,
        attendance: true,
        reports: true,
        auditLog: true
    },

    manager: {
        settings: false,
        administrators: false,
        employees: false,
        attendance: true,
        reports: true,
        auditLog: false
    },

    readOnly: {
        settings: false,
        administrators: false,
        employees: true,
        attendance: true,
        reports: true,
        auditLog: false
    }

};


// =====================================
// Check Permission
// =====================================

function hasPermission(permissionName) {

    const permissions =
        rolePermissions[
            currentAdministratorRole
        ];

    if (!permissions) {
        return false;
    }

    return permissions[
        permissionName
    ] === true;

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
