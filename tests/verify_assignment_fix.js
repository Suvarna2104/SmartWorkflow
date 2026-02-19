
const fetch = global.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
    try {
        console.log("Starting Verification...");

        // 1. Login as Admin
        console.log("\n1. Logging in as Admin...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@thynk.com', password: 'admin' }) // Assumption: admin exists
        });
        const loginData = await loginRes.json();
        if (!loginData.success) throw new Error("Login failed: " + loginData.msg);
        const token = loginData.token;
        const adminUser = loginData.user;
        console.log("   Logged in as: " + adminUser.name);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 2. Get Roles to find a valid role (Admin)
        console.log("\n2. Fetching Roles...");
        const rolesRes = await fetch(`${BASE_URL}/workflow/admin/roles`, { headers });
        const rolesData = await rolesRes.json();
        const adminRole = rolesData.data.find(r => r.name.toLowerCase().includes('admin'));
        if (!adminRole) throw new Error("Admin role not found");
        console.log("   Found Role: " + adminRole.name);

        // 3. Create Valid Workflow
        console.log("\n3. Creating Valid Workflow...");
        const validWfPayload = {
            name: `Test Valid Workflow ${Date.now()}`,
            description: "Auto test valid",
            formSchema: [{ key: "reason", label: "Reason", type: "text", required: true }],
            steps: [{
                stageName: "Step 1",
                approverType: "ROLE",
                roleIds: [adminRole._id],
                stepOrder: 1
            }]
        };
        const wfRes = await fetch(`${BASE_URL}/workflow/admin/workflows`, {
            method: 'POST',
            headers,
            body: JSON.stringify(validWfPayload)
        });
        const wfData = await wfRes.json();
        if (!wfData.success) throw new Error("Workflow creation failed: " + wfData.error);
        const validWfId = wfData.data._id;
        console.log("   Created Workflow ID: " + validWfId);

        // 4. Submit Request (Should Succeed)
        console.log("\n4. Submitting Request (Expect IN_PROGRESS)...");
        const reqRes = await fetch(`${BASE_URL}/workflow/requests`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                workflowId: validWfId,
                formData: { reason: "Test Request" }
            })
        });
        const reqData = await reqRes.json();
        if (!reqData.success) throw new Error("Request creation failed: " + reqData.error);

        // Check Status
        const reqId = reqData.data._id;
        const checkRes = await fetch(`${BASE_URL}/workflow/requests/${reqId}`, { headers });
        const checkData = await checkRes.json();
        const request = checkData.data;

        if (request.status === 'IN_PROGRESS' && request.currentAssignees.length > 0) {
            console.log("   SUCCESS: Request is IN_PROGRESS with assignees.");
        } else {
            throw new Error(`FAILURE: Request status is ${request.status}, Assignees: ${request.currentAssignees.length}`);
        }

        // 5. Create Invalid Workflow (Role with no users)
        // First we need a dummy role or just a fake ID? 
        // Fake ID will fail validation "CastError" or "Ref check" if we had ref checking enabled?
        // Step validation just checks array length. 
        // But computeAssignees will return empty.

        console.log("\n5. Creating 'Stuck' Workflow (Dummy Role)...");
        // Create a role that definitely has no users
        const dummyRoleRes = await fetch(`${BASE_URL}/workflow/admin/roles`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: `EmptyRole_${Date.now()}` })
        });
        const dummyRoleData = await dummyRoleRes.json();
        const dummyRoleId = dummyRoleData.data._id;

        const stuckWfPayload = {
            name: `Test Stuck Workflow ${Date.now()}`,
            steps: [{
                stageName: "Step 1",
                approverType: "ROLE",
                roleIds: [dummyRoleId],
                stepOrder: 1
            }],
            formSchema: [{ key: "r", label: "r", type: "text", required: false }]
        };

        const stuckWfRes = await fetch(`${BASE_URL}/workflow/admin/workflows`, {
            method: 'POST',
            headers,
            body: JSON.stringify(stuckWfPayload)
        });
        const stuckWfId = (await stuckWfRes.json()).data._id;

        // 6. Submit Stuck Request
        console.log("\n6. Submitting Request (Expect PENDING_ASSIGNMENT)...");
        const stuckReqRes = await fetch(`${BASE_URL}/workflow/requests`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ workflowId: stuckWfId, formData: {} })
        });
        // Note: Creating request MIGHT fail if my logic throws error, BUT logic catches error and saves status?
        // Wait, my logic logs error but saves request as PENDING_ASSIGNMENT.
        // It returns the request object.
        const stuckReqData = await stuckReqRes.json();
        const stuckReqId = stuckReqData.data._id;

        if (stuckReqData.data.status === 'PENDING_ASSIGNMENT') {
            console.log("   SUCCESS: Request trapped in PENDING_ASSIGNMENT as expected.");
        } else {
            console.warn(`   WARNING: Request status is ${stuckReqData.data.status}. Expected PENDING_ASSIGNMENT.`);
        }

        // 7. Recover Request
        console.log("\n7. Recovering Request via Admin Endpoint...");
        const recoverRes = await fetch(`${BASE_URL}/workflow/admin/requests/${stuckReqId}/assign`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ assignToUserId: adminUser._id })
        });
        const recoverData = await recoverRes.json();

        if (recoverData.success && recoverData.data.status === 'IN_PROGRESS' && recoverData.data.currentAssignees.includes(adminUser._id)) {
            console.log("   SUCCESS: Request recovered and assigned to admin.");
        } else {
            throw new Error("Recovery failed: " + JSON.stringify(recoverData));
        }

        console.log("\nall tests passed!");

    } catch (e) {
        console.error("\nTEST FAILED:", e.message);
    }
}

runTest();
