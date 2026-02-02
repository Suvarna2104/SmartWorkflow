import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Role from './model/Role.js'

dotenv.config()

const predefinedRoles = [
    { name: 'Admin', description: 'System Administrator with full access' },
    { name: 'Manager', description: 'Department Manager responsible for approvals' },
    { name: 'Employee', description: 'Standard user who can initiate requests' },
    { name: 'HR', description: 'Human Resources personnel' }
]

const seedRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('Connected to MongoDB')

        for (const role of predefinedRoles) {
            const exists = await Role.findOne({ name: role.name })
            if (!exists) {
                await Role.create(role)
                console.log(`Created role: ${role.name}`)
            } else {
                console.log(`Role already exists: ${role.name}`)
            }
        }

        console.log('Role seeding completed.')
        process.exit()
    } catch (error) {
        console.error('Error seeding roles:', error)
        process.exit(1)
    }
}

seedRoles()
