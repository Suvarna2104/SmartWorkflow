import express from 'express'
import { getRoles } from '../controller/RoleController.js'
import verifyToken from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(verifyToken)

router.get('/', getRoles)

export default router
