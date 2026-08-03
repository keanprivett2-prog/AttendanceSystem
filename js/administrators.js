// =====================================
// R-E-D Attendance
// Administrators
// =====================================


// =====================================
// Page Elements
// =====================================

const addAdministratorButton =
    document.getElementById(
        "addAdministratorButton"
    );

const administratorModal =
    document.getElementById(
        "administratorModal"
    );

const closeAdministratorModalButton =
    document.getElementById(
        "closeAdministratorModalButton"
    );

const cancelAdministratorButton =
    document.getElementById(
        "cancelAdministratorButton"
    );

const administratorForm =
    document.getElementById(
        "administratorForm"
    );


// =====================================
// Start Page
// =====================================

initializeAdministratorsPage();

function initializeAdministratorsPage() {

    addAdministratorButton.addEventListener(
        "click",
        openAdministratorModal
    );

    closeAdministratorModalButton.addEventListener(
        "click",
        closeAdministratorModal
    );

    cancelAdministratorButton.addEventListener(
        "click",
        closeAdministratorModal
    );

}


// =====================================
// Open Modal
// =====================================

function openAdministratorModal() {

    administratorModal.hidden = false;

}


// =====================================
// Close Modal
// =====================================

function closeAdministratorModal() {

    administratorModal.hidden = true;

    administratorForm.reset();

}
