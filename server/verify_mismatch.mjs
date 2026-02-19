import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './model/User.js';
import Role from './model/Role.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('Script started');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Missing');

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection Error:', err.message);
        process.exit(1);
    }
};

const verifyFix = async () => {
    await connectDB();

    console.log('\n--- START VERIFICATION ---');

    console.log('Querying users...');
    const users = await User.find({}).populate('roles');
    console.log(`Found ${users.length} users.`);

    let discrepancies = 0;

    for (const u of users) {
        if (u.role && (!u.roles || u.roles.length === 0)) {
            console.log(`[MISMATCH] User ${u.name} (${u.email}) has role string "${u.role}" but NO roles array.`);

            const r = await Role.findOne({ name: u.role });
            if (r) {
                console.log(`   -> Found matching Role doc: ${r.name} (${r._id}). Should fix.`);
                discrepancies++;
            } else {
                console.log(`   -> NO matching Role doc found for "${u.role}". Cannot fix automatically.`);
            }
        }
    }

    console.log(`\nFound ${discrepancies} fixable discrepancies.`);
    console.log('--- VERIFICATION END ---');
    process.exit(0);
};

verifyFix();
