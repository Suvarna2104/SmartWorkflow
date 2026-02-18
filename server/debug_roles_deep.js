
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const roles = await mongoose.connection.collection('roles').find().toArray();
        console.log('--- Roles Deep Check ---');
        roles.forEach(r => {
            console.log(`Name: '${r.name}'`);
            console.log(`   _id value:`, r._id);
            console.log(`   _id type:`, typeof r._id);
            console.log(`   constructor:`, r._id.constructor.name);
            console.log(`   isObjectId:`, r._id instanceof mongoose.Types.ObjectId);
            // Check if string "Manager" or "Admin"
            if (r._id.toString() === 'Manager') console.log('   !!! MATCHES STRING "Manager"');
            if (r._id.toString() === 'admin') console.log('   !!! MATCHES STRING "admin"');
            console.log('---------------------------');
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
