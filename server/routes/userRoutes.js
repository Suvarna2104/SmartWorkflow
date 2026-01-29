import express from 'express'
import { getUsers, createUser, updateUser, deleteUser } from '../controller/UserController.js'
import verifyToken from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes are protected
router.use(verifyToken)

router.get('/', getUsers)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

export default router
