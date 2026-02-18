
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const adminRole = await mongoose.connection.collection('roles').findOne({ name: 'Admin' });
        console.log('Admin Role:');
        console.log(adminRole);

        if (adminRole && typeof adminRole._id === 'string') {
            console.log('Admin role has STRING ID!');

            // Fix it now
            await mongoose.connection.collection('roles').deleteOne({ _id: adminRole._id });
            const newRole = {
                name: adminRole.name,
                description: adminRole.description,
                permissions: adminRole.permissions,
                updatedAt: new Date(),
                createdAt: new Date()
            };
            const res = await mongoose.connection.collection('roles').insertOne(newRole);
            console.log('Fixed Admin Role ID:', res.insertedId);
        } else {
            console.log('Admin role has ObjectId (Correct).');
        }

        // Also check if there is a role with _id "admin" (lowercase?)
        const lowerAdmin = await mongoose.connection.collection('roles').findOne({ _id: 'admin' });
        if (lowerAdmin) {
            console.log('Found role with _id="admin". Deleting...');
            await mongoose.connection.collection('roles').deleteOne({ _id: 'admin' });
            console.log('Deleted bad "admin" role.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
