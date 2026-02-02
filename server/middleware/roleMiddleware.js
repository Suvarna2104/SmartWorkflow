const requireRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, msg: 'Not Authorized' })
        }

        const user = req.user

        // Normalize requiredRoles to array
        const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

        // Check legacy single role
        if (rolesToCheck.includes(user.role)) {
            return next()
        }

        // Check new roles array
        if (user.roles && user.roles.length > 0) {
            const hasRole = user.roles.some(r => rolesToCheck.includes(r.name))
            if (hasRole) {
                return next()
            }
        }

        return res.status(403).json({ success: false, msg: 'Access Denied: Insufficient Role' })
    }
}

export default requireRole
