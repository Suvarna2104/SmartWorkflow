import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import User from './model/User.js'
import Role from './model/Role.js'

dotenv.config()

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDB Connected')

        const email = 'admin@gmail.com'
        const password = 'password' // Default password
        const roleName = 'Admin' // Capitalized to match role definition usually

        // 1. Ensure Admin Role Exists
        let adminRole = await Role.findOne({ name: roleName })
        if (!adminRole) {
            console.log('Admin Role not found, creating...')
            adminRole = new Role({
                name: roleName,
                description: 'System Administrator with full access',
                permissions: ['ALL']
            })
            await adminRole.save()
            console.log('Admin Role created')
        }

        // Check if admin already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            console.log('Admin user already exists')
            // Optional: Update existing admin with new role structure?
            if (!existingUser.roles || existingUser.roles.length === 0) {
                console.log('Updating existing admin with roles array...')
                existingUser.roles = [adminRole._id]
                existingUser.role = roleName
                await existingUser.save()
                console.log('Admin user roles updated')
            }
            process.exit(0)
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create user
        const newUser = new User({
            name: 'Admin',
            email,
            password: hashedPassword,
            role: roleName, // Legacy string
            roles: [adminRole._id], // New array
            team: 'Management'
        })

        await newUser.save()
        console.log(`Admin created successfully:\nEmail: ${email}\nPassword: ${password}`)
        process.exit(0)
    } catch (error) {
        console.error('Error creating admin:', error)
        process.exit(1)
    }
}

createAdmin()
