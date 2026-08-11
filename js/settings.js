import "./admin-session.js";


// =====================================
// R-E-D Attendance
// Settings
// =====================================


// =====================================
// Firebase
// =====================================

import {
    db,
    auth
} from "../firebase/firebase.js";

import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    applySidebarPermissions,
    protectPage
} from "./role-permissions.js";


// =====================================
// Main Page Elements
// =====================================

const settingsForm =
    document.getElementById(
        "settingsForm"
    );

const companyNameInput =
    document.getElementById(
        "companyName"
    );

const standardStartTimeInput =
    document.getElementById(
        "standardStartTime"
    );

    const standardEndTimeInput =
    document.getElementById(
        "standardEndTime"
    );

const lateThresholdInput =
    document.getElementById(
        "lateThreshold"
    );

const settingsMessage =
    document.getElementById(
        "settingsMessage"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const saveSettingsButton =
    document.getElementById(
        "saveSettingsButton"
    );


// =====================================
// Company Logo Elements
// =====================================

const companyLogoInput =
    document.getElementById(
        "companyLogo"
    );

const companyLogoPreview =
    document.getElementById(
        "companyLogoPreview"
    );

const noCompanyLogoMessage =
    document.getElementById(
        "noCompanyLogoMessage"
    );

const removeCompanyLogoButton =
    document.getElementById(
        "removeCompanyLogoButton"
    );


// =====================================
// Working Week Elements
// =====================================

const workMonday =
    document.getElementById(
        "workMonday"
    );

const workTuesday =
    document.getElementById(
        "workTuesday"
    );

const workWednesday =
    document.getElementById(
        "workWednesday"
    );

const workThursday =
    document.getElementById(
        "workThursday"
    );

const workFriday =
    document.getElementById(
        "workFriday"
    );

const workSaturday =
    document.getElementById(
        "workSaturday"
    );

const workSunday =
    document.getElementById(
        "workSunday"
    );


// =====================================
// Attendance Behaviour Trend Elements
// =====================================

const consecutiveLateThresholdInput =
    document.getElementById(
        "consecutiveLateThreshold"
    );

const frequentEarlyExitThresholdInput =
    document.getElementById(
        "frequentEarlyExitThreshold"
    );

const weekdayPatternMinRecordsInput =
    document.getElementById(
        "weekdayPatternMinRecords"
    );

const weekdayPatternPercentageInput =
    document.getElementById(
        "weekdayPatternPercentage"
    );

const mondayFridayMinRecordsInput =
    document.getElementById(
        "mondayFridayMinRecords"
    );

const mondayFridayPercentageInput =
    document.getElementById(
        "mondayFridayPercentage"
    );

const frequentAbsenceThresholdInput =
    document.getElementById(
        "frequentAbsenceThreshold"
    );

const frequentAbsenceLookbackDaysInput =
    document.getElementById(
        "frequentAbsenceLookbackDays"
    );

const shortWorkdayHoursInput =
    document.getElementById(
        "shortWorkdayHours"
    );

const shortWorkdayThresholdInput =
    document.getElementById(
        "shortWorkdayThreshold"
    );

const shortWorkdayLookbackDaysInput =
    document.getElementById(
        "shortWorkdayLookbackDays"
    );


// =====================================
// Organisation Structure Elements
// =====================================

const newDepartmentNameInput =
    document.getElementById(
        "newDepartmentName"
    );

const addDepartmentButton =
    document.getElementById(
        "addDepartmentButton"
    );

const departmentList =
    document.getElementById(
        "departmentList"
    );

const newEmployeeRoleNameInput =
    document.getElementById(
        "newEmployeeRoleName"
    );

const addEmployeeRoleButton =
    document.getElementById(
        "addEmployeeRoleButton"
    );

const employeeRoleList =
    document.getElementById(
        "employeeRoleList"
    );


// =====================================
// Collapsible Section Elements
// =====================================

const sectionToggleButtons =
    document.querySelectorAll(
        ".section-toggle-btn"
    );


// =====================================
// Page State
// =====================================

let selectedCompanyLogoData =
    "";

let departments =
    [];

let employeeRoles =
    [];


// =====================================
// Initialize Settings Page
// =====================================

initializeSettingsPage();

function initializeSettingsPage() {

    if (
        !protectPage(
            "settings"
        )
    ) {

        return;

    }

    applySidebarPermissions();


    // =====================================
    // Main Settings Form
    // =====================================

    if (
        settingsForm
    ) {

        settingsForm.addEventListener(
            "submit",
            saveSettings
        );

    }


    // =====================================
    // Logout
    // =====================================

    if (
        logoutButton
    ) {

        logoutButton.addEventListener(
            "click",
            logoutAdministrator
        );

    }


    // =====================================
    // Company Logo
    // =====================================

    if (
        companyLogoInput
    ) {

        companyLogoInput.addEventListener(
            "change",
            previewCompanyLogo
        );

    }

    if (
        removeCompanyLogoButton
    ) {

        removeCompanyLogoButton.addEventListener(
            "click",
            removeCompanyLogo
        );

    }


    // =====================================
    // Departments
    // =====================================

    if (
        addDepartmentButton
    ) {

        addDepartmentButton.addEventListener(
            "click",
            addDepartment
        );

    }

    if (
        newDepartmentNameInput
    ) {

        newDepartmentNameInput.addEventListener(
            "keydown",
            function (
                event
            ) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    addDepartment();

                }

            }
        );

    }

    if (
        departmentList
    ) {

        departmentList.addEventListener(
            "click",
            handleDepartmentListClick
        );

    }


    // =====================================
    // Employee Roles
    // =====================================

    if (
        addEmployeeRoleButton
    ) {

        addEmployeeRoleButton.addEventListener(
            "click",
            addEmployeeRole
        );

    }

    if (
        newEmployeeRoleNameInput
    ) {

        newEmployeeRoleNameInput.addEventListener(
            "keydown",
            function (
                event
            ) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    addEmployeeRole();

                }

            }
        );

    }

    if (
        employeeRoleList
    ) {

        employeeRoleList.addEventListener(
            "click",
            handleEmployeeRoleListClick
        );

    }


    // =====================================
    // Collapsible Sections
    // =====================================

    sectionToggleButtons.forEach(
        function (
            button
        ) {

            button.addEventListener(
                "click",
                toggleSettingsSection
            );

        }
    );


    // =====================================
    // Load Page Data
    // =====================================

    loadSettings();

    loadOrganisationStructure();

}


// =====================================
// Toggle Settings Section
// =====================================

function toggleSettingsSection(
    event
) {

    const button =
        event.currentTarget;

    const targetId =
        button.dataset.target;

    const content =
        document.getElementById(
            targetId
        );

    if (
        !content
    ) {

        return;

    }

    const isCollapsed =
        content.classList.toggle(
            "collapsed"
        );

    button.textContent =
        isCollapsed
            ?
            "Expand"
            :
            "Collapse";

    button.setAttribute(
        "aria-expanded",
        String(
            !isCollapsed
        )
    );

}


// =====================================
// Load Attendance Settings
// =====================================

async function loadSettings() {

    try {

        showMessage(
            "Loading settings...",
            "info"
        );

        const settingsReference =
            doc(
                db,
                "systemSettings",
                "attendance"
            );

        const settingsSnapshot =
            await getDoc(
                settingsReference
            );

        if (
            !settingsSnapshot.exists()
        ) {

            setDefaultWorkingDays();

            showMessage(
                "",
                "info"
            );

            return;

        }

        const settings =
            settingsSnapshot.data();


        // =====================================
        // Company / Attendance Rules
        // =====================================

        companyNameInput.value =
            settings.companyName ??
            "";

        standardStartTimeInput.value =
            settings.standardStartTime ??
            "08:00";

            standardEndTimeInput.value =
    settings.standardEndTime ??
    "17:00";

        lateThresholdInput.value =
            settings.lateThreshold ??
            "08:15";


        // =====================================
        // Attendance Behaviour Trends
        // =====================================

        consecutiveLateThresholdInput.value =
            settings.consecutiveLateThreshold ??
            3;

        frequentEarlyExitThresholdInput.value =
            settings.frequentEarlyExitThreshold ??
            3;

        weekdayPatternMinRecordsInput.value =
            settings.weekdayPatternMinRecords ??
            3;

        weekdayPatternPercentageInput.value =
            settings.weekdayPatternPercentage ??
            50;

        mondayFridayMinRecordsInput.value =
            settings.mondayFridayMinRecords ??
            3;

        mondayFridayPercentageInput.value =
            settings.mondayFridayPercentage ??
            60;

        frequentAbsenceThresholdInput.value =
            settings.frequentAbsenceThreshold ??
            5;

        frequentAbsenceLookbackDaysInput.value =
            settings.frequentAbsenceLookbackDays ??
            30;

        shortWorkdayHoursInput.value =
            settings.shortWorkdayHours ??
            6;

        shortWorkdayThresholdInput.value =
            settings.shortWorkdayThreshold ??
            3;

        shortWorkdayLookbackDaysInput.value =
            settings.shortWorkdayLookbackDays ??
            30;


        // =====================================
        // Company Logo
        // =====================================

        loadCompanyLogo(
            settings.companyLogo
        );


        // =====================================
        // Working Week
        // =====================================

        loadWorkingDays(
            settings.workingDays
        );

        showMessage(
            "",
            "info"
        );

    } catch (
        error
    ) {

        console.error(
            "Load settings error:",
            error
        );

        showMessage(
            "The settings could not be loaded.",
            "error"
        );

    }

}


// =====================================
// Load Organisation Structure
// =====================================

async function loadOrganisationStructure() {

    try {

        const organisationReference =
            doc(
                db,
                "systemSettings",
                "organisation"
            );

        const organisationSnapshot =
            await getDoc(
                organisationReference
            );

        if (
            !organisationSnapshot.exists()
        ) {

            departments =
                [];

            employeeRoles =
                [];

            renderDepartments();

            renderEmployeeRoles();

            return;

        }

        const organisation =
            organisationSnapshot.data();

        departments =
            Array.isArray(
                organisation.departments
            )
                ?
                organisation.departments
                :
                [];

        employeeRoles =
            Array.isArray(
                organisation.employeeRoles
            )
                ?
                organisation.employeeRoles
                :
                [];

        sortOrganisationStructure();

        renderDepartments();

        renderEmployeeRoles();

    } catch (
        error
    ) {

        console.error(
            "Load organisation structure error:",
            error
        );

        showMessage(
            "Departments and employee roles could not be loaded.",
            "error"
        );

    }

}


// =====================================
// Save Organisation Structure
// =====================================

async function saveOrganisationStructure() {

    const organisationReference =
        doc(
            db,
            "systemSettings",
            "organisation"
        );

    await setDoc(
        organisationReference,
        {

            departments:
                departments,

            employeeRoles:
                employeeRoles

        },
        {
            merge:
                true
        }
    );

}


// =====================================
// Sort Organisation Structure
// =====================================

function sortOrganisationStructure() {

    departments.sort(
        function (
            firstDepartment,
            secondDepartment
        ) {

            return firstDepartment.localeCompare(
                secondDepartment
            );

        }
    );

    employeeRoles.sort(
        function (
            firstRole,
            secondRole
        ) {

            return firstRole.localeCompare(
                secondRole
            );

        }
    );

}


// =====================================
// Add Department
// =====================================

async function addDepartment() {

    if (
        !newDepartmentNameInput
    ) {

        return;

    }

    const departmentName =
        newDepartmentNameInput.value
            .trim();

    if (
        departmentName ===
        ""
    ) {

        showMessage(
            "Please enter a department name.",
            "error"
        );

        return;

    }

    const departmentExists =
        departments.some(
            function (
                department
            ) {

                return (
                    department
                        .toLowerCase() ===
                    departmentName
                        .toLowerCase()
                );

            }
        );

    if (
        departmentExists
    ) {

        showMessage(
            "That department already exists.",
            "error"
        );

        return;

    }

    try {

        addDepartmentButton.disabled =
            true;

        departments.push(
            departmentName
        );

        sortOrganisationStructure();

        await saveOrganisationStructure();

        newDepartmentNameInput.value =
            "";

        renderDepartments();

        showMessage(
            `Department "${departmentName}" added successfully.`,
            "success"
        );

    } catch (
        error
    ) {

        console.error(
            "Add department error:",
            error
        );

        departments =
            departments.filter(
                function (
                    department
                ) {

                    return (
                        department !==
                        departmentName
                    );

                }
            );

        renderDepartments();

        showMessage(
            "The department could not be added.",
            "error"
        );

    } finally {

        addDepartmentButton.disabled =
            false;

    }

}


// =====================================
// Department List Click
// =====================================

function handleDepartmentListClick(
    event
) {

    const removeButton =
        event.target.closest(
            ".remove-department-btn"
        );

    if (
        !removeButton
    ) {

        return;

    }

    const departmentName =
        removeButton.dataset.department;

    removeDepartment(
        departmentName
    );

}


// =====================================
// Remove Department
// =====================================

async function removeDepartment(
    departmentName
) {

    const confirmed =
        confirm(
            `Remove the department "${departmentName}"?`
        );

    if (
        !confirmed
    ) {

        return;

    }

    const previousDepartments =
        [
            ...departments
        ];

    try {

        departments =
            departments.filter(
                function (
                    department
                ) {

                    return (
                        department !==
                        departmentName
                    );

                }
            );

        await saveOrganisationStructure();

        renderDepartments();

        showMessage(
            `Department "${departmentName}" removed.`,
            "success"
        );

    } catch (
        error
    ) {

        console.error(
            "Remove department error:",
            error
        );

        departments =
            previousDepartments;

        renderDepartments();

        showMessage(
            "The department could not be removed.",
            "error"
        );

    }

}


// =====================================
// Render Departments
// =====================================

function renderDepartments() {

    if (
        !departmentList
    ) {

        return;

    }

    departmentList.innerHTML =
        "";

    if (
        departments.length ===
        0
    ) {

        departmentList.innerHTML = `
            <p class="empty-row">
                No departments have been added yet.
            </p>
        `;

        return;

    }

    departments.forEach(
        function (
            department
        ) {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "settings-list-item";

            const name =
                document.createElement(
                    "span"
                );

            name.textContent =
                department;

            const removeButton =
                document.createElement(
                    "button"
                );

            removeButton.type =
                "button";

            removeButton.className =
                "remove-department-btn";

            removeButton.dataset.department =
                department;

            removeButton.textContent =
                "Remove";

            item.appendChild(
                name
            );

            item.appendChild(
                removeButton
            );

            departmentList.appendChild(
                item
            );

        }
    );

}


// =====================================
// Add Employee Role
// =====================================

async function addEmployeeRole() {

    if (
        !newEmployeeRoleNameInput
    ) {

        return;

    }

    const roleName =
        newEmployeeRoleNameInput.value
            .trim();

    if (
        roleName ===
        ""
    ) {

        showMessage(
            "Please enter an employee role.",
            "error"
        );

        return;

    }

    const roleExists =
        employeeRoles.some(
            function (
                role
            ) {

                return (
                    role
                        .toLowerCase() ===
                    roleName
                        .toLowerCase()
                );

            }
        );

    if (
        roleExists
    ) {

        showMessage(
            "That employee role already exists.",
            "error"
        );

        return;

    }

    try {

        addEmployeeRoleButton.disabled =
            true;

        employeeRoles.push(
            roleName
        );

        sortOrganisationStructure();

        await saveOrganisationStructure();

        newEmployeeRoleNameInput.value =
            "";

        renderEmployeeRoles();

        showMessage(
            `Employee role "${roleName}" added successfully.`,
            "success"
        );

    } catch (
        error
    ) {

        console.error(
            "Add employee role error:",
            error
        );

        employeeRoles =
            employeeRoles.filter(
                function (
                    role
                ) {

                    return (
                        role !==
                        roleName
                    );

                }
            );

        renderEmployeeRoles();

        showMessage(
            "The employee role could not be added.",
            "error"
        );

    } finally {

        addEmployeeRoleButton.disabled =
            false;

    }

}


// =====================================
// Employee Role List Click
// =====================================

function handleEmployeeRoleListClick(
    event
) {

    const removeButton =
        event.target.closest(
            ".remove-employee-role-btn"
        );

    if (
        !removeButton
    ) {

        return;

    }

    const roleName =
        removeButton.dataset.role;

    removeEmployeeRole(
        roleName
    );

}


// =====================================
// Remove Employee Role
// =====================================

async function removeEmployeeRole(
    roleName
) {

    const confirmed =
        confirm(
            `Remove the employee role "${roleName}"?`
        );

    if (
        !confirmed
    ) {

        return;

    }

    const previousEmployeeRoles =
        [
            ...employeeRoles
        ];

    try {

        employeeRoles =
            employeeRoles.filter(
                function (
                    role
                ) {

                    return (
                        role !==
                        roleName
                    );

                }
            );

        await saveOrganisationStructure();

        renderEmployeeRoles();

        showMessage(
            `Employee role "${roleName}" removed.`,
            "success"
        );

    } catch (
        error
    ) {

        console.error(
            "Remove employee role error:",
            error
        );

        employeeRoles =
            previousEmployeeRoles;

        renderEmployeeRoles();

        showMessage(
            "The employee role could not be removed.",
            "error"
        );

    }

}


// =====================================
// Render Employee Roles
// =====================================

function renderEmployeeRoles() {

    if (
        !employeeRoleList
    ) {

        return;

    }

    employeeRoleList.innerHTML =
        "";

    if (
        employeeRoles.length ===
        0
    ) {

        employeeRoleList.innerHTML = `
            <p class="empty-row">
                No employee roles have been added yet.
            </p>
        `;

        return;

    }

    employeeRoles.forEach(
        function (
            role
        ) {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "settings-list-item";

            const name =
                document.createElement(
                    "span"
                );

            name.textContent =
                role;

            const removeButton =
                document.createElement(
                    "button"
                );

            removeButton.type =
                "button";

            removeButton.className =
                "remove-employee-role-btn";

            removeButton.dataset.role =
                role;

            removeButton.textContent =
                "Remove";

            item.appendChild(
                name
            );

            item.appendChild(
                removeButton
            );

            employeeRoleList.appendChild(
                item
            );

        }
    );

}


// =====================================
// Load Company Logo
// =====================================

function loadCompanyLogo(
    companyLogo
) {

    if (
        companyLogo
    ) {

        selectedCompanyLogoData =
            companyLogo;

        companyLogoPreview.src =
            companyLogo;

        companyLogoPreview.hidden =
            false;

        noCompanyLogoMessage.style.display =
            "none";

        if (
            removeCompanyLogoButton
        ) {

            removeCompanyLogoButton.hidden =
                false;

        }

        return;

    }

    selectedCompanyLogoData =
        "";

    companyLogoPreview.removeAttribute(
        "src"
    );

    companyLogoPreview.hidden =
        true;

    noCompanyLogoMessage.style.display =
        "block";

    if (
        removeCompanyLogoButton
    ) {

        removeCompanyLogoButton.hidden =
            true;

    }

}


// =====================================
// Load Working Days
// =====================================

function loadWorkingDays(
    workingDays
) {

    const selectedDays =
        Array.isArray(
            workingDays
        )
            ?
            workingDays
            :
            [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday"
            ];

    workMonday.checked =
        selectedDays.includes(
            "Monday"
        );

    workTuesday.checked =
        selectedDays.includes(
            "Tuesday"
        );

    workWednesday.checked =
        selectedDays.includes(
            "Wednesday"
        );

    workThursday.checked =
        selectedDays.includes(
            "Thursday"
        );

    workFriday.checked =
        selectedDays.includes(
            "Friday"
        );

    workSaturday.checked =
        selectedDays.includes(
            "Saturday"
        );

    workSunday.checked =
        selectedDays.includes(
            "Sunday"
        );

}


// =====================================
// Default Working Days
// =====================================

function setDefaultWorkingDays() {

    loadWorkingDays(
        [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday"
        ]
    );

}


// =====================================
// Get Selected Working Days
// =====================================

function getSelectedWorkingDays() {

    const workingDays =
        [];

    if (
        workMonday.checked
    ) {

        workingDays.push(
            "Monday"
        );

    }

    if (
        workTuesday.checked
    ) {

        workingDays.push(
            "Tuesday"
        );

    }

    if (
        workWednesday.checked
    ) {

        workingDays.push(
            "Wednesday"
        );

    }

    if (
        workThursday.checked
    ) {

        workingDays.push(
            "Thursday"
        );

    }

    if (
        workFriday.checked
    ) {

        workingDays.push(
            "Friday"
        );

    }

    if (
        workSaturday.checked
    ) {

        workingDays.push(
            "Saturday"
        );

    }

    if (
        workSunday.checked
    ) {

        workingDays.push(
            "Sunday"
        );

    }

    return workingDays;

}


// =====================================
// Save Main Settings
// =====================================

async function saveSettings(
    event
) {

    event.preventDefault();


    // =====================================
    // Company / Attendance Settings
    // =====================================

    const companyName =
        companyNameInput.value
            .trim();

    const standardStartTime =
        standardStartTimeInput.value;

        const standardEndTime =
    standardEndTimeInput.value;

    if (
    !standardStartTime ||
    !standardEndTime
) {

    showMessage(
        "Please enter both the standard start and end times.",
        "error"
    );

    return;
}

if (
    standardEndTime <=
    standardStartTime
) {

    showMessage(
        "Standard Work End Time must be later than Standard Start Time.",
        "error"
    );

    return;
}

    const lateThreshold =
        lateThresholdInput.value;

    const workingDays =
        getSelectedWorkingDays();


    // =====================================
    // Attendance Trend Settings
    // =====================================

    const consecutiveLateThreshold =
        Number(
            consecutiveLateThresholdInput.value
        );

    const frequentEarlyExitThreshold =
        Number(
            frequentEarlyExitThresholdInput.value
        );

    const weekdayPatternMinRecords =
        Number(
            weekdayPatternMinRecordsInput.value
        );

    const weekdayPatternPercentage =
        Number(
            weekdayPatternPercentageInput.value
        );

    const mondayFridayMinRecords =
        Number(
            mondayFridayMinRecordsInput.value
        );

    const mondayFridayPercentage =
        Number(
            mondayFridayPercentageInput.value
        );

    const frequentAbsenceThreshold =
        Number(
            frequentAbsenceThresholdInput.value
        );

    const frequentAbsenceLookbackDays =
        Number(
            frequentAbsenceLookbackDaysInput.value
        );

    const shortWorkdayHours =
        Number(
            shortWorkdayHoursInput.value
        );

    const shortWorkdayThreshold =
        Number(
            shortWorkdayThresholdInput.value
        );

    const shortWorkdayLookbackDays =
        Number(
            shortWorkdayLookbackDaysInput.value
        );


    // =====================================
    // Validation
    // =====================================

    if (
        companyName ===
        ""
    ) {

        showMessage(
            "Please enter a company name.",
            "error"
        );

        return;

    }

    if (
        !standardStartTime ||
        !lateThreshold
    ) {

        showMessage(
            "Please select both attendance times.",
            "error"
        );

        return;

    }

    if (
        lateThreshold <
        standardStartTime
    ) {

        showMessage(
            "Late After cannot be earlier than the standard start time.",
            "error"
        );

        return;

    }

    if (
        workingDays.length ===
        0
    ) {

        showMessage(
            "Please select at least one working day.",
            "error"
        );

        return;

    }


    // =====================================
    // Trend Validation
    // =====================================

    const trendValues =
        [
            consecutiveLateThreshold,
            frequentEarlyExitThreshold,
            weekdayPatternMinRecords,
            weekdayPatternPercentage,
            mondayFridayMinRecords,
            mondayFridayPercentage,
            frequentAbsenceThreshold,
            frequentAbsenceLookbackDays,
            shortWorkdayHours,
            shortWorkdayThreshold,
            shortWorkdayLookbackDays
        ];

    const hasInvalidTrendValue =
        trendValues.some(
            function (
                value
            ) {

                return (
                    !Number.isFinite(
                        value
                    )
                    ||
                    value <=
                    0
                );

            }
        );

    if (
        hasInvalidTrendValue
    ) {

        showMessage(
            "Please enter valid values for all attendance trend settings.",
            "error"
        );

        return;

    }

    if (
        weekdayPatternPercentage >
            100 ||
        mondayFridayPercentage >
            100
    ) {

        showMessage(
            "Trend percentages cannot be greater than 100%.",
            "error"
        );

        return;

    }


    // =====================================
    // Save
    // =====================================

    try {

        setSaveButtonState(
            true
        );

        showMessage(
            "Saving settings...",
            "info"
        );

        const settingsReference =
            doc(
                db,
                "systemSettings",
                "attendance"
            );

        const settingsData =
            {

                companyName:
                    companyName,

                standardStartTime:
                    standardStartTime,

                    standardEndTime:
    standardEndTime,

                lateThreshold:
                    lateThreshold,

                workingDays:
                    workingDays,

                companyLogo:
                    selectedCompanyLogoData,

                consecutiveLateThreshold:
                    consecutiveLateThreshold,

                frequentEarlyExitThreshold:
                    frequentEarlyExitThreshold,

                weekdayPatternMinRecords:
                    weekdayPatternMinRecords,

                weekdayPatternPercentage:
                    weekdayPatternPercentage,

                mondayFridayMinRecords:
                    mondayFridayMinRecords,

                mondayFridayPercentage:
                    mondayFridayPercentage,

                frequentAbsenceThreshold:
                    frequentAbsenceThreshold,

                frequentAbsenceLookbackDays:
                    frequentAbsenceLookbackDays,

                shortWorkdayHours:
                    shortWorkdayHours,

                shortWorkdayThreshold:
                    shortWorkdayThreshold,

                shortWorkdayLookbackDays:
                    shortWorkdayLookbackDays

            };

        await setDoc(
            settingsReference,
            settingsData,
            {
                merge:
                    true
            }
        );

        showMessage(
            "Settings saved successfully.",
            "success"
        );

    } catch (
        error
    ) {

        console.error(
            "Save settings error:",
            error
        );

        showMessage(
            "The settings could not be saved.",
            "error"
        );

    } finally {

        setSaveButtonState(
            false
        );

    }

}


// =====================================
// Save Button State
// =====================================

function setSaveButtonState(
    isSaving
) {

    if (
        !saveSettingsButton
    ) {

        return;

    }

    saveSettingsButton.disabled =
        isSaving;

    saveSettingsButton.textContent =
        isSaving
            ?
            "Saving..."
            :
            "Save Settings";

}


// =====================================
// Preview Company Logo
// =====================================

function previewCompanyLogo() {

    const selectedFile =
        companyLogoInput.files[0];

    if (
        !selectedFile
    ) {

        return;

    }

    const allowedTypes =
        [
            "image/png",
            "image/jpeg",
            "image/webp"
        ];

    if (
        !allowedTypes.includes(
            selectedFile.type
        )
    ) {

        companyLogoInput.value =
            "";

        showMessage(
            "Please select a PNG, JPG or WEBP image.",
            "error"
        );

        return;

    }

    const maximumFileSize =
        500 *
        1024;

    if (
        selectedFile.size >
        maximumFileSize
    ) {

        companyLogoInput.value =
            "";

        showMessage(
            "The logo must be smaller than 500 KB.",
            "error"
        );

        return;

    }

    const fileReader =
        new FileReader();

    fileReader.onload =
        function (
            event
        ) {

            selectedCompanyLogoData =
                event.target.result;

            companyLogoPreview.src =
                selectedCompanyLogoData;

            companyLogoPreview.hidden =
                false;

            noCompanyLogoMessage.style.display =
                "none";

            if (
                removeCompanyLogoButton
            ) {

                removeCompanyLogoButton.hidden =
                    false;

            }

            showMessage(
                "Logo selected. Click Save Settings to store it.",
                "info"
            );

        };

    fileReader.onerror =
        function () {

            showMessage(
                "The logo could not be read.",
                "error"
            );

        };

    fileReader.readAsDataURL(
        selectedFile
    );

}


// =====================================
// Remove Company Logo
// =====================================

async function removeCompanyLogo() {

    const confirmed =
        confirm(
            "Are you sure you want to remove the company logo?"
        );

    if (
        !confirmed
    ) {

        return;

    }

    try {

        removeCompanyLogoButton.disabled =
            true;

        showMessage(
            "Removing logo...",
            "info"
        );

        selectedCompanyLogoData =
            "";

        companyLogoInput.value =
            "";

        companyLogoPreview.removeAttribute(
            "src"
        );

        companyLogoPreview.hidden =
            true;

        noCompanyLogoMessage.style.display =
            "block";

        const settingsReference =
            doc(
                db,
                "systemSettings",
                "attendance"
            );

        await setDoc(
            settingsReference,
            {
                companyLogo:
                    ""
            },
            {
                merge:
                    true
            }
        );

        removeCompanyLogoButton.hidden =
            true;

        showMessage(
            "Company logo removed successfully.",
            "success"
        );

    } catch (
        error
    ) {

        console.error(
            "Remove logo error:",
            error
        );

        showMessage(
            "The company logo could not be removed.",
            "error"
        );

    } finally {

        removeCompanyLogoButton.disabled =
            false;

    }

}


// =====================================
// Message
// =====================================

function showMessage(
    message,
    type
) {

    if (
        !settingsMessage
    ) {

        return;

    }

    settingsMessage.textContent =
        message;

    if (
        type ===
        "success"
    ) {

        settingsMessage.style.color =
            "green";

    } else if (
        type ===
        "error"
    ) {

        settingsMessage.style.color =
            "red";

    } else {

        settingsMessage.style.color =
            "#0b5ed7";

    }

}


// =====================================
// Administrator Logout
// =====================================

async function logoutAdministrator() {

    try {

        if (
            logoutButton
        ) {

            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "Logging out...";

        }

        await signOut(
            auth
        );

        sessionStorage.clear();

        window.location.replace(
            "admin-login.html"
        );

    } catch (
        error
    ) {

        console.error(
            "Logout error:",
            error
        );

        if (
            logoutButton
        ) {

            logoutButton.disabled =
                false;

            logoutButton.textContent =
                "Logout";

        }

        showMessage(
            "Unable to log out. Please try again.",
            "error"
        );

    }

}