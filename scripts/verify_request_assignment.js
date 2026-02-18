
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const LOG_FILE = 'verify_output.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

// Clear log file
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

async function testRequestAssignment() {
    log('--- Starting Request Assignment Verification ---');

    try {
        // 0. Health Check
        try {
            await axios.get('http://localhost:5000/ok');
            log('Health Check: OK');
        } catch (e) {
            log('Health Check Failed. Server might be down.');
            return;
        }

        // 1. Login as Admin
        log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/../auth/login`, {
            email: 'admin@company.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create a Test Workflow
        log('\nCreating Test Workflow...');
        const rolesRes = await axios.get(`${API_URL}/workflow/admin/roles`, { headers });
        const adminRole = rolesRes.data.data.find(r => r.name === 'Admin');

        const wfName = `AutoAssign_Test_${Date.now()}`;
        const wfRes = await axios.post(`${API_URL}/workflow/admin/workflows`, {
            name: wfName,
            description: 'Testing Auto Assignment',
            formSchema: [{ key: 'reason', label: 'Reason', type: 'text', required: true }],
            steps: [{
                stepOrder: 1,
                stageName: 'Admin Approval',
                approverType: 'ROLE',
                roleIds: [adminRole._id]
            }]
        }, { headers });
        const workflowId = wfRes.data.data._id;
        log(`Workflow Created: ${workflowId}`);

        // 3. Submit Request
        log('\nSubmitting Request...');
        const reqRes = await axios.post(`${API_URL}/workflow/requests`, {
            workflowId,
            formData: { reason: 'Test Request' }
        }, { headers });

        const request = reqRes.data;
        log(`Request Created: ${request._id}`);
        log(`Status: ${request.status}`);
        log(`Current Step: ${request.currentStepIndex}`);
        log(`Assignees: ${JSON.stringify(request.currentAssignees)}`);

        // 4. Verify Assignment
        if (request.status === 'IN_PROGRESS' && request.currentAssignees.length === 1) {
            log('PASS: Request is IN_PROGRESS and has 1 assignee.');
        } else {
            log(`FAIL: Request status ${request.status} or assignee count ${request.currentAssignees.length} mismatch.`);
        }

    } catch (err) {
        log('Test Execution Error: ' + err.message);
        if (err.response) log('Response: ' + JSON.stringify(err.response.data));
    }
}

testRequestAssignment();
