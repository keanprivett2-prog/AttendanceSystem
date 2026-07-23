// =====================================
// Admin Login
// =====================================

const adminUsernameInput =
    document.getElementById("adminUsername");

const adminPasswordInput =
    document.getElementById("adminPassword");

const adminLoginButton =
    document.getElementById("adminLoginButton");

const adminLoginMessage =
    document.getElementById("adminLoginMessage");

adminLoginButton.addEventListener("click", adminLogin);

function adminLogin() {

    const username =
        adminUsernameInput.value.trim();

    const password =
        adminPasswordInput.value.trim();

    if (username === "admin" && password === "admin123") {

        sessionStorage.setItem(
            "adminLoggedIn",
            "true"
        );

        window.location.href = "admin.html";

        return;
    }

    adminLoginMessage.style.color = "red";
    adminLoginMessage.innerHTML =
        "❌ Incorrect username or password.";
}