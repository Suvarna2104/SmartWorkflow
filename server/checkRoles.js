import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Role from './model/Role.js'

dotenv.config()

const checkRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('Connected to MongoDB')

        const roles = await Role.find()
        console.log('Roles in DB:', roles)

        process.exit()
    } catch (error) {
        console.error('Error checking roles:', error)
        process.exit(1)
    }
}

checkRoles()
