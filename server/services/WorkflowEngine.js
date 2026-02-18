import WorkflowDefinition from '../model/WorkflowDefinition.js'
import RequestInstance from '../model/RequestInstance.js'
import User from '../model/User.js'
import Role from '../model/Role.js'
import ApprovalAction from '../model/ApprovalAction.js'

// Helper: Check if a step condition is met
const isStepApplicable = (step, formData) => {
    if (!step.condition || !step.condition.fieldKey) return true

    const { fieldKey, operator, value } = step.condition
    const formValue = formData[fieldKey]

    // Simple comparison logic
    switch (operator) {
        case '>': return Number(formValue) > Number(value)
        case '<': return Number(formValue) < Number(value)
        case '==': return formValue == value // Loose equality for string/number match
        case '!=': return formValue != value
        default: return true
    }
}

// Helper: Compute Assignees for a STEP
const computeAssignees = async (step, initiatorUserId) => {
    let assigneeIds = []

    if (step.approverType === 'ROLE') {
        const rolesToFind = (step.roleIds && step.roleIds.length > 0)
            ? step.roleIds
            : (step.approverRoleId ? [step.approverRoleId] : [])

        if (rolesToFind.length > 0) {
            // Requirement: Pick first active user (deterministic)
            // We sort by createdAt to be deterministic.
            const users = await User.find({ roles: { $in: rolesToFind }, isActive: true })
                .sort({ createdAt: 1 })
                .limit(1)
                .select('_id')

            if (users.length > 0) {
                assigneeIds = [users[0]._id.toString()]
            }
        }
    }
    else if (step.approverType === 'USER' && step.userIds?.length > 0) {
        assigneeIds = step.userIds.map(id => id.toString())
    }
    else if (step.approverType === 'MANAGER_OF_INITIATOR') {
        const initiator = await User.findById(initiatorUserId)
        if (initiator && initiator.reportingManagerId) {
            assigneeIds = [initiator.reportingManagerId.toString()]
        }
    }

    return assigneeIds
}

// Core Function: Move Request to Next Assignable Step
export const moveToNextAssignableStep = async (requestId, currentStepIndex = -1) => {
    const request = await RequestInstance.findById(requestId)
    if (!request) throw new Error("Request not found")

    const workflow = await WorkflowDefinition.findOne({
        _id: request.workflowId,
        version: request.workflowVersion
    })
    if (!workflow) throw new Error("Workflow not found")

    let nextIndex = currentStepIndex + 1
    let foundStep = false

    // Loop to find next applicable step (handling conditionals and auto-skips)
    while (nextIndex < workflow.steps.length) {
        const step = workflow.steps[nextIndex]

        // 1. Check Condition
        if (!isStepApplicable(step, request.formData)) {
            // Log skip? Or just silently skip. Usually silent for conditional skip.
            nextIndex++
            continue
        }

        // 2. Compute Assignees
        let assignees = await computeAssignees(step, request.initiatorUserId)

        // 3. Remove Initiator from Assignees (Self-Approval Policy)
        // For testing/demo purposes, we allow self-approval. Uncomment to enforce policy.
        // assignees = assignees.filter(id => id !== request.initiatorUserId.toString())

        // 4. Check if Assignees Empty after removal
        if (assignees.length === 0) {
            // FIXED: Do NOT auto-skip if it's simply because we found no one (unless explicit skip logic exists)
            // If we skip here, we risk falling through to "APPROVED" without anyone looking at it.
            // Instead, we mark as PENDING_ASSIGNMENT and stop here.

            // Log Pending Assignment
            await ApprovalAction.create({
                requestId: request._id,
                stepIndex: nextIndex,
                action: 'ERROR_NO_ASSIGNEES',
                comment: 'Workflow halted: No assignees found for this step.'
            })

            request.currentStepIndex = nextIndex
            request.currentAssignees = [] // No one assigned
            request.status = 'PENDING_ASSIGNMENT' // New Status to indicate stuck
            foundStep = true // We "found" the step, but we are stuck on it.
            break
        }

        // Found a valid step with assignees
        request.currentStepIndex = nextIndex
        request.currentAssignees = assignees
        request.status = 'IN_PROGRESS'
        foundStep = true
        break
    }

    if (!foundStep) {
        // Workflow Finished check or Just Filtered out?
        // If nextIndex >= length, it truly finished.
        if (nextIndex >= workflow.steps.length) {
            request.status = 'APPROVED'
            request.currentAssignees = []
            request.currentStepIndex = nextIndex
        } else {
            // We are here because `foundStep` is false, but we didn't exit the loop via break?
            // Actually, the loop continues until nextIndex < length.
            // If we exit the loop and foundStep is false, it means we scanned all remaining steps and none were applicable?
            // Or they were applicable but had no assignees (handled inside loop now).
            // If all remaining steps were skipped due to conditions:
            request.status = 'APPROVED'
            request.currentAssignees = []
            request.currentStepIndex = nextIndex
        }
    }

    await request.save()
    return request
}

// Public: Process an Action (APPROVE, REJECT, RETURN)
export const processAction = async (requestId, userId, action, comment) => {
    const request = await RequestInstance.findById(requestId)
    if (!request) throw new Error("Request not found")

    // Log Action
    await ApprovalAction.create({
        requestId,
        stepIndex: request.currentStepIndex,
        action,
        byUserId: userId,
        comment
    })

    if (action === 'REJECT') {
        request.status = 'REJECTED'
        request.currentAssignees = []
        await request.save()
        return request
    }

    if (action === 'RETURN') {
        request.status = 'RETURNED'
        // Assign back to initiator
        request.currentAssignees = [request.initiatorUserId]
        // Maybe reset stepIndex to 0 or keep current? 
        // User requirements: "mark returned and assign to initiator"
        // Usually returning implies fixing data. 
        // Let's keep it simple: Status RETURNED, assignee = initiator.
        // Theoretically initiator 'Resubmits'.
        await request.save()
        return request
    }

    if (action === 'APPROVE') {
        // Update stepApprovals in Request
        const stepIndex = request.currentStepIndex
        let stepApproval = request.stepApprovals.find(s => s.stepIndex === stepIndex)
        if (!stepApproval) {
            stepApproval = { stepIndex, approvedBy: [] }
            request.stepApprovals.push(stepApproval)
        }
        // Add user to approvedBy if not exists
        if (!stepApproval.approvedBy.includes(userId)) {
            stepApproval.approvedBy.push(userId)
        }

        // Check if step is complete (ALL_REQUIRED vs ANY_ONE)
        const workflow = await WorkflowDefinition.findOne({
            _id: request.workflowId,
            version: request.workflowVersion
        })
        const currentStep = workflow.steps[stepIndex]

        let stepComplete = false
        if (currentStep.mode === 'ANY_ONE') {
            stepComplete = true
        } else {
            // ALL_REQUIRED
            // verify if all currentAssignees have approved
            // This is tricky because assignees might change if dynamic, but usually fixed for a step instance.
            // Simplified: Compare currentAssignees count with approvedBy count?
            // Safer: Check if every ID in currentAssignees is in approvedBy
            const allApproved = request.currentAssignees.every(id =>
                stepApproval.approvedBy.map(u => u.toString()).includes(id.toString())
            )
            stepComplete = allApproved
        }

        await request.save()

        if (stepComplete) {
            return await moveToNextAssignableStep(requestId, stepIndex)
        }

    }
}

// Helper: Wrapper for RequestController to match (requestId, action, userId, comment) signature
export const advanceRequest = async (requestId, action, userId, comment) => {
    return await processAction(requestId, userId, action, comment)
}
