
import mongoose from 'mongoose';

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' }); // try explicit path or default
// If that fails, try hardcoded from what we see in app.js or .env file
// mongoose.connect(process.exports.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_workflow')

// Let's just try to read .env first
import fs from 'fs';
try {
    const envConfig = dotenv.parse(fs.readFileSync('server/.env'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
} catch (e) {
    console.log("Could not read server/.env, trying default")
}

const URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_workflow';
console.log("Connecting to:", URI);

mongoose.connect(URI)
    .then(async () => {
        console.log("Connected to DB for Inspection");

        // Define Schemas minimal
        const userSchema = new mongoose.Schema({ name: String, email: String, role: String, roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }], isActive: Boolean });
        const roleSchema = new mongoose.Schema({ name: String });
        const requestSchema = new mongoose.Schema({ status: String, workflowId: mongoose.Schema.Types.ObjectId, currentAssignees: [] });
        const workflowSchema = new mongoose.Schema({ name: String, steps: [] });

        const User = mongoose.model('User', userSchema);
        const Role = mongoose.model('Role', roleSchema);
        const RequestInstance = mongoose.model('RequestInstance', requestSchema);
        const WorkflowDefinition = mongoose.model('WorkflowDefinition', workflowSchema);

        // 1. Dump Roles
        const roles = await Role.find({});
        console.log("\n--- ROLES ---");
        roles.forEach(r => console.log(`ID: ${r._id}, Name: "${r.name}"`));

        // 2. Dump Users
        const users = await User.find({});
        console.log("\n--- USERS ---");
        users.forEach(u => {
            console.log(`ID: ${u._id}, Name: "${u.name}", Role (legacy): "${u.role}", Roles (refs): ${u.roles}, Active: ${u.isActive}`);
        });

        // 3. Dump Recent Stuck Requests
        const recentRequests = await RequestInstance.find({ status: 'PENDING_ASSIGNMENT' }).sort({ _id: -1 }).limit(3);
        console.log("\n--- RECENT STUCK REQUESTS ---");

        for (const req of recentRequests) {
            console.log(`Req ID: ${req._id}, Status: ${req.status}, Workflow: ${req.workflowId}`);
            // Get Workflow Steps to see what it *wanted*
            const wf = await WorkflowDefinition.findById(req.workflowId);
            if (wf) {
                console.log(`   Workflow: "${wf.name}"`);
                wf.steps.forEach((s, idx) => {
                    console.log(`   Step ${idx}: ${s.stageName}, Type: ${s.approverType}, RoleIDs: ${s.roleIds}`);
                });
            }
        }

        await mongoose.disconnect();
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });
