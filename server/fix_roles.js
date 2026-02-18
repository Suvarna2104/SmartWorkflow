
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const collection = mongoose.connection.collection('roles');
        const roles = await collection.find().toArray();

        for (const r of roles) {
            console.log(`Checking Role: ${r.name}, ID: ${r._id} (Type: ${typeof r._id})`);

            // Check if ID is likely a string "admin" or similar (not 24 hex chars)
            const isObjectId = mongoose.Types.ObjectId.isValid(r._id) && (new mongoose.Types.ObjectId(r._id).toString() === r._id.toString());

            if (!isObjectId && typeof r._id === 'string' && r._id.length < 24) {
                console.log(`!!! Found invalid Role ID: ${r._id}. Fixing...`);

                // 1. Delete bad role
                await collection.deleteOne({ _id: r._id });

                // 2. Re-create with same name (let Mongo generate ObjectId)
                // Check if name exists (it shouldn't since we just deleted, but unique index might handle it)
                const newRole = {
                    name: r.name,
                    description: r.description,
                    permissions: r.permissions,
                    updatedAt: new Date(),
                    createdAt: new Date()
                };

                const result = await collection.insertOne(newRole);
                console.log(`FIXED: Created new role '${r.name}' with ID: ${result.insertedId}`);
            }
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
