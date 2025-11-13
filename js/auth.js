// --- LOGIN FUNCTION ---
document.addEventListener("DOMContentLoaded", () => {

    const emailEl = document.getElementById("email");
    const passEl = document.getElementById("password");
    const btn = document.getElementById("btnLogin");
    const errorEl = document.getElementById("error");

    // SAFETY CHECK → If not on login.html, EXIT
    if (!emailEl || !passEl || !btn) {
        console.log("auth.js: Not on login page.");
        return;
    }

    btn.onclick = () => {
        const email = emailEl.value.trim();
        const pass = passEl.value.trim();

        const defaultEmail = "akhorrnet@gmail.com";
        const defaultPass = "1234";

        if (!email || !pass) {
            errorEl.innerText = "Enter email & password.";
            return;
        }

        if (email !== defaultEmail || pass !== defaultPass) {
            errorEl.innerText = "Invalid login.";
            return;
        }

        localStorage.setItem("logged_in", "yes");
        window.location.href = "dashboard.html";
    };
});


// --- CHECK LOGIN ON DASHBOARD ---
function checkLogin() {
    if (localStorage.getItem("logged_in") !== "yes") {
        window.location.href = "login.html";
    }
}
