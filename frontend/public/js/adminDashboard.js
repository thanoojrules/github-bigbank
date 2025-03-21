document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('token');

    if (!token) {
        alert("Access Denied!");
        window.location.href = 'login.html';
        return;
    }

    // 🚀 Fetch Dashboard Data
    await fetchAdminData();
    await fetchLoanRequests();

    // ✅ Fetch Users
    async function fetchAdminData() {
        try {
            const usersResponse = await fetch('/api/admin/users', {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            const users = await usersResponse.json();
            const usersTable = document.getElementById('usersTable')?.querySelector('tbody');
            if (usersTable) usersTable.innerHTML = '';

            users.forEach(user => {
                const row = usersTable.insertRow();
                row.innerHTML = `
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>$${user.balance}</td>
                    <td>
                        <button onclick="changeRole('${user.id}', 'admin')">Make Admin</button>
                        <button onclick="changeRole('${user.id}', 'user')">Make User</button>
                        <button onclick="deleteUser('${user.id}')">Delete</button>
                        <button onclick="viewUserLoans('${user.email}')">View Loans</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('❌ Error fetching users:', error);
            alert("❌ Failed to load users.");
        }
    }

    // ✅ Fetch Loan Requests
    async function fetchLoanRequests() {
        try {
            const response = await fetch('/api/admin/loan-subscriptions', {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            const loans = await response.json();
            const loanTable = document.getElementById('loanTable')?.querySelector('tbody');
            if (loanTable) loanTable.innerHTML = '';

            loans.forEach(loan => {
                const row = loanTable.insertRow();
                row.innerHTML = `
                    <td>${loan.user_email}</td>
                    <td>${loan.loan_type}</td>
                    <td>${loan.loan_amount || 'Pending'}</td>
                    <td>${loan.interest_rate || 'Pending'}%</td>
                    <td>${loan.loan_term || 'Pending'} months</td>
                    <td>${loan.status}</td>
                    <td>
                        ${loan.status === 'pending' ? `
                            <button onclick="approveLoan('${loan.id}', '${loan.user_email}')">✅ Approve</button>
                            <button onclick="rejectLoan('${loan.id}', '${loan.user_email}')">❌ Reject</button>
                        ` : '✅ Approved'}
                    </td>
                `;
            });
        } catch (error) {
            console.error('❌ Error fetching loan requests:', error);
            alert("❌ Failed to load loan requests.");
        }
    }

    // ✅ Approve Loan
    window.approveLoan = async function (loanId, userEmail) {
        const loanAmount = prompt(`Enter loan amount for ${userEmail}:`);
        const loanTerm = prompt(`Enter loan term (in months):`);
        const interestRate = prompt(`Enter interest rate (%):`);

        if (!loanAmount || !loanTerm || !interestRate) {
            alert("❌ Please provide all loan details.");
            return;
        }

        try {
            const response = await fetch(`/api/loans/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ subscriptionId: loanId, loanAmount, loanTerm, interestRate })
            });

            if (response.ok) {
                alert("✅ Loan approved successfully!");
                await fetchLoanRequests();

                // ✅ Notify User
                await sendNotification(userEmail, `🎉 Your loan has been approved. Please confirm in your dashboard.`);
            } else {
                const errorData = await response.json();
                alert(`❌ Failed to approve loan: ${errorData.error}`);
            }
        } catch (error) {
            console.error("❌ Loan Approval Error:", error);
            alert("❌ Error approving loan.");
        }
    };

    // ✅ Reject Loan
    window.rejectLoan = async function (loanId, userEmail) {
        if (!confirm(`⚠️ Are you sure you want to reject the loan request for ${userEmail}?`)) return;

        try {
            const response = await fetch(`/api/loans/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ subscriptionId: loanId })
            });

            if (response.ok) {
                alert("✅ Loan rejected successfully!");
                await fetchLoanRequests();

                // ✅ Notify User
                await sendNotification(userEmail, `❌ Your loan request has been rejected.`);
            } else {
                alert("❌ Failed to reject loan.");
            }
        } catch (error) {
            console.error("❌ Error rejecting loan:", error);
            alert("❌ Error rejecting loan.");
        }
    };

    // ✅ Send Notification
    async function sendNotification(userEmail, message) {
        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ userEmail, message })
            });
            console.log(`✅ Notification sent to ${userEmail}: ${message}`);
        } catch (error) {
            console.error('❌ Failed to send notification:', error);
        }
    }

    // ✅ Change Role
    window.changeRole = async function (userId, role) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ role })
            });

            if (response.ok) {
                alert(`✅ User role updated to ${role}!`);
                await fetchAdminData();
            } else {
                alert("❌ Failed to update role.");
            }
        } catch (error) {
            console.error("❌ Error changing role:", error);
        }
    };

    // ✅ Delete User
    window.deleteUser = async function (userId) {
        if (!confirm("⚠️ Are you sure you want to delete this user?")) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (response.ok) {
                alert("✅ User deleted successfully!");
                await fetchAdminData();
            } else {
                alert("❌ Failed to delete user.");
            }
        } catch (error) {
            console.error("❌ Error deleting user:", error);
        }
    };

    // ✅ View User Loans
    window.viewUserLoans = async function (userEmail) {
        try {
            const response = await fetch(`/api/admin/user-loans?email=${userEmail}`, {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            const loans = await response.json();

            if (loans.length === 0) {
                alert(`ℹ️ No loans found for ${userEmail}`);
                return;
            }

            let loanDetails = `📜 Loan details for ${userEmail}:\n`;
            loans.forEach(loan => {
                loanDetails += `\n💰 Type: ${loan.loan_type}\nAmount: $${loan.loan_amount}\nTerm: ${loan.loan_term} months\nInterest: ${loan.interest_rate}%\nStatus: ${loan.status}\n`;
            });

            alert(loanDetails);
        } catch (error) {
            console.error("❌ Error fetching user loans:", error);
            alert("❌ Failed to fetch user loans.");
        }
    };
});
