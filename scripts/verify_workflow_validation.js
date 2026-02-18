
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testWorkflowValidation() {
    console.log('--- Starting Workflow Validation Test ---');

    try {
        // 1. Login as Admin
        const loginRes = await axios.post(`${API_URL}/../auth/login`, {
            email: 'admin@company.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Test Missing Role ID
        console.log('\nTest: Create Workflow with Missing Role ID in Step');
        try {
            await axios.post(`${API_URL}/workflow/admin/workflows`, {
                name: 'Bad Workflow 1',
                description: 'Should fail',
                formSchema: [],
                steps: [{
                    stepOrder: 1,
                    stageName: 'Bad Step',
                    approverType: 'ROLE',
                    roleIds: [] // Invalid
                }]
            }, { headers });
            console.error('FAIL: Created workflow with empty roleIds');
        } catch (err) {
            if (err.response && err.response.status === 400) {
                console.log(`PASS: Rejected with 400 - ${err.response.data.msg}`);
            } else {
                console.error(`FAIL: Unexpected status ${err.response?.status}`);
            }
        }

        // 3. Test Missing User ID
        console.log('\nTest: Create Workflow with Missing User ID in Step');
        try {
            await axios.post(`${API_URL}/workflow/admin/workflows`, {
                name: 'Bad Workflow 2',
                description: 'Should fail',
                formSchema: [],
                steps: [{
                    stepOrder: 1,
                    stageName: 'Bad Step 2',
                    approverType: 'USER',
                    userIds: [] // Invalid
                }]
            }, { headers });
            console.error('FAIL: Created workflow with empty userIds');
        } catch (err) {
            if (err.response && err.response.status === 400) {
                console.log(`PASS: Rejected with 400 - ${err.response.data.msg}`);
            } else {
                console.error(`FAIL: Unexpected status ${err.response?.status}`);
            }
        }

    } catch (err) {
        console.error('Test Execution Error:', err.message);
    }
}

testWorkflowValidation();
