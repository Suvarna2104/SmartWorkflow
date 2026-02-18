export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return res.status(403).json({ success: false, msg: 'Access Denied: No roles assigned' })
        }

        const rolesToCheck = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

        // Normalize for comparison (optional, but good practice)
        const normalizedAllowed = rolesToCheck.map(r => r.toLowerCase())

        const hasRole = req.user.roles.some(r => {
            const roleName = r.name || r.role || '' // Handle populated object or weird shape
            return normalizedAllowed.includes(roleName.toLowerCase())
        })

        if (!hasRole) {
            return res.status(403).json({ success: false, msg: `Access Denied: Requires one of [${rolesToCheck.join(', ')}]` })
        }
        next()
    }
}
