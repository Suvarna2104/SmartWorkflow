import Role from '../model/Role.js'

export const getRoles = async (req, res) => {
    try {
        const roles = await Role.find()
        res.json(roles)
    } catch (error) {
        res.status(500).json({ msg: 'Server Error', error: error.message })
    }
}
