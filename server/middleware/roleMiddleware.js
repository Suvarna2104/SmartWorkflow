export const requireRole = (roleName) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return res.status(403).json({ success: false, msg: 'Access Denied: No roles assigned' })
        }

        // DEBUG LOGGING
        console.log('--- Role Middleware Check ---')
        console.log('User:', req.user ? req.user.name : 'No User')
        console.log('User Roles:', req.user && req.user.roles ? JSON.stringify(req.user.roles) : 'No Roles')
        console.log('Required Role:', roleName)

        const hasRole = req.user.roles.some(r => r.name === roleName)
        console.log('Has Role?', hasRole)

        if (!hasRole) {
            return res.status(403).json({ success: false, msg: `Access Denied: Requires ${roleName} role` })
        }
        next()
    }
}
