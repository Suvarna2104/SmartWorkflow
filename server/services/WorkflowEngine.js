import WorkflowDefinition from '../model/WorkflowDefinition.js'
import RequestInstance from '../model/RequestInstance.js'
import User from '../model/User.js'
import Role from '../model/Role.js'

export const advanceRequest = async (requestId, action, userId, comment) => {
    try {
        const request = await RequestInstance.findById(requestId).populate('workflowId')
        if (!request) throw new Error("Request not found")

        const workflow = await WorkflowDefinition.findOne({
            _id: request.workflowId._id,
            version: request.workflowVersion
        })

        if (!workflow) throw new Error("Workflow definition not found")

        const currentStep = workflow.steps[request.currentStepIndex]
        if (!currentStep) throw new Error("Invalid step state")

        // 1. Log Action
        request.history.push({
            stepIndex: request.currentStepIndex,
            action: action,
            byUserId: userId,
            comment: comment
        })

        if (action === 'REJECT') {
            request.status = 'Rejected'
            request.currentAssignees = []
            await request.save()
            return request
        }

        if (action === 'RETURN') {
            request.status = 'Returned'
            // Logic to return to previous step or initiator could go here
            // For now, just mark returned. Maybe assign back to initiator to re-submit?
            request.currentAssignees = [request.initiatorUserId]
            request.currentStepIndex = -1 // Indication of being back to start or specific state
            await request.save()
            return request
        }

        if (action === 'APPROVE') {
            // Check if step is fully complete (handle ALL_REQUIRED vs ANY_ONE)
            // For MVP ANY_ONE is assumed sufficient if this function is called on approval.
            // If ALL_REQUIRED, we need to check if all assignees have approved.

            // Logic for moving to next step
            const nextIndex = request.currentStepIndex + 1
            if (nextIndex >= workflow.steps.length) {
                // End of workflow
                request.status = 'Approved'
                request.currentStepIndex = nextIndex
                request.currentAssignees = []
            } else {
                // Setup next step
                request.currentStepIndex = nextIndex
                const nextStep = workflow.steps[nextIndex]
                request.kanbanStageKey = nextStep.stageName

                // Compute Assignees for next step
                let assignees = []
                if (nextStep.approverType === 'ROLE') {
                    // Find users with this role
                    const users = await User.find({ roles: nextStep.approverRoleId, isActive: true }) // Assuming User has isActive, if not ignore or add
                    // Fallback if schema doesn't match exactly yet, assume User.find({ roles: ... }) works if roles is array of IDs
                    assignees = users.map(u => u._id)
                } else if (nextStep.approverType === 'USER') {
                    assignees = [nextStep.approverUserId]
                } else if (nextStep.approverType === 'MANAGER') {
                    // Logic to find manager of initiator
                    const initiator = await User.findById(request.initiatorUserId)
                    // Implementation depends on if we have managerId on User. 
                    // For now, if no manager logic, maybe fallback to admin or skip?
                    // Placeholder:
                    assignees = []
                }

                // Policy A: Skip self-approval
                assignees = assignees.filter(id => id.toString() !== request.initiatorUserId.toString())

                if (assignees.length === 0) {
                    // Auto-skip or assign to Admin fallback?
                    // For now, let's log and maybe auto-approve if no assignees? 
                    // Or better: throw error or assign to a default Admin fallback.
                    // Making a recursive call to advanceRequest could handle "Auto-Skip"
                    // RETURN FOR NOW: Empty assignees -> stuck state or auto-approve.

                    // Simple logic: if no assignees, auto-approve this step too?
                    // request.history.push({ stepIndex: nextIndex, action: 'AUTO_SKIP', comment: 'No valid assignees (Self-Skip)' })
                    // return advanceRequest(request._id, 'APPROVE', null, 'System Auto-Skip')
                }

                request.currentAssignees = assignees
            }

            await request.save()
            return request
        }

    } catch (error) {
        throw error
    }
}
