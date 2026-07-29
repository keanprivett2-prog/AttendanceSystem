import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    addDoc,
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

attendanceManagementForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        attendanceMessage.textContent =
            "Saving attendance...";

        attendanceMessage.style.color =
            "var(--text-secondary)";

    }
);

attendanceDate.value =
    new Date().toISOString().split("T")[0];

loadEmployees();
