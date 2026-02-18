
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const usersCollection = mongoose.connection.collection('users');
        const rolesCollection = mongoose.connection.collection('roles');

        // unique roles from User collection
        const users = await usersCollection.find().toArray();
        let fixedCount = 0;

        for (const user of users) {
            let changed = false;
            let newRoles = [];

            if (user.roles && Array.isArray(user.roles)) {
                for (let rId of user.roles) {
                    // Check if role string "admin"
                    if (typeof rId === 'string' && rId === 'admin') {
                        console.log(`User ${user.email} has "admin" role string. Finding proper Role ID...`);
                        const roleDoc = await rolesCollection.findOne({ name: 'Admin' }); // Case sensitive? 'admin'?
                        // try both
                        const adminRole = await rolesCollection.findOne({ name: { $regex: /^admin$/i } });

                        if (adminRole) {
                            console.log(`Replacing "admin" with ${adminRole._id}`);
                            newRoles.push(adminRole._id);
                            changed = true;
                        } else {
                            console.log('Could not find Admin role to replace.');
                            newRoles.push(rId); // Keep it? Or remove?
                        }
                    } else {
                        newRoles.push(rId);
                    }
                }
            }

            if (changed) {
                await usersCollection.updateOne({ _id: user._id }, { $set: { roles: newRoles } });
                fixedCount++;
                console.log(`Fixed User: ${user.email}`);
            }
        }

        console.log(`Fixed ${fixedCount} users.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
