import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

const attendanceHistory =
    document.getElementById("attendanceHistory");

const attendanceMessage =
    document.getElementById("attendanceMessage");

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

            option.value = employee.id;

            option.textContent =
                `${employee.name} (${employee.employeeNumber})`;

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

    }

}

async function loadExistingAttendance() {

    const employeeId =
        employeeSelect.value;

    const selectedDate =
        attendanceDate.value;

    if (!employeeId || !selectedDate) {

        attendanceStatus.value = "";
        attendanceNotes.value = "";

        attendanceMessage.textContent = "";

        return;

    }

    try {

        const employeeReference =
            doc(db, "employees", employeeId);

        const employeeSnapshot =
            await getDoc(employeeReference);

        if (!employeeSnapshot.exists()) {

            return;

        }

        const employee =
            employeeSnapshot.data();

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

            attendanceMessage.style.color =
                "var(--orange-primary)";

            attendanceMessage.textContent =
                "Existing attendance record loaded.";

        } else {

            attendanceStatus.value = "";
            attendanceNotes.value = "";

            attendanceMessage.style.color =
                "var(--blue-primary)";

            attendanceMessage.textContent =
                "No attendance record exists for this employee and date.";

        }

    } catch (error) {

        console.error(
            "Unable to load attendance:",
            error
        );

    }

}

attendanceManagementForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        attendanceMessage.textContent =
            "Saving attendance...";

        attendanceMessage.style.color =
            "var(--text-secondary)";

        const employeeId =
    employeeSelect.value;

const employeeReference =
    doc(db, "employees", employeeId);

const employeeSnapshot =
    await getDoc(employeeReference);

if (!employeeSnapshot.exists()) {

    attendanceMessage.style.color = "red";

    attendanceMessage.textContent =
        "Employee not found.";

    return;

}

const employee =
    employeeSnapshot.data();

      const selectedDate =
    attendanceDate.value;

const selectedStatus =
    attendanceStatus.value;

const notes =
    attendanceNotes.value.trim();

const currentTime =
    new Date().toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit"
    });

const attendanceDocumentId =
    `${employee.employeeNumber}_${selectedDate}`;

await setDoc(
    doc(
        db,
        "attendance",
        attendanceDocumentId
    ),
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

attendanceMessage.style.color =
    "green";

attendanceMessage.textContent =
    "Attendance saved successfully."; 

        await loadExistingAttendance();

    }
);

attendanceDate.value =
    new Date().toISOString().split("T")[0];

loadEmployees();

employeeSelect.addEventListener(
    "change",
    loadExistingAttendance
);

attendanceDate.addEventListener(
    "change",
    loadExistingAttendance
);
