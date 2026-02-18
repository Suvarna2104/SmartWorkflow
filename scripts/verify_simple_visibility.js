
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
axios.defaults.timeout = 5000;

async function testVisibility() {
    console.log('START: Verification');
    try {
        console.log('1. Health Check');
        await axios.get('http://localhost:5000/ok');
        console.log('Health OK');

        console.log('2. Admin Login');
        const adminLogin = await axios.post(`${API_URL}/../auth/login`, {
            email: 'admin@company.com',
            password: 'admin123'
        });
        const adminToken = adminLogin.data.token;
        const adminHeaders = { Authorization: `Bearer ${adminToken}` };

        console.log('3. Get/Create Test User');
        // Simple: Create user if not exists (assume specific email)
        const userEmail = 'testassignee@company.com';
        // Try login
        let userToken, userId;
        try {
            const loginRes = await axios.post(`${API_URL}/../auth/login`, {
                email: userEmail,
                password: 'password123'
            });
            userToken = loginRes.data.token;
            userId = loginRes.data.user._id;
            console.log('User Exists');
        } catch (e) {
            console.log('Creating User...');
            // Need Admin to create
            const createRes = await axios.post(`${API_URL}/users`, {
                name: 'Test Assignee',
                email: userEmail,
                password: 'password123',
                role: 'Employee'
            }, { headers: adminHeaders });

            // Login
            const loginRes = await axios.post(`${API_URL}/../auth/login`, {
                email: userEmail,
                password: 'password123'
            });
            userToken = loginRes.data.token;
            userId = loginRes.data.user._id;
            console.log('User Created');
        }
        const userHeaders = { Authorization: `Bearer ${userToken}` };

        console.log('4. Create Workflow assigned to USER directly (simpler)');
        const wfRes = await axios.post(`${API_URL}/workflow/admin/workflows`, {
            name: `UserAssign_Test_${Date.now()}`,
            description: 'Direct User Assignment',
            formSchema: [{ key: 'notes', label: 'Notes', type: 'text', required: true }],
            steps: [{
                stepOrder: 1,
                stageName: 'User Approval',
                approverType: 'USER',
                userIds: [userId] // Assign directly to this user
            }]
        }, { headers: adminHeaders });
        const wfId = wfRes.data.data._id;
        console.log(`Workflow: ${wfId}`);

        console.log('5. Create Request');
        const reqRes = await axios.post(`${API_URL}/workflow/requests`, {
            workflowId: wfId,
            formData: { notes: 'Please Approve' }
        }, { headers: adminHeaders });
        // The endpoint returns { success: true, data: ... }
        const reqId = reqRes.data.data._id;
        console.log(`Request: ${reqId}`);

        console.log('6. Verify User sees it');
        const tasksRes = await axios.get(`${API_URL}/workflow/tasks/my`, { headers: userHeaders });
        const myTasks = tasksRes.data.data;
        const found = myTasks.find(t => t._id === reqId);

        if (found) {
            console.log('SUCCESS: User sees the task.');
        } else {
            console.error('FAILURE: User does NOT see the task.');
            console.log('Tasks found:', myTasks.map(t => t._id));
        }

    } catch (e) {
        console.error('ERROR:', e.message);
        if (e.response) console.error('Response:', e.response.data);
    }
    console.log('END');
}

testVisibility();
