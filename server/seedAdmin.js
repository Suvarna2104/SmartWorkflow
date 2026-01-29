import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import User from './model/User.js'

dotenv.config()

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDB Connected')

        const email = 'admin@gmail.com'
        const password = 'password' // Default password
        const role = 'admin'

        // Check if admin already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            console.log('Admin user already exists')
            process.exit(0)
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create user
        const newUser = new User({
            email,
            password: hashedPassword,
            role,
            name:'Admin',
            
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
