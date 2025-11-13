document.addEventListener("DOMContentLoaded", () => {

    const emailEl = document.getElementById("email");
    const passEl = document.getElementById("password");
    const btn = document.getElementById("btnLogin");
    const errorEl = document.getElementById("error");

    if (!emailEl || !passEl || !btn) {
        console.log("auth.js: Not on login page.");
        return;
    }

    btn.onclick = () => {
        const defaultEmail = "akhorrnet@gmail.com";
        const defaultPass = "1234";

        const email = emailEl.value.trim();
        const pass = passEl.value.trim();

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

function checkLogin() {
    if (localStorage.getItem("logged_in") !== "yes") {
        window.location.href = "login.html";
    }
}
