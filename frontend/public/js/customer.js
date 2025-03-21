document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    console.log("🔐 Token Retrieved:", token);

    // ✅ Fetch User Details
    async function fetchUserDetails() {
        try {
            const response = await fetch("/api/user/details", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user details.");
            }

            const data = await response.json();
            console.log("✅ User Details:", data);

            document.getElementById("debitBalance").textContent = `$${parseFloat(data.balance).toFixed(2)}`;
            document.getElementById("scenePoints").textContent = data.scene_points;
        } catch (error) {
            console.error("❌ User Fetch Error:", error);
        }
    }

    // ✅ Fetch Transaction History & Load Calendar
    async function fetchTransactionHistory() {
        try {
            const response = await fetch("/api/transactions", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch transactions.");
            }

            const transactions = await response.json();
            console.log("✅ Transactions Fetched:", transactions);

            const calendarEl = document.getElementById("calendar");
            const calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: "dayGridMonth",
                events: transactions.map(txn => ({
                    title: `$${txn.amount} - ${txn.transaction_type}`,
                    start: txn.created_at,
                    color: txn.transaction_type === "transfer" ? "#FF5733" : "#28a745"
                }))
            });

            calendar.render();
        } catch (error) {
            console.error("❌ Transaction Fetch Error:", error);
        }
    }

    // ✅ Loan Subscription Function
    async function subscribeLoan() {
        const loanType = document.getElementById("loanType").value;
        const paymentMethod = document.getElementById("paymentMethod").value;

        if (!loanType || !paymentMethod) {
            alert("❌ Please select both loan type and payment method.");
            return;
        }

        try {
            const response = await fetch("/api/loans/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ loanType, paymentMethod })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(`❌ ${result.error}`);
                return;
            }

            alert(`✅ Loan subscribed successfully for ${loanType}!`);
            fetchUserDetails();
        } catch (error) {
            console.error("❌ Loan Subscription Error:", error);
            alert("❌ Failed to subscribe to loan.");
        }
    }

    // ✅ Handle Loan Subscription Button
    document.getElementById("subscribeLoanBtn")?.addEventListener("click", subscribeLoan);

    // ✅ Navigation Buttons
    document.getElementById("dashboardBtn")?.addEventListener("click", function () {
        window.location.href = "dashboard.html";
    });

    document.getElementById("logoutBtn")?.addEventListener("click", function () {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

    // ✅ Download Credit Card Statement
    document.getElementById("downloadStatementBtn")?.addEventListener("click", async function () {
        try {
            const response = await fetch("/api/credit/statement", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("❌ Failed to generate statement.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Credit_Card_Statement.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            alert("✅ Credit Card Statement Downloaded!");
        } catch (error) {
            console.error("❌ Error downloading statement:", error);
            alert(error.message);
        }
    });

    // 🚀 Load Data on Page Load
    fetchUserDetails();
    fetchTransactionHistory();
});
