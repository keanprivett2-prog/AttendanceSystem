// =====================================
// Employee Modal
// =====================================

const modal = document.getElementById("employeeModal");

const addEmployeeButton = document.getElementById("addEmployeeButton");

const closeEmployeeModal = document.getElementById("closeEmployeeModal");

const cancelEmployeeButton = document.getElementById("cancelEmployeeButton");

addEmployeeButton.addEventListener("click", () => {

    modal.classList.add("active");

});

closeEmployeeModal.addEventListener("click", () => {

    modal.classList.remove("active");

});

cancelEmployeeButton.addEventListener("click", () => {

    modal.classList.remove("active");

});

// Close when clicking outside the popup
modal.addEventListener("click", (event) => {

    if (event.target === modal) {

        modal.classList.remove("active");

    }

});

console.log("Employees page loaded");
