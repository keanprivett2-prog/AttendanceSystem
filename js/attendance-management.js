import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// DOM Elements
// =====================================================

const employeeSelect =
    document.getElementById("employeeSelect");

const attendanceManagementForm =
    document.getElementById("attendanceManagementForm");

const attendanceDate =
    document.getElementById("attendanceDate");

const attendanceStatus =
    document.getElementById("attendanceStatus");

const attendanceNotes =
    document.getElementById("attendanceNotes");

const attendanceMessage =
    document.getElementById("attendanceMessage");

const attendanceHistory =
    document.getElementById("attendanceHistory");

const summaryOnTime =
    document.getElementById("summaryOnTime");

const summaryLate =
    document.getElementById("summaryLate");

const summaryAbsent =
    document.getElementById("summaryAbsent");

const summaryLeave =
    document.getElementById("summaryLeave");

const saveAttendanceButton =
    document.getElementById("saveAttendanceButton");


// =====================================================
// Message Helper
// =====================================================

function showMessage(message, color) {

    attendanceMessage.textContent = message;
    attendanceMessage.style.color = color;

}


// =====================================================
// Load Active Employees
// =====================================================

async function loadEmployees() {

    employeeSelect.innerHTML = `
        <option value="">
            Loading employees...
        </option>
    `;

    try {

        const employeesQuery = query(
            collection(db, "employees"),
            where("active", "==", true)
        );

        const employeeSnapshot =
            await getDocs(employeesQuery);

        const employees = [];

        employeeSnapshot.forEach((employeeDocument) => {

            employees.push({
                id: employeeDocument.id,
                ...employeeDocument.data()
            });

        });

        employees.sort((a, b) =>
            String(a.name ?? "")
                .localeCompare(String(b.name ?? ""))
        );

        employeeSelect.innerHTML = `
            <option value="">
                Select an employee
            </option>
        `;

        employees.forEach((employee) => {

            const option =
                document.createElement("option");

            option.value =
                employee.id;

            option.textContent =
                `${employee.name} (${employee.employeeNumber})`;

            option.dataset.employeeNumber =
                employee.employeeNumber ?? "";

            option.dataset.name =
                employee.name ?? "";

            option.dataset.department =
                employee.department ?? "";

            employeeSelect.appendChild(option);

        });

    } catch (error) {

        console.error(
            "Unable to load employees:",
            error
        );

        employeeSelect.innerHTML = `
            <option value="">
                Unable to load employees
            </option>
        `;

        showMessage(
            "Unable to load employees.",
            "red"
        );

    }

}


// =====================================================
// Get Selected Employee
// =====================================================

async function getSelectedEmployee() {

    const employeeId =
        employeeSelect.value;

    if (!employeeId) {
        return null;
    }

    const employeeReference =
        doc(db, "employees", employeeId);

    const employeeSnapshot =
        await getDoc(employeeReference);

    if (!employeeSnapshot.exists()) {
        return null;
    }

    return {
        id: employeeSnapshot.id,
        ...employeeSnapshot.data()
    };

}


// =====================================================
// Load Existing Attendance Record
// =====================================================

async function loadExistingAttendance() {

    const selectedDate =
        attendanceDate.value;

    if (!employeeSelect.value || !selectedDate) {

        attendanceStatus.value = "";
        attendanceNotes.value = "";

        showMessage("", "");

        return;

    }

    try {

        const employee =
            await getSelectedEmployee();

        if (!employee) {

            showMessage(
                "Employee not found.",
                "red"
            );

            return;

        }

        const attendanceDocumentId =
            `${employee.employeeNumber}_${selectedDate}`;

        const attendanceReference =
            doc(
                db,
                "attendance",
                attendanceDocumentId
            );

        const attendanceSnapshot =
            await getDoc(attendanceReference);

        if (attendanceSnapshot.exists()) {

            const attendance =
                attendanceSnapshot.data();

            attendanceStatus.value =
                attendance.status ?? "";

            attendanceNotes.value =
                attendance.notes ?? "";

            showMessage(
                "Existing attendance record loaded.",
                "var(--orange-primary)"
            );

        } else {

            attendanceStatus.value = "";
            attendanceNotes.value = "";

            showMessage(
                "No attendance record exists for this employee and date.",
                "var(--blue-primary)"
            );

        }

    } catch (error) {

        console.error(
            "Unable to load attendance:",
            error
        );

        showMessage(
            "Unable to load attendance record.",
            "red"
        );

    }

}


// =====================================================
// Load Attendance History
// =====================================================

async function loadAttendanceHistory() {

    if (!employeeSelect.value) {

        attendanceHistory.innerHTML = `
            <p class="empty-state">
                Select an employee to view attendance history.
            </p>
        `;

        return;

    }

    attendanceHistory.innerHTML = `
        <p class="empty-state">
            Loading attendance history...
        </p>
    `;

    try {

        const employee =
            await getSelectedEmployee();

        if (!employee) {

            attendanceHistory.innerHTML = `
                <p class="empty-state">
                    Employee not found.
                </p>
            `;

            return;

        }

        const historyQuery = query(
            collection(db, "attendance"),
            where(
                "employeeNumber",
                "==",
                employee.employeeNumber
            ),
            orderBy("dateKey", "desc"),
            limit(10)
        );

        const historySnapshot =
            await getDocs(historyQuery);

        if (historySnapshot.empty) {

            attendanceHistory.innerHTML = `
                <p class="empty-state">
                    No attendance history found.
                </p>
            `;

            return;

        }

        attendanceHistory.innerHTML = "";

        historySnapshot.forEach((attendanceDocument) => {

            const attendance =
                attendanceDocument.data();

            const dateDisplay =
                formatAttendanceDate(
                    attendance.dateKey
                );

            const statusClass =
                createStatusClass(
                    attendance.status
                );

            attendanceHistory.innerHTML += `
                <div class="history-item">

                    <div>
                        <strong>
                            ${dateDisplay}
                        </strong>

                        <small>
                            ${attendance.time ?? ""}
                        </small>
                    </div>

                    <span class="status-badge ${statusClass}">
                        ${attendance.status ?? "Unknown"}
                    </span>

                </div>
            `;

        });

    } catch (error) {

        console.error(
            "Unable to load attendance history:",
            error
        );

        attendanceHistory.innerHTML = `
            <p class="empty-state">
                Unable to load attendance history.
            </p>
        `;

    }

}

// =====================================================
// Load Attendance Summary
// =====================================================

async function loadAttendanceSummary() {

    if (!employeeSelect.value) {

        summaryOnTime.textContent = "0";
        summaryLate.textContent = "0";
        summaryAbsent.textContent = "0";
        summaryLeave.textContent = "0";

        return;

    }

    try {

        const employee =
            await getSelectedEmployee();

        if (!employee) {
            return;
        }

        const attendanceQuery = query(
            collection(db, "attendance"),
            where(
                "employeeNumber",
                "==",
                employee.employeeNumber
            )
        );

        const attendanceSnapshot =
            await getDocs(attendanceQuery);

        let onTime = 0;
        let late = 0;
        let absent = 0;
        let leave = 0;

        attendanceSnapshot.forEach((attendanceDocument) => {

            const attendance =
                attendanceDocument.data();

            switch (attendance.status) {

                case "On Time":
                    onTime++;
                    break;

                case "Late":
                    late++;
                    break;

                case "Absent":
                    absent++;
                    break;

                case "Annual Leave":
                case "Sick Leave":
                case "Family Responsibility Leave":
                case "Maternity Leave":
                case "Unpaid Leave":
                case "Public Holiday":
                    leave++;
                    break;

            }

        });

        summaryOnTime.textContent = onTime;
        summaryLate.textContent = late;
        summaryAbsent.textContent = absent;
        summaryLeave.textContent = leave;

    } catch (error) {

        console.error(
            "Unable to load attendance summary:",
            error
        );

    }

}
// =====================================================
// Format Attendance Date
// =====================================================

function formatAttendanceDate(dateKey) {

    if (!dateKey) {
        return "Unknown date";
    }

    const date =
        new Date(`${dateKey}T00:00:00`);

    return date.toLocaleDateString(
        "en-ZA",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =====================================================
// Create Status CSS Class
// =====================================================

function createStatusClass(status) {

    return `status-${String(status ?? "unknown")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")}`;

}


// =====================================================
// Save Attendance
// =====================================================

async function saveAttendance(event) {

    event.preventDefault();

    const selectedDate =
        attendanceDate.value;

    const selectedStatus =
        attendanceStatus.value;

    const notes =
        attendanceNotes.value.trim();

    if (!employeeSelect.value) {

        showMessage(
            "Please select an employee.",
            "red"
        );

        return;

    }

    if (!selectedDate) {

        showMessage(
            "Please select a date.",
            "red"
        );

        return;

    }

    if (!selectedStatus) {

        showMessage(
            "Please select an attendance status.",
            "red"
        );

        return;

    }

    saveAttendanceButton.disabled = true;
    saveAttendanceButton.textContent =
        "Saving...";

    showMessage(
        "Saving attendance...",
        "var(--text-secondary)"
    );

    try {

        const employee =
            await getSelectedEmployee();

        if (!employee) {

            showMessage(
                "Employee not found.",
                "red"
            );

            return;

        }

        const attendanceDocumentId =
            `${employee.employeeNumber}_${selectedDate}`;

        const attendanceReference =
            doc(
                db,
                "attendance",
                attendanceDocumentId
            );

        const existingSnapshot =
            await getDoc(attendanceReference);

        const recordAlreadyExists =
            existingSnapshot.exists();

        const currentTime =
            new Date().toLocaleTimeString(
                "en-ZA",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        await setDoc(
            attendanceReference,
            {
                employeeNumber:
                    employee.employeeNumber,

                name:
                    employee.name,

                department:
                    employee.department ?? "Unassigned",

                date:
                    selectedDate,

                dateKey:
                    selectedDate,

                status:
                    selectedStatus,

                notes:
                    notes,

                checkInMethod:
                    "Manual",

                time:
                    currentTime,

                createdAt:
                    serverTimestamp()
            }
        );

        if (recordAlreadyExists) {

            showMessage(
                "Attendance record updated.",
                "var(--orange-primary)"
            );

        } else {

            showMessage(
                "Attendance record created.",
                "var(--green-primary)"
            );

        }

        await loadAttendanceHistory();

    } catch (error) {

        console.error(
            "Unable to save attendance:",
            error
        );

        showMessage(
            "Unable to save attendance.",
            "red"
        );

    } finally {

        saveAttendanceButton.disabled = false;
        saveAttendanceButton.textContent =
            "Save Attendance";

    }

}


// =====================================================
// Event Listeners
// =====================================================

attendanceManagementForm.addEventListener(
    "submit",
    saveAttendance
);

employeeSelect.addEventListener(
    "change",
    async () => {

        await loadExistingAttendance();
        await loadAttendanceHistory();

    }
);

attendanceDate.addEventListener(
    "change",
    loadExistingAttendance
);


// =====================================================
// Page Initialization
// =====================================================

attendanceDate.value =
    new Date().toISOString().split("T")[0];

loadEmployees();
