import User from '../model/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const Login = async (req, res) => {
    const { email, password } = req.body
    try {
        if (!email || !password) {
            return res.status(401).json({ msg: 'All fields are required' })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(401).json({ msg: 'User Not exists' })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid Password' })
        }

        const token = jwt.sign({ id: user._id,email:user.email,role:user.role }, process.env.JWT_SECRET, { expiresIn: '30d' })

        return res.status(200).json({
            msg: 'Login Successfully', token, user: {
                id: user._id,
                email: user.email,
                role: user.role,
                name:user.name,
                team:user.team
            }
        })

    }
    catch (err) {
        console.log("Error in Login : ", err)
        return res.status(500).json({ msg: 'Internal Server Error', err })
    }
}

export { Login }
