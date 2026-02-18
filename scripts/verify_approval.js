
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
axios.defaults.timeout = 5000;

async function testApproval() {
    console.log('START: Approval Verification');
    try {
        // 1. Admin Login
        const adminLogin = await axios.post(`${API_URL}/../auth/login`, {
            email: 'admin@company.com',
            password: 'admin123'
        });
        const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };

        // 2. User Login (reuse from previous or create)
        const userEmail = 'testassignee@company.com';
        let userToken, userId;
        try {
            const loginRes = await axios.post(`${API_URL}/../auth/login`, {
                email: userEmail,
                password: 'password123'
            });
            userToken = loginRes.data.token;
            userId = loginRes.data.user._id;
        } catch (e) {
            console.error('User not found, run visibility test first.');
            return;
        }
        const userHeaders = { Authorization: `Bearer ${userToken}` };

        // 3. Create Workflow & Request
        console.log('Creating Workflow & Request...');
        const wfRes = await axios.post(`${API_URL}/workflow/admin/workflows`, {
            name: `Approval_Test_${Date.now()}`,
            formSchema: [{ key: 'd', label: 'D', type: 'text', required: false }],
            steps: [{
                stepOrder: 1,
                stageName: 'User Approval',
                approverType: 'USER',
                userIds: [userId]
            }]
        }, { headers: adminHeaders });
        const wfId = wfRes.data.data._id;

        const reqRes = await axios.post(`${API_URL}/workflow/requests`, {
            workflowId: wfId,
            formData: { d: 'test' }
        }, { headers: adminHeaders });
        const reqId = reqRes.data.data._id;
        console.log(`Request: ${reqId}, Status: ${reqRes.data.data.status}`);

        // 4. User Approves
        console.log('User Approving...');
        const actionRes = await axios.post(`${API_URL}/workflow/requests/${reqId}/action`, {
            action: 'APPROVE',
            comment: 'Looks good'
        }, { headers: userHeaders });

        console.log('Action Response:', actionRes.status);

        // 5. Verify Status
        const finalRes = await axios.get(`${API_URL}/workflow/requests/${reqId}`, { headers: adminHeaders });
        const finalStatus = finalRes.data.data.status;
        console.log(`Final Status: ${finalStatus}`);

        if (finalStatus === 'APPROVED') {
            console.log('SUCCESS: Request Approved.');
        } else {
            console.error(`FAILURE: Status is ${finalStatus}`);
        }

    } catch (e) {
        console.error('ERROR:', e.message);
        if (e.response) console.error('Response:', e.response.data);
    }
}

testApproval();
