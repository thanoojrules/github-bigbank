document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
    }

    // ✅ Fetch User Profile
    async function fetchUserProfile() {
        try {
            const response = await fetch("/api/user/profile", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch profile.");
            }

            const data = await response.json();

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
            const response = await fetch("/api/user/transactions", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch transactions.");
            }

            const transactions = await response.json();
            const transactionList = document.getElementById("transactionList");
            transactionList.innerHTML = "";

            if (transactions.length === 0) {
                transactionList.innerHTML = "<li>No transactions found.</li>";
                return;
            }

            transactions.forEach(tx => {
                const listItem = document.createElement("li");
                listItem.textContent = `${tx.sender_email || "You"} → ${tx.recipient_email || "You"}: $${parseFloat(tx.amount).toFixed(2)} - ${new Date(tx.created_at).toLocaleString()}`;
                transactionList.appendChild(listItem);
            });
        } catch (error) {
            console.error("❌ Transaction Fetch Error:", error);
            document.getElementById("transactionList").innerHTML = "<li>Error loading transactions.</li>";
        }
    }

    // ✅ Fetch Notifications
    async function fetchNotifications() {
        try {
            const response = await fetch("/api/notifications", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch notifications.");
            }

            const notifications = await response.json();
            const notificationList = document.getElementById("notificationList");
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
            document.getElementById("notificationList").innerHTML = "<li>Error loading notifications.</li>";
        }
    }

    // ✅ Update Profile (Fixes profile updates)
    async function updateProfile() {
        const email = document.getElementById("newEmail").value;
        const password = document.getElementById("newPassword").value;

        if (!email && !password) {
            alert("❌ Please enter an email or password to update.");
            return;
        }

        try {
            const response = await fetch("/api/user/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update profile.");
            }

            alert("✅ Profile updated successfully!");
            fetchUserProfile(); // Refresh profile data
        } catch (error) {
            console.error("❌ Update Profile Error:", error);
            alert("Error updating profile.");
        }
    }

    // ✅ Attach Event Listener for Profile Update
    document.getElementById("updateProfileBtn")?.addEventListener("click", updateProfile);

    // ✅ Transfer Money (Ensures balance updates correctly)
    async function transferMoney() {
        const recipientEmail = document.getElementById("recipientEmail").value;
        const transferAmount = parseFloat(document.getElementById("transferAmount").value);

        if (!recipientEmail || isNaN(transferAmount) || transferAmount <= 0) {
            alert("❌ Please enter a valid recipient email and amount!");
            return;
        }

        try {
            const response = await fetch("/api/transfer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ recipientEmail, amount: transferAmount })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Transfer failed.");
            }

            alert("✅ Transfer successful!");
            fetchUserProfile();
            fetchTransactionHistory();
            fetchNotifications();
        } catch (error) {
            console.error("❌ Transfer Error:", error);
            alert("Transfer failed.");
        }
    }

    // ✅ Attach Event Listener for Transfer
    document.getElementById("transferBtn")?.addEventListener("click", transferMoney);

    // ✅ Fetch Everything on Page Load
    fetchUserProfile();
    fetchTransactionHistory();
    fetchNotifications();
});