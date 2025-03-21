document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    console.log("🔐 Token Retrieved:", token);

    // ✅ Fetch User Profile
    async function fetchUserProfile() {
        try {
            const response = await fetch("/api/user/profile", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const text = await response.text(); // Debugging step
            console.log("🔍 API Response:", text);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${text}`);
            }

            const data = JSON.parse(text);
            document.getElementById("userEmail").textContent = data.email;
            document.getElementById("balance").textContent = `$${parseFloat(data.balance).toFixed(2)}`;
            document.getElementById("savings").textContent = `$${parseFloat(data.savings).toFixed(2)}`;
        } catch (error) {
            console.error("❌ Profile Fetch Error:", error);
            document.getElementById("balance").textContent = "$0.00";
            document.getElementById("savings").textContent = "$0.00";
        }
    }

    // ✅ Fetch Transaction History
    async function fetchTransactionHistory() {
        try {
            const response = await fetch("/api/transactions", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("❌ Failed to fetch transactions.");
            }

            const transactions = await response.json();
            console.log("✅ Transaction Data Fetched:", transactions);

            const transactionList = document.getElementById("transactionList");
            if (!transactionList) {
                console.error("❌ Transaction List Element Not Found in HTML.");
                return;
            }

            transactionList.innerHTML = ""; // Clear previous data

            if (transactions.length === 0) {
                transactionList.innerHTML = "<li>No transactions available.</li>";
                return;
            }

            transactions.forEach(txn => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <strong>${txn.transaction_type.toUpperCase()}</strong>: 
                    ${txn.sender_email ? `Sent to: ${txn.recipient_email}` : `Received from: ${txn.sender_email}`}
                    <span style="color: ${txn.transaction_type === 'transfer' ? 'red' : 'green'};">
                        $${txn.amount}
                    </span>
                    <small>(${new Date(txn.created_at).toLocaleString()})</small>
                `;
                transactionList.appendChild(listItem);
            });

        } catch (error) {
            console.error("❌ Transaction Fetch Error:", error);
        }
    }

    // ✅ Fetch Notifications
    async function fetchNotifications() {
        try {
            const response = await fetch("/api/notifications", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("❌ Failed to fetch notifications.");
            }

            const notifications = await response.json();
            const notificationList = document.getElementById("notificationList");
            if (!notificationList) {
                console.error("❌ Notification List Element Not Found in HTML.");
                return;
            }

            notificationList.innerHTML = "";

            if (notifications.length === 0) {
                notificationList.innerHTML = "<li>No notifications available.</li>";
                return;
            }

            notifications.forEach(notif => {
                const listItem = document.createElement("li");
                listItem.textContent = `${notif.message} - ${new Date(notif.created_at).toLocaleString()}`;
                notificationList.appendChild(listItem);
            });
        } catch (error) {
            console.error("❌ Notification Fetch Error:", error);
        }
    }

    // ✅ Update Profile
    async function updateProfile() {
        const email = document.getElementById("newEmail").value.trim();
        const password = document.getElementById("newPassword").value.trim();

        if (!email && !password) {
            alert("❌ Please enter an email or password to update.");
            return;
        }

        try {
            const response = await fetch("/api/user/update", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "❌ Profile update failed.");
            }

            alert("✅ Profile updated successfully!");
            fetchUserProfile(); // Refresh profile data
        } catch (error) {
            console.error("❌ Update Profile Error:", error);
            alert(error.message);
        }
    }

    document.getElementById("updateProfileBtn")?.addEventListener("click", updateProfile);

    // ✅ Transfer Money
    async function transferMoney() {
        const recipientEmail = document.getElementById("recipientEmail").value.trim();
        const transferAmount = parseFloat(document.getElementById("transferAmount").value);

        if (!recipientEmail || isNaN(transferAmount) || transferAmount <= 0) {
            alert("❌ Please enter a valid recipient email and amount!");
            return;
        }

        try {
            console.log(`📤 Sending transfer request to API: recipient=${recipientEmail}, amount=${transferAmount}`);

            const response = await fetch("/api/transfer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ recipientEmail, amount: transferAmount })
            });

            const data = await response.json();

            console.log("🔍 Transfer API Response:", data);

            if (!response.ok) {
                throw new Error(data.error || "❌ Transfer failed.");
            }

            alert("✅ Transfer successful!");
            fetchUserProfile();
            fetchTransactionHistory();
            fetchNotifications();
        } catch (error) {
            console.error("❌ Transfer Error:", error);
            alert(`Transfer failed: ${error.message}`);
        }
    }

    document.getElementById("transferBtn")?.addEventListener("click", transferMoney);

    // ✅ Logout Functionality
    document.getElementById("logoutBtn")?.addEventListener("click", function () {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

   document.addEventListener("DOMContentLoaded", function () {
    const userInfoBtn = document.getElementById("userInfoBtn");

    if (userInfoBtn) {
        userInfoBtn.addEventListener("click", function () {
            console.log("✅ Redirecting to customer.html");
            window.location.href = "/customer.html";  // ✅ Ensure correct path
        });
    } else {
        console.error("❌ User Info Button Not Found");
    }
});
    // ✅ Fetch Everything on Page Load
    fetchUserProfile();
    fetchTransactionHistory();
    fetchNotifications();
});
