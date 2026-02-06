import express from 'express'
import verifyToken from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import * as AdminController from '../../controller/workflow/AdminController.js'

const router = express.Router()

// Apply Auth and Admin checks
router.use(verifyToken)
router.use(requireRole('admin'))

router.get('/roles', AdminController.getRoles)
router.post('/roles', AdminController.createRole)

router.post('/users', AdminController.createUser)

router.get('/workflows', AdminController.getWorkflowsAdmin)
router.post('/workflows', AdminController.createWorkflow)
router.put('/workflows/:id/new-version', AdminController.createNewVersion)
router.patch('/workflows/:id/toggle', AdminController.toggleWorkflowStatus)
router.delete('/workflows/:id', AdminController.deleteWorkflow)

export default router
