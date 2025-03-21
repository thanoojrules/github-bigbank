document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        console.error("❌ Login form not found in the DOM.");
        return;
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent form refresh

        // Get input values safely
        const emailField = document.getElementById("email");
        const passwordField = document.getElementById("password");

        if (!emailField || !passwordField) {
            console.error("❌ Email or Password field not found.");
            return;
        }

        const email = emailField.value.trim();
        const password = passwordField.value.trim();

        if (!email || !password) {
            alert("⚠️ Please enter both email and password.");
            return;
        }

        try {
            const API_BASE_URL = "http://20.151.166.147:3000/api"; // ✅ Updated to VM IP

            const response = await fetch(`${API_BASE_URL}/auth/login`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                alert("✅ Login successful!");
                window.location.href = "dashboard.html"; // Redirect to dashboard
            } else {
                alert(`🚨 Login failed: ${data.error}`);
            }
        } catch (error) {
            console.error("❌ Login request failed:", error);
            alert("🚨 Network error. Try again later.");
        }
    });
});
