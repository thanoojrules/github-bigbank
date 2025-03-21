document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signupForm");

    if (!signupForm) {
        console.error("❌ Signup form not found.");
        return;
    }

    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        // ✅ Validate Fields
        if (!email || !password || !confirmPassword) {
            alert("❌ All fields are required!");
            return;
        }

        // ✅ Password Complexity Validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{9,}$/;
        if (!passwordRegex.test(password)) {
            alert("❌ Password must be at least 9 characters long, contain a number, uppercase letter, and special character.");
            return;
        }

        if (password !== confirmPassword) {
            alert("❌ Passwords do not match.");
            return;
        }

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "❌ Signup failed.");
            }

            alert("✅ Account created successfully! Redirecting to login...");
            window.location.href = "login.html";
        } catch (error) {
            console.error("❌ Signup request failed:", error);
            alert(error.message);
        }
    });
});
