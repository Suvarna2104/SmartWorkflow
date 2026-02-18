
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
axios.defaults.timeout = 5000; // 5 seconds
const LOG_FILE = 'verify_assignee_visibility_output.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

async function testAssigneeVisibility() {
    log('--- Starting Assignee Visibility Verification ---');

    try {
        // 1. Login as Admin
        log('Logging in as Admin...');
        const adminLogin = await axios.post(`${API_URL}/../auth/login`, {
            email: 'admin@company.com',
            password: 'admin123'
        });
        const adminToken = adminLogin.data.token;
        const adminHeaders = { Authorization: `Bearer ${adminToken}` };

        // 2. Ensure "TestApprover" Role exists
        log('Checking/Creating Role...');
        const rolesRes = await axios.get(`${API_URL}/workflow/admin/roles`, { headers: adminHeaders });
        let testRole = rolesRes.data.data.find(r => r.name === 'TestApprover');
        if (!testRole) {
            const createRoleRes = await axios.post(`${API_URL}/workflow/admin/roles`, {
                name: 'TestApprover',
                description: 'Role for testing assignment'
            }, { headers: adminHeaders });
            testRole = createRoleRes.data.data;
            log(`Created Role: ${testRole.name} (${testRole._id})`);
        } else {
            log(`Found Role: ${testRole.name} (${testRole._id})`);
        }

        // 3. Ensure User "ApproverUser" exists and has this Role
        log('Checking/Creating Approver User...');
        // We need an endpoint to check users or just create one and ignore dup error (or unique email)
        // Let's try to login as approver, if fail, create.
        let approverToken = null;
        let approverUserId = null;

        try {
            const appLogin = await axios.post(`${API_URL}/../auth/login`, {
                email: 'approver@test.com',
                password: 'password123'
            });
            approverToken = appLogin.data.token;
            approverUserId = appLogin.data.user._id;
            log('Approver User logged in.');
        } catch (e) {
            log('Creating Approver User...');
            // Need admin endpoint to create user
            const createUserRes = await axios.post(`${API_URL}/users`, { // Check route? usually /api/users
                name: 'Approver User',
                email: 'approver@test.com',
                password: 'password123',
                role: 'Employee', // Default
                roles: [testRole._id]
            }, { headers: adminHeaders });

            // Login now
            const appLogin = await axios.post(`${API_URL}/../auth/login`, {
                email: 'approver@test.com',
                password: 'password123'
            });
            approverToken = appLogin.data.token;
            approverUserId = appLogin.data.user._id;
            log('Approver User created and logged in.');
        }

        const approverHeaders = { Authorization: `Bearer ${approverToken}` };

        // 4. Create Workflow assigned to this Role
        log('Creating Workflow...');
        const wfName = `Visibility_Test_${Date.now()}`;
        const wfRes = await axios.post(`${API_URL}/workflow/admin/workflows`, {
            name: wfName,
            description: 'Testing Visibility',
            formSchema: [{ key: 'data', label: 'Data', type: 'text', required: true }],
            steps: [{
                stepOrder: 1,
                stageName: 'Role Approval',
                approverType: 'ROLE',
                roleIds: [testRole._id]
            }]
        }, { headers: adminHeaders });
        const workflowId = wfRes.data.data._id;
        log(`Workflow Created: ${workflowId}`);

        // 5. Create Request (as Admin or common user)
        log('Submitting Request...');
        const reqRes = await axios.post(`${API_URL}/workflow/requests`, {
            workflowId,
            formData: { data: 'Secret Data' }
        }, { headers: adminHeaders });
        const requestId = reqRes.data._id; // Updated response structure? 
        // RequestController createRequest returns: res.status(201).json({ success: true, data: updatedRequest }) 
        // OR just updatedRequest (lines 39/42 in diffs showed inconsistency, let's check)
        // EmployeeController returns { success: true, data: ... }
        // RequestController (old?) returned object directly. 
        // Based on recent view of EmployeeController, it returns { success: true, data: ... }
        // Wait, admin uses /api/workflow/requests -> EmployeeController.createRequest? 
        // routes/workflow/index.js -> employeeRoutes -> router.post('/requests', ...)
        // so it returns {success:true, data:...}
        const requestData = reqRes.data.data || reqRes.data;
        const realRequestId = requestData._id;
        log(`Request Created: ${realRequestId}`);

        // 6. Verify Approver sees it
        log('Checking Approver Tasks...');
        const tasksRes = await axios.get(`${API_URL}/workflow/tasks/my`, { headers: approverHeaders });
        const myTasks = tasksRes.data.data;

        const found = myTasks.find(t => t._id === realRequestId);
        if (found) {
            log('PASS: Approver found the request in My Tasks.');
        } else {
            log('FAIL: Request not found in Approver tasks.');
            log('My Tasks IDs: ' + myTasks.map(t => t._id).join(', '));
        }

    } catch (err) {
        log('Test Error: ' + err.message);
        if (err.response) log('Response: ' + JSON.stringify(err.response.data));
    }
}

testAssigneeVisibility();
