
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'mock_token'; // We might need a real token if verifyToken checks signature. 
// Wait, verifyToken checks signature! I need a valid token.
// I can login with the seeded admin first.

async function testRolesUsers() {
    console.log('--- Starting Roles & Users Verification ---');

    try {
        // 1. Login as Admin
        console.log('\nLogging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/../auth/login`, {
            email: 'admin@company.com', // Assuming seeded admin
            password: 'admin123'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('Login Success.');

        // 2. Fetch Roles
        console.log('\nFetching Roles...');
        const rolesRes = await axios.get(`${API_URL}/workflow/admin/roles`, { headers });
        console.log(`Roles Count: ${rolesRes.data.data.length}`);
        if (rolesRes.data.data.length > 0) console.log('PASS: Roles fetched.');

        // 3. Fetch Users
        console.log('\nFetching All Users...');
        const usersRes = await axios.get(`${API_URL}/users`, { headers }); // Correct endpoint based on modification
        console.log(`Users Count: ${usersRes.data.users.length}`);
        if (usersRes.data.users.length > 0) console.log('PASS: Users fetched.');

        // 4. Fetch Users by Role (if any users exist with roles)
        if (rolesRes.data.data.length > 0) {
            const roleName = rolesRes.data.data[0].name;
            console.log(`\nFetching Users with Role: ${roleName}...`);
            const filteredUsersRes = await axios.get(`${API_URL}/users`, {
                headers,
                params: { role: roleName }
            });
            console.log(`Filtered Users Count: ${filteredUsersRes.data.users.length}`);
            console.log('PASS: Filtering query executed (even if 0 results).');
        }

    } catch (err) {
        console.error('Test Failed:', err.response ? err.response.data : err.message);
    }
}

testRolesUsers();
