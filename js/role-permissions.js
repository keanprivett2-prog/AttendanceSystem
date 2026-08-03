// =====================================
// R-E-D Attendance
// Role Permissions
// =====================================


// =====================================
// Normalize Administrator Role
// =====================================

function normalizeAdministratorRole(role) {

    const normalizedRole =
        String(role ?? "")
            .trim()
            .toLowerCase()
            .replace(
                /[^a-z0-9]/g,
                ""
            );

    if (
        normalizedRole ===
        "superadministrator"
    ) {

        return "superAdministrator";

    }

    if (
        normalizedRole ===
        "superadmin"
    ) {

        return "superAdministrator";

    }

    if (
        normalizedRole ===
        "administrator"
    ) {

        return "administrator";

    }

    if (
        normalizedRole ===
        "manager"
    ) {

        return "manager";

    }

    if (
        normalizedRole ===
        "readonly"
    ) {

        return "readOnly";

    }

    return "";

}


// =====================================
// Current Administrator Role
// =====================================

const storedAdministratorRole =
    sessionStorage.getItem(
        "adminRole"
    );

const currentAdministratorRole =
    normalizeAdministratorRole(
        storedAdministratorRole
    );


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

        console.error(
            "Administrator role not recognised:",
            storedAdministratorRole
        );

        return false;

    }

    return (
        permissions[
            permissionName
        ] === true
    );

}


// =====================================
// Apply Sidebar Permissions
// =====================================

function applySidebarPermissions() {

    const permissionLinks =
        document.querySelectorAll(
            "[data-permission]"
        );

    permissionLinks.forEach(
        (link) => {

            const requiredPermission =
                link.dataset.permission;

            link.hidden =
                !hasPermission(
                    requiredPermission
                );

        }
    );

}


// =====================================
// Protect Current Page
// =====================================

function protectPage(
    requiredPermission
) {

    const adminLoggedIn =
        sessionStorage.getItem(
            "adminLoggedIn"
        );

    if (
        adminLoggedIn !== "true"
    ) {

        window.location.replace(
            "admin-login.html"
        );

        return false;

    }

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
