import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './model/User.js';
import Role from './model/Role.js';
import WorkflowDefinition from './model/WorkflowDefinition.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const runDiagnosis = async () => {
    await connectDB();

    console.log('\n--- ROLES ---');
    const roles = await Role.find({});
    roles.forEach(r => console.log(`ID: ${r._id}, Name: ${r.name}`));

    console.log('\n--- USERS ---');
    const users = await User.find({}).populate('roles');
    users.forEach(u => {
        console.log(`ID: ${u._id}, Name: ${u.name}, Role (String): "${u.role}", Roles (Array): ${u.roles ? u.roles.map(r => `${r.name} (${r._id})`).join(', ') : 'None'}`);
    });

    console.log('\n--- WORKFLOW DEFINITIONS ---');
    const workflows = await WorkflowDefinition.find({ isActive: true });
    workflows.forEach(wf => {
        console.log(`ID: ${wf._id}, Name: ${wf.name}, Version: ${wf.version}`);
        wf.steps.forEach((step, index) => {
            console.log(`  Step ${index}: ${step.stepName}, Type: ${step.approverType}`);
            if (step.approverType === 'ROLE') {
                console.log(`    RoleIds: ${step.roleIds ? step.roleIds.join(', ') : 'None'}`);
                console.log(`    ApproverRoleId: ${step.approverRoleId || 'None'}`);
            }
        });
    });

    console.log('\n--- DIAGNOSIS END ---');
    process.exit(0);
};

runDiagnosis();
