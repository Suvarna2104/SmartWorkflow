import RequestInstance from '../../model/RequestInstance.js'
import * as Engine from '../../services/WorkflowEngine.js'

export const getMyTasks = async (req, res) => {
    try {
        // Find requests where currentAssignees includes my ID
        const tasks = await RequestInstance.find({
            currentAssignees: req.user._id,
            status: 'IN_PROGRESS'
        })
            .populate('workflowId', 'name')
            .populate('initiatorUserId', 'name')
            .sort({ createdAt: -1 })

        res.status(200).json({ success: true, data: tasks })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const performAction = async (req, res) => {
    try {
        const { id } = req.params
        const { action, comment } = req.body
        const userId = req.user._id

        // Validate that user is allowed to act
        const request = await RequestInstance.findById(id)
        if (!request) return res.status(404).json({ success: false, msg: 'Request not found' })

        const isAssignee = request.currentAssignees.some(uid => uid.toString() === userId.toString())
        if (!isAssignee) {
            // Check if admin? Or strict?
            // "only current assignee can act"
            return res.status(403).json({ success: false, msg: 'You are not assigned to this task' })
        }

        const updatedRequest = await Engine.processAction(id, userId, action, comment)
        res.status(200).json({ success: true, data: updatedRequest })

    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}
