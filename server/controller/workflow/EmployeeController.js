import WorkflowDefinition from '../../model/WorkflowDefinition.js'
import RequestInstance from '../../model/RequestInstance.js'
import * as Engine from '../../services/WorkflowEngine.js'
import ApprovalAction from '../../model/ApprovalAction.js'

export const getActiveWorkflows = async (req, res) => {
    try {
        const allActive = await WorkflowDefinition.find({ isActive: true }).sort({ version: -1 })

        const map = new Map()
        for (const wf of allActive) {
            if (!map.has(wf.name)) {
                map.set(wf.name, wf)
            }
        }

        res.status(200).json({ success: true, data: Array.from(map.values()) })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const createRequest = async (req, res) => {
    try {
        const { workflowId, formData } = req.body
        const userId = req.user._id

        const workflow = await WorkflowDefinition.findById(workflowId)
        if (!workflow) return res.status(404).json({ success: false, msg: 'Workflow not found' })

        const request = await RequestInstance.create({
            workflowId: workflow._id,
            workflowVersion: workflow.version,
            initiatorUserId: userId,
            formData,
            status: 'IN_PROGRESS',
            currentStepIndex: -1
        })

        const updatedRequest = await Engine.moveToNextAssignableStep(request._id, -1)

        res.status(201).json({ success: true, data: updatedRequest })

    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const getMyRequests = async (req, res) => {
    try {
        const requests = await RequestInstance.find({ initiatorUserId: req.user._id })
            .populate('workflowId', 'name')
            .sort({ createdAt: -1 })
        res.status(200).json({ success: true, data: requests })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const getRequestDetails = async (req, res) => {
    try {
        const { id } = req.params
        const request = await RequestInstance.findById(id)
            .populate('workflowId')
            .populate('currentAssignees', 'name email')

        if (!request) return res.status(404).json({ success: false, msg: 'Not found' })

        const history = await ApprovalAction.find({ requestId: id })
            .populate('byUserId', 'name')
            .sort({ createdAt: 1 })

        res.status(200).json({ success: true, data: { ...request.toObject(), history } })

    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}
