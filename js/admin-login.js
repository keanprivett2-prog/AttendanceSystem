// =====================================
// R-E-D Attendance Admin Login
// =====================================

import { loginAdmin } from "../firebase/auth.js";

const adminUsernameInput =
    document.getElementById("adminUsername");

const adminPasswordInput =
    document.getElementById("adminPassword");

const adminLoginButton =
    document.getElementById("adminLoginButton");

const adminLoginMessage =
    document.getElementById("adminLoginMessage");

adminLoginButton.addEventListener("click", adminLogin);

adminPasswordInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        adminLogin();
    }

});

async function adminLogin() {

    const email =
        adminUsernameInput.value.trim();

    const password =
        adminPasswordInput.value.trim();

    adminLoginMessage.style.color = "#0b5ed7";
    adminLoginMessage.innerHTML = "Signing in...";

    adminLoginButton.disabled = true;

    try {

        const user =
            await loginAdmin(email, password);

        sessionStorage.setItem(
            "adminLoggedIn",
            "true"
        );

        sessionStorage.setItem(
            "adminEmail",
            user.email
        );

        window.location.href = "admin.html";

    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        adminLoginMessage.style.color = "red";
        adminLoginMessage.innerHTML =
            "❌ Incorrect email address or password.";

        adminLoginButton.disabled = false;
    }
}
