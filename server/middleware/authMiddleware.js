import jwt from 'jsonwebtoken'
import User from '../model/User.js'

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) {
            return res.status(401).json({ success: false, msg: 'Token Not Provided' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded) {
            return res.status(401).json({ success: false, msg: 'Invalid Token' })
        }

        const user = await User.findById(decoded.id).select('-password').populate('roles')
        if (!user) {
            return res.status(401).json({ success: false, msg: 'User Not Found' })
        }

        // Compatibility: If roles array is empty but legacy role exists, treat it as a role object
        if (user.roles.length === 0 && user.role) {
            // Mock a role object for the middleware check
            user.roles.push({ name: user.role })
        }

        req.user = user
        next()

    } catch (err) {
        return res.status(500).json({ success: false, msg: 'Server Error', err })

    }
}

export default verifyToken
