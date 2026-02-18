
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const roles = await mongoose.connection.collection('roles').find().toArray();
        console.log('Roles in DB:');
        roles.forEach(r => {
            console.log(`Name: ${r.name}, ID: ${r._id} (Type: ${typeof r._id})`);
        });

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
