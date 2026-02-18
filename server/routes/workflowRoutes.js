import express from 'express'
import { createWorkflow, getWorkflows, getWorkflowById, updateWorkflow } from '../controller/WorkflowController.js'
import verifyToken from '../middleware/authMiddleware.js'
import requireRole from '../middleware/roleMiddleware.js'

const router = express.Router()

router.use(verifyToken)

// Only Admins can manage workflows
router.post('/', requireRole(['Admin', 'SuperAdmin']), createWorkflow)
router.get('/', getWorkflows)
router.get('/:id', getWorkflowById)
router.put('/:id', requireRole(['Admin', 'SuperAdmin']), updateWorkflow)

export default router
