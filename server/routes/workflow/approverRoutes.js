import express from 'express'
import verifyToken from '../../middleware/authMiddleware.js'
import * as ApproverController from '../../controller/workflow/ApproverController.js'

const router = express.Router()

router.use(verifyToken)

router.get('/tasks/my', ApproverController.getMyTasks)
router.get('/tasks/history', ApproverController.getTaskHistory)
router.post('/requests/:id/action', ApproverController.performAction)

export default router
