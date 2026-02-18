import jwt from 'jsonwebtoken'
import User from '../model/User.js'

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, msg: 'Token Not Provided or Invalid Format' })
        }

        const token = authHeader.split(' ')[1]
        if (!token) {
            return res.status(401).json({ success: false, msg: 'Token Missing' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded) {
            return res.status(401).json({ success: false, msg: 'Invalid Token' })
        }

        const user = await User.findById(decoded.id).select('-password').populate('roles')
        if (!user) {
            return res.status(401).json({ success: false, msg: 'User Not Found' })
        }

        // Compatibility: Ensure roles is always an array of objects
        if (!user.roles) user.roles = []

        // If legacy role string exists, add it to roles array if not already present
        if (user.role && typeof user.role === 'string') {
            const exists = user.roles.find(r => r.name === user.role)
            if (!exists) {
                user.roles.push({ name: user.role, _id: 'legacy_role' })
            }
        }

        req.user = user
        next()

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, msg: 'Token Expired' })
        }
        return res.status(500).json({ success: false, msg: 'Server Error', err })
    }
}

export default verifyToken
