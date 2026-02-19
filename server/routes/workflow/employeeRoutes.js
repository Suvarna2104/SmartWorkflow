import express from 'express'
import verifyToken from '../../middleware/authMiddleware.js'
import * as EmployeeController from '../../controller/workflow/EmployeeController.js'

const router = express.Router()

router.use(verifyToken)

router.get('/workflows/active', EmployeeController.getActiveWorkflows)

router.get('/workflows/:id', EmployeeController.getWorkflowById)
router.post('/requests', EmployeeController.createRequest)
router.get('/requests/my', EmployeeController.getMyRequests)
router.get('/requests/kanban', EmployeeController.getKanbanRequests) // Added before :id
router.get('/requests/:id', EmployeeController.getRequestDetails)

export default router
