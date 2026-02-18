import express from 'express'
import { createRequest, getMyRequests, getPendingApprovals, getAllRequests, processAction, getRequestById } from '../controller/RequestController.js'
import verifyToken from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(verifyToken)

router.post('/', createRequest)
router.get('/my', getMyRequests)
router.get('/pending', getPendingApprovals)
router.get('/all', getAllRequests) // Admin only
router.get('/:id', getRequestById)
router.post('/:requestId/action', processAction)

export default router
