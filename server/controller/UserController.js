import User from '../model/User.js'
import bcrypt from 'bcryptjs'

// Get all users
export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password')
        res.status(200).json({ success: true, users })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Server Error', error })
    }
}

// Create new user
export const createUser = async (req, res) => {
    try {
        const { name, email, password, role, team } = req.body

        // Check if user exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ success: false, msg: 'User already exists' })
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role,
            team
        })

        await newUser.save()

        res.status(201).json({
            success: true, user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                team: newUser.team
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, msg: 'Server Error', error })
    }
}

// Update user
export const updateUser = async (req, res) => {
    try {
        const { name, role, team } = req.body
        const userId = req.params.id

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' })
        }

        user.name = name || user.name
        user.role = role || user.role
        user.team = team || user.team

        await user.save()

        res.status(200).json({
            success: true, user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                team: user.team
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, msg: 'Server Error', error })
    }
}

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id
        const user = await User.findByIdAndDelete(userId)

        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' })
        }

        res.status(200).json({ success: true, msg: 'User deleted successfully' })

    } catch (error) {
        res.status(500).json({ success: false, msg: 'Server Error', error })
    }
}
