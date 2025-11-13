// --- LOGIN FUNCTION ---
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btnLogin");
    if (btn) {
        btn.onclick = () => {
            const email = document.getElementById("email").value.trim();
            const pass = document.getElementById("password").value.trim();

            if (email === "" || pass === "") {
                document.getElementById("error").innerText = "Enter email & password.";
                return;
            }

            // Dummy login logic
            localStorage.setItem("logged_in", "yes");

            window.location.href = "dashboard.html";
        };
    }
});


// --- CHECK LOGIN ON DASHBOARD ---
function checkLogin() {
    if (localStorage.getItem("logged_in") !== "yes") {
        window.location.href = "login.html";
    }
}
