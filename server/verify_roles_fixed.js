
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const roles = await mongoose.connection.collection('roles').find().toArray();
        console.log('--- Current Roles in DB ---');
        let allValid = true;
        roles.forEach(r => {
            const isObjectId = r._id instanceof mongoose.Types.ObjectId;
            console.log(`Name: ${r.name}, ID: ${r._id} (Type: ${typeof r._id}, IsObjectId: ${isObjectId})`);
            if (!isObjectId && typeof r._id === 'string') allValid = false;
        });

        if (allValid) {
            console.log('SUCCESS: All roles have ObjectId type IDs.');
        } else {
            console.log('FAILURE: Some roles still have String IDs.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
