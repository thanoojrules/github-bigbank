document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert("Access Denied!");
        window.location.href = 'login.html';
        return;
    }

    try {
        // ✅ Fetch users
        const usersResponse = await fetch('http://localhost:3000/api/admin/users', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const users = await usersResponse.json();
        const usersTable = document.getElementById('usersTable').querySelector('tbody');

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
                </td>
            `;
        });

        // ✅ Fetch transactions
        const transactionsResponse = await fetch('http://localhost:3000/api/admin/transactions', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const transactions = await transactionsResponse.json();
        const transactionsTable = document.getElementById('transactionsTable').querySelector('tbody');

        transactions.forEach(tx => {
            const row = transactionsTable.insertRow();
            row.innerHTML = `
                <td>${tx.user_email}</td>
                <td>${tx.type.toUpperCase()}</td>
                <td>$${tx.amount}</td>
                <td>${tx.created_at}</td>
            `;
        });

    } catch (error) {
        console.error('Error:', error);
    }
});