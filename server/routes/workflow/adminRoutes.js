import express from 'express'
import verifyToken from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import * as AdminController from '../../controller/workflow/AdminController.js'

const router = express.Router()

// Apply Auth and Admin checks
router.use(verifyToken)
router.use(requireRole(['Admin', 'SuperAdmin']))

router.get('/roles', AdminController.getRoles)
router.get('/user-roles', AdminController.getUserRoles) // New Endpoint for StepsBuilder
router.post('/roles', AdminController.createRole)

router.post('/users', AdminController.createUser)

router.get('/workflows', AdminController.getWorkflowsAdmin)
router.post('/workflows', AdminController.createWorkflow)
router.put('/workflows/:id/new-version', AdminController.createNewVersion)
router.patch('/workflows/:id/toggle', AdminController.toggleWorkflowStatus)
router.delete('/workflows/:id', AdminController.deleteWorkflow)
router.post('/requests/:id/assign', AdminController.assignRequest)

export default router
