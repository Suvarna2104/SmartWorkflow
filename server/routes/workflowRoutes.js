import express from 'express'
import { createWorkflow, getWorkflows, getWorkflowById, updateWorkflow } from '../controller/WorkflowController.js'
import verifyToken from '../middleware/authMiddleware.js'
import requireRole from '../middleware/roleMiddleware.js'

const router = express.Router()

router.use(verifyToken)

// Only Admins can manage workflows
router.post('/', requireRole(['Admin', 'admin']), createWorkflow)
router.get('/', getWorkflows) // Employees can list active workflows? Yes, to start them. 
// Wait, getWorkflows in controller returns ALL active.
// Maybe filter? For now, list all.
router.get('/:id', getWorkflowById)
router.put('/:id', requireRole(['Admin', 'admin']), updateWorkflow)

export default router
