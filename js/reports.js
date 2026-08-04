import "./admin-session.js";

// =====================================
// R-E-D Attendance
// Reports
// =====================================


// =====================================
// Firebase
// =====================================

import {
    db,
    auth
} from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    applySidebarPermissions,
    protectPage
} from "./role-permissions.js";


// =====================================
// Page Elements
// =====================================

const startDateInput =
    document.getElementById(
        "reportStartDate"
    );

const endDateInput =
    document.getElementById(
        "reportEndDate"
    );

const employeeFilter =
    document.getElementById(
        "employeeFilter"
    );

const departmentFilter =
    document.getElementById(
        "departmentFilter"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const generateReportButton =
    document.getElementById(
        "generateReportButton"
    );

const exportCsvButton =
    document.getElementById(
        "exportCsvButton"
    );

const printReportButton =
    document.getElementById(
        "printReportButton"
    );

const reportTableBody =
    document.getElementById(
        "reportTableBody"
    );

const totalRecords =
    document.getElementById(
        "totalRecords"
    );

const onTimeCount =
    document.getElementById(
        "onTimeCount"
    );

const lateCount =
    document.getElementById(
        "lateCount"
    );

const absentCount =
    document.getElementById(
        "absentCount"
    );

const attendanceRate =
    document.getElementById(
        "attendanceRate"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// =====================================
// Current Report Records
// =====================================

let currentReportRecords = [];


// =====================================
// Initialize Reports Page
// =====================================

initializeReportsPage();

function initializeReportsPage() {

    if (!protectPage("reports")) {
        return;
    }

    applySidebarPermissions();

    setDefaultDates();

    loadEmployeeFilter();

    loadDepartmentFilter();

    if (generateReportButton) {

        generateReportButton.addEventListener(
            "click",
            generateReport
        );

    }

    if (exportCsvButton) {

        exportCsvButton.addEventListener(
            "click",
            exportReportToCsv
        );

    }

    if (printReportButton) {

        printReportButton.addEventListener(
            "click",
            printReport
        );

    }

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutAdministrator
        );

    }

}


// =====================================
// Default Report Dates
// =====================================

function setDefaultDates() {

    const today =
        new Date();

    const firstDay =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

    startDateInput.value =
        formatLocalDate(firstDay);

    endDateInput.value =
        formatLocalDate(today);

}


// =====================================
// Format Local Date
// =====================================

function formatLocalDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


// =====================================
// Load Employee Filter
// =====================================

async function loadEmployeeFilter() {

    if (!employeeFilter) {
        return;
    }

    employeeFilter.innerHTML = `
        <option value="">
            Loading employees...
        </option>
    `;

    try {

        const employeeSnapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );

        const employees =
            employeeSnapshot.docs.map(
                (employeeDocument) => ({
                    id:
                        employeeDocument.id,

                    ...employeeDocument.data()
                })
            );

        employees.sort(
            (firstEmployee, secondEmployee) =>
                String(
                    firstEmployee.name ?? ""
                ).localeCompare(
                    String(
                        secondEmployee.name ?? ""
                    )
                )
        );

        employeeFilter.innerHTML = `
            <option value="">
                All Employees
            </option>
        `;

        employees.forEach(
            (employee) => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    employee.employeeNumber ?? "";

                option.textContent =
                    `${employee.employeeNumber ?? "-"} - ${employee.name ?? "Unnamed Employee"}`;

                employeeFilter.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Employee filter error:",
            error
        );

        employeeFilter.innerHTML = `
            <option value="">
                Unable to load employees
            </option>
        `;

    }

}


// =====================================
// Load Department Filter
// =====================================

async function loadDepartmentFilter() {

    if (!departmentFilter) {
        return;
    }

    departmentFilter.innerHTML = `
        <option value="">
            Loading departments...
        </option>
    `;

    try {

        const employeeSnapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );

        const departments =
            new Set();

        employeeSnapshot.forEach(
            (employeeDocument) => {

                const employeeData =
                    employeeDocument.data();

                const department =
                    String(
                        employeeData.department ?? ""
                    ).trim();

                if (department !== "") {

                    departments.add(
                        department
                    );

                }

            }
        );

        const sortedDepartments =
            Array.from(
                departments
            ).sort(
                (firstDepartment, secondDepartment) =>
                    firstDepartment.localeCompare(
                        secondDepartment
                    )
            );

        departmentFilter.innerHTML = `
            <option value="">
                All Departments
            </option>
        `;

        sortedDepartments.forEach(
            (department) => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    department;

                option.textContent =
                    department;

                departmentFilter.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Department filter error:",
            error
        );

        departmentFilter.innerHTML = `
            <option value="">
                Unable to load departments
            </option>
        `;

    }

}


// =====================================
// Generate Report
// =====================================

async function generateReport() {

    const startDate =
        startDateInput.value;

    const endDate =
        endDateInput.value;

    const selectedEmployee =
        employeeFilter.value;

    const selectedDepartment =
        departmentFilter.value;

    const selectedStatus =
        statusFilter.value;


    if (
        !startDate ||
        !endDate
    ) {

        showTableMessage(
            "Please select both a start date and an end date."
        );

        resetSummaryCards();

        return;

    }


    if (startDate > endDate) {

        showTableMessage(
            "The start date cannot be after the end date."
        );

        resetSummaryCards();

        return;

    }


    setGenerateButtonState(
        true
    );

    showTableMessage(
        "Loading attendance records..."
    );


    try {

        const attendanceQuery =
            query(
                collection(
                    db,
                    "attendance"
                ),
                where(
                    "dateKey",
                    ">=",
                    startDate
                ),
                where(
                    "dateKey",
                    "<=",
                    endDate
                ),
                orderBy(
                    "dateKey",
                    "desc"
                )
            );

        const attendanceSnapshot =
            await getDocs(
                attendanceQuery
            );

        let records =
            attendanceSnapshot.docs.map(
                (attendanceDocument) => ({
                    id:
                        attendanceDocument.id,

                    ...attendanceDocument.data()
                })
            );


        if (selectedEmployee !== "") {

            records =
                records.filter(
                    (record) =>
                        String(
                            record.employeeNumber ?? ""
                        ) ===
                        selectedEmployee
                );

        }


        if (selectedDepartment !== "") {

            records =
                records.filter(
                    (record) =>
                        String(
                            record.department ?? ""
                        ).trim() ===
                        selectedDepartment
                );

        }


        if (selectedStatus !== "") {

            records =
                records.filter(
                    (record) =>
                        normalizeStatus(
                            record.status
                        ) ===
                        normalizeStatus(
                            selectedStatus
                        )
                );

        }


        currentReportRecords =
            records;

        displayReport(
            records
        );

    } catch (error) {

        console.error(
            "Report error:",
            error
        );

        currentReportRecords =
            [];

        showTableMessage(
            "The report could not be loaded. Check the browser console."
        );

        resetSummaryCards();

    } finally {

        setGenerateButtonState(
            false
        );

    }

}


// =====================================
// Generate Button State
// =====================================

function setGenerateButtonState(
    loading
) {

    if (!generateReportButton) {
        return;
    }

    generateReportButton.disabled =
        loading;

    generateReportButton.textContent =
        loading
            ? "Generating..."
            : "Generate Report";

}


// =====================================
// Display Report
// =====================================

function displayReport(records) {

    reportTableBody.innerHTML =
        "";

    if (records.length === 0) {

        showTableMessage(
            "No attendance records were found for that date range."
        );

        resetSummaryCards();

        return;

    }

    records.forEach(
        (record) => {

            const row =
                document.createElement(
                    "tr"
                );

            const statusClass =
                createStatusClass(
                    record.status
                );

            row.innerHTML = `
                <td>
                    ${escapeHtml(
                        formatReportDate(
                            record.dateKey ??
                            record.date
                        )
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        record.employeeNumber ??
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        record.name ??
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        record.department ??
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        record.time ??
                        "-"
                    )}
                </td>

                <td>

                    <span
                        class="status-badge ${statusClass}"
                    >
                        ${escapeHtml(
                            record.status ??
                            "Unknown"
                        )}
                    </span>

                </td>

<td>
    ${
        normalizeStatus(
            record.status
        ) === "late"
            ? escapeHtml(
                record.lateReason ??
                "No reason recorded"
            )
            : "-"
    }
</td>
                
            `;

            reportTableBody.appendChild(
                row
            );

        }
    );

    updateSummaryCards(
        records
    );

}


// =====================================
// Update Summary Cards
// =====================================

function updateSummaryCards(records) {

    const total =
        records.length;

    const onTime =
        records.filter(
            (record) =>
                normalizeStatus(
                    record.status
                ) ===
                "on time"
        ).length;

    const late =
        records.filter(
            (record) =>
                normalizeStatus(
                    record.status
                ) ===
                "late"
        ).length;

    const absent =
        records.filter(
            (record) =>
                normalizeStatus(
                    record.status
                ) ===
                "absent"
        ).length;

    const attended =
        onTime + late;

    const rate =
        total === 0
            ? 0
            : Math.round(
                (
                    attended /
                    total
                ) * 100
            );

    totalRecords.textContent =
        total;

    onTimeCount.textContent =
        onTime;

    lateCount.textContent =
        late;

    absentCount.textContent =
        absent;

    attendanceRate.textContent =
        `${rate}%`;

}


// =====================================
// Reset Summary Cards
// =====================================

function resetSummaryCards() {

    totalRecords.textContent =
        "0";

    onTimeCount.textContent =
        "0";

    lateCount.textContent =
        "0";

    absentCount.textContent =
        "0";

    attendanceRate.textContent =
        "0%";

}


// =====================================
// Normalize Status
// =====================================

function normalizeStatus(status) {

    return String(
        status ?? ""
    )
        .trim()
        .toLowerCase();

}


// =====================================
// Format Report Date
// =====================================

function formatReportDate(dateKey) {

    if (!dateKey) {
        return "-";
    }

    const date =
        new Date(
            `${dateKey}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-ZA",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    );

}


// =====================================
// Create Status CSS Class
// =====================================

function createStatusClass(status) {

    return `status-${normalizeStatus(
        status || "unknown"
    )
        .replace(
            /\s+/g,
            "-"
        )
        .replace(
            /[^a-z0-9-]/g,
            ""
        )}`;

}


// =====================================
// Show Table Message
// =====================================

function showTableMessage(message) {

    reportTableBody.innerHTML = `
        <tr>

            <td
                colspan="7"
                class="empty-row"
            >
                ${escapeHtml(message)}
            </td>

        </tr>
    `;

}


// =====================================
// Export Report to CSV
// =====================================

function exportReportToCsv() {

    if (
        currentReportRecords.length === 0
    ) {

        alert(
            "Please generate a report before exporting."
        );

        return;

    }

    const csvRows = [
    [
        "Date",
        "Employee Number",
        "Employee Name",
        "Department",
        "Check-in Time",
        "Status",
        "Late Reason"
    ]
];

    currentReportRecords.forEach(
        (record) => {

            csvRows.push([
                formatReportDate(
                    record.dateKey ??
                    record.date
                ),

                record.employeeNumber ??
                    "",

                record.name ??
                    "",

                record.department ??
                    "",

                record.time ??
                    "",

                record.status ??
    "",

normalizeStatus(
    record.status
) === "late"
    ? record.lateReason ?? ""
    : ""
            ]);

        }
    );

    const csvContent =
        csvRows
            .map(
                (row) =>
                    row
                        .map(
                            escapeCsvValue
                        )
                        .join(";")
            )
            .join("\n");

    const blob =
        new Blob(
            [
                "\uFEFF" +
                csvContent
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const downloadUrl =
        URL.createObjectURL(
            blob
        );

    const downloadLink =
        document.createElement(
            "a"
        );

    downloadLink.href =
        downloadUrl;

    downloadLink.download =
        `attendance-report-${startDateInput.value}-to-${endDateInput.value}.csv`;

    document.body.appendChild(
        downloadLink
    );

    downloadLink.click();

    document.body.removeChild(
        downloadLink
    );

    URL.revokeObjectURL(
        downloadUrl
    );

}


// =====================================
// Escape CSV Value
// =====================================

function escapeCsvValue(value) {

    const safeValue =
        String(
            value ?? ""
        ).replaceAll(
            '"',
            '""'
        );

    return `"${safeValue}"`;

}


// =====================================
// Print Report
// =====================================

function printReport() {

    if (
        currentReportRecords.length === 0
    ) {

        alert(
            "Please generate a report before printing."
        );

        return;

    }

    window.print();

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

        if (logoutButton) {

            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "Logging out...";

        }

        await signOut(auth);

        sessionStorage.clear();

        window.location.replace(
            "admin-login.html"
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        if (logoutButton) {

            logoutButton.disabled =
                false;

            logoutButton.textContent =
                "Logout";

        }

        alert(
            "Unable to log out. Please try again."
        );

    }

}
