
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RequestInstance = require('../model/RequestInstance.js'); // Adjust path
const User = require('../model/User.js');
const WorkflowDefinition = require('../model/WorkflowDefinition.js');

// Mock mongoose connection since we can't easily import app.js
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const requests = await mongoose.model('RequestInstance').find()
            .populate('initiatorUserId', 'name email')
            .populate('currentAssignees', 'name email')
            .populate('workflowId', 'name')
            .sort({ createdAt: -1 });

        console.log(`Found ${requests.length} requests.`);

        for (const req of requests) {
            console.log('--------------------------------------------------');
            console.log(`ID: ${req._id}`);
            console.log(`Workflow: ${req.workflowId?.name || 'N/A'}`);
            console.log(`Status: ${req.status}`);
            console.log(`Step Index: ${req.currentStepIndex}`);
            console.log(`Initiator: ${req.initiatorUserId?.name} (${req.initiatorUserId?.email})`);
            console.log(`Assignees: ${req.currentAssignees.map(u => `${u.name} (${u.email})`).join(', ')}`);
            console.log(`Created At: ${req.createdAt}`);
        }

        // Also check users to see who "Admin" or "Approver" is
        const users = await mongoose.model('User').find();
        console.log('--------------------------------------------------');
        console.log('Users in DB:');
        users.forEach(u => console.log(`${u.name} (${u.email}) - ID: ${u._id}`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
