import RequestInstance from '../model/RequestInstance.js'
import WorkflowDefinition from '../model/WorkflowDefinition.js'
import User from '../model/User.js'
import { advanceRequest, moveToNextAssignableStep } from '../services/WorkflowEngine.js'

export const createRequest = async (req, res) => {
    try {
        const { workflowId, formData, attachments } = req.body

        const workflow = await WorkflowDefinition.findOne({ _id: workflowId, isActive: true })
        if (!workflow) {
            return res.status(404).json({ msg: 'Workflow not found or inactive' })
        }

        const newRequest = new RequestInstance({
            workflowId: workflow._id,
            workflowVersion: workflow.version,
            initiatorUserId: req.user._id,
            formData,
            attachments: attachments || [],
            currentStepIndex: -1,
            status: 'IN_PROGRESS',
            history: [{
                stepIndex: -1,
                action: 'SUBMIT',
                byUserId: req.user._id,
                comment: 'Request Initiated',
                timestamp: new Date()
            }]
        })

        await newRequest.save()

        // Fix: Use moveToNextAssignableStep to properly assign first step instead of auto-approving
        await moveToNextAssignableStep(newRequest._id, -1)

        // Fetch updated to return
        const updatedRequest = await RequestInstance.findById(newRequest._id).populate('workflowId')
        res.status(201).json(updatedRequest)

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: 'Server Error', error: error.message })
    }
}

export const getMyRequests = async (req, res) => {
    try {
        const requests = await RequestInstance.find({ initiatorUserId: req.user._id })
            .populate('workflowId', 'name version')
            .sort('-createdAt')
        res.json({ success: true, data: requests }) // Adjusted to consistent response format
    } catch (error) {
        res.status(500).json({ msg: 'Server Error', error: error.message })
    }
}

export const getAllRequests = async (req, res) => {
    try {
        // Strict Admin Check
        const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.some(r => r.name === 'Admin'))
        if (!isAdmin) {
            return res.status(403).json({ msg: 'Access Denied: Admins Only' })
        }

        const requests = await RequestInstance.find()
            .populate('workflowId', 'name version')
            .populate('initiatorUserId', 'name email')
            .sort('-createdAt')

        res.json({ success: true, data: requests })
    } catch (error) {
        res.status(500).json({ msg: 'Server Error', error: error.message })
    }
}

export const getPendingApprovals = async (req, res) => {
    try {
        const requests = await RequestInstance.find({
            currentAssignees: req.user._id,
            status: 'IN_PROGRESS'
        })
            .populate('workflowId', 'name')
            .populate('initiatorUserId', 'name email')
            .sort('-createdAt')

        res.json(requests)
    } catch (error) {
        res.status(500).json({ msg: 'Server Error', error: error.message })
    }
}

export const processAction = async (req, res) => {
    try {
        const { requestId } = req.params
        const { action, comment } = req.body // action: APPROVE, REJECT, RETURN

        if (!['APPROVE', 'REJECT', 'RETURN'].includes(action)) {
            return res.status(400).json({ msg: 'Invalid Action' })
        }

        const request = await RequestInstance.findById(requestId)
        if (!request) return res.status(404).json({ msg: 'Request not found' })

        // Validate assignee
        const isAssignee = request.currentAssignees.some(id => id.toString() === req.user._id.toString())
        const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.some(r => r.name === 'Admin'))

        if (!isAssignee && !isAdmin) {
            // Allow Admin to override? maybe. For now let's strict check assignee or maybe allow admin force
            return res.status(403).json({ msg: 'Not authorized to perform action on this request' })
        }

        const updatedRequest = await advanceRequest(requestId, action, req.user._id, comment)
        res.json(updatedRequest)

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: 'Server Error', error: error.message })
    }
}

export const getRequestById = async (req, res) => {
    try {
        const request = await RequestInstance.findById(req.params.id)
            .populate('workflowId')
            .populate('initiatorUserId', 'name email')
            .populate('history.byUserId', 'name')

        if (!request) return res.status(404).json({ msg: 'Request not found' })

        // Access Control: Initiator, Current Assignee, or Admin
        const isInitiator = request.initiatorUserId._id.toString() === req.user._id.toString()
        const isAssignee = request.currentAssignees.some(id => id.toString() === req.user._id.toString())
        const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.some(r => r.name === 'Admin'))

        if (!isInitiator && !isAssignee && !isAdmin) {
            return res.status(403).json({ msg: 'Access Denied' })
        }

        res.json({ data: request })
    } catch (error) {
        res.status(500).json({ msg: 'Server Error', error: error.message })
    }
}

export const getKanbanRequests = async (req, res) => {
    try {
        const { workflowId } = req.query
        if (!workflowId) {
            return res.status(400).json({ msg: 'Workflow ID is required' })
        }

        const user = req.user
        if (!user) {
            return res.status(401).json({ msg: 'User context missing' })
        }

        // Safe role check
        const roles = user.roles || []
        const isAdmin = user.role === 'admin' || roles.some(r => r && r.name === 'Admin')
        const isAuditor = roles.some(r => r && r.name === 'Auditor')

        let query = { workflowId }

        if (!isAdmin && !isAuditor) {
            // Regular user: can see only their requests OR requests assigned to them
            query.$or = [
                { initiatorUserId: user._id },
                { currentAssignees: user._id }
            ]
        }

        const requests = await RequestInstance.find(query)
            .populate('workflowId', 'name steps') // Need steps for stage names if needed, but mostly standard
            .populate('initiatorUserId', 'name email')
            .sort('-createdAt')

        res.json({ success: true, data: requests })

    } catch (error) {
        console.error("Error fetching kanban requests:", error)
        res.status(500).json({ msg: 'Server Error', error: error.message })
    }
}
