import User from '../../model/User.js'
import Role from '../../model/Role.js'
import WorkflowDefinition from '../../model/WorkflowDefinition.js'
import RequestInstance from '../../model/RequestInstance.js'
import ApprovalAction from '../../model/ApprovalAction.js'
import * as Engine from '../../services/WorkflowEngine.js'

export const createRole = async (req, res) => {
    try {
        const { name, permissions, description } = req.body
        const role = await Role.create({ name, permissions, description })
        res.status(201).json({ success: true, data: role })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const getRoles = async (req, res) => {
    try {
        const roles = await Role.find()
        res.status(200).json({ success: true, data: roles })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

// Get all unique roles. Syncs legacy user.role strings to Role collection if missing.
export const getUserRoles = async (req, res) => {
    try {
        // 1. Fetch all existing Roles
        const existingRoles = await Role.find()
        const rolesMap = new Map()
        existingRoles.forEach(r => rolesMap.set(r.name.toLowerCase(), r))

        // 2. Fetch Users to find legacy roles
        const users = await User.find().select('role roles')
        const newRolesToCreate = new Set()

        users.forEach(user => {
            // Check legacy role string
            if (user.role && typeof user.role === 'string') {
                const roleName = user.role.trim()
                if (roleName) {
                    const key = roleName.toLowerCase()
                    if (!rolesMap.has(key)) {
                        newRolesToCreate.add(roleName) // Add original case name
                        // Add placeholder to map to avoid duplicates in this loop? 
                        // No, we need to wait for creation. distinct set handles duplicates.
                    }
                }
            }
        })

        // 3. Create missing roles
        if (newRolesToCreate.size > 0) {
            for (const name of newRolesToCreate) {
                // Double check existence (race condition safety or map logic)
                if (!rolesMap.has(name.toLowerCase())) {
                    try {
                        const newRole = await Role.create({ name, description: 'Auto-migrated from user legacy role' })
                        rolesMap.set(name.toLowerCase(), newRole)
                    } catch (e) {
                        // Ignore duplicate key error in case of race
                        if (e.code !== 11000) console.error(`Failed to create role ${name}`, e)
                        else {
                            // If it failed because it exists now, try to fetch it? 
                            // Or just ignore, next fetch will get it.
                        }
                    }
                }
            }
        }

        // 4. Return all roles
        const allRoles = Array.from(rolesMap.values())
        res.status(200).json({ success: true, data: allRoles })

    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const createUser = async (req, res) => {
    try {
        // Admin creates user
        const { name, email, password, roleIds, reportingManagerId } = req.body

        const user = await User.create({
            name,
            email,
            password, // TODO: Hash this in real prod
            roles: roleIds,
            reportingManagerId,
            createdByAdminId: req.user._id,
            isActive: true
        })
        res.status(201).json({ success: true, data: user })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const createWorkflow = async (req, res) => {
    try {
        const { name, description, formSchema, steps } = req.body

        const exists = await WorkflowDefinition.findOne({ name })
        if (exists) {
            return res.status(400).json({ success: false, msg: 'Workflow name exists. Use new-version endpoint.' })
        }

        // Compatibility: Map 'name' to 'key' if missing (for legacy UI)
        const processedSchema = formSchema?.map(f => ({
            ...f,
            key: f.key || f.name
        })) || []

        const workflow = await WorkflowDefinition.create({
            name,
            description,
            version: 1,
            formSchema: processedSchema,
            steps,
            createdBy: req.user._id,
            updatedBy: req.user._id
        })
        res.status(201).json({ success: true, data: workflow })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const createNewVersion = async (req, res) => {
    try {
        const { id } = req.params

        const oldWf = await WorkflowDefinition.findById(id)
        if (!oldWf) return res.status(404).json({ success: false, msg: 'Workflow not found' })

        // Find max version for this name
        const latest = await WorkflowDefinition.findOne({ name: oldWf.name }).sort({ version: -1 })
        const newVersion = latest.version + 1

        const { description, formSchema, steps, isActive } = req.body

        // Compatibility: Map 'name' to 'key' if missing (for legacy UI)
        const processedSchema = formSchema?.map(f => ({
            ...f,
            key: f.key || f.name
        })) || oldWf.formSchema

        const newWf = await WorkflowDefinition.create({
            name: oldWf.name,
            description: description || oldWf.description,
            version: newVersion,
            isActive: isActive !== undefined ? isActive : true,
            formSchema: processedSchema,
            steps: steps || oldWf.steps,
            createdBy: req.user._id,
            updatedBy: req.user._id
        })

        res.status(201).json({ success: true, data: newWf })

    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const getWorkflowsAdmin = async (req, res) => {
    try {
        const workflows = await WorkflowDefinition.find().sort({ name: 1, version: -1 })
        res.status(200).json({ success: true, data: workflows })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const toggleWorkflowStatus = async (req, res) => {
    try {
        const { id } = req.params
        const workflow = await WorkflowDefinition.findById(id)
        if (!workflow) return res.status(404).json({ success: false, msg: 'Workflow not found' })

        workflow.isActive = !workflow.isActive
        await workflow.save()

        res.status(200).json({ success: true, data: workflow, msg: `Workflow ${workflow.isActive ? 'Activated' : 'Deactivated'}` })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const deleteWorkflow = async (req, res) => {
    try {
        const { id } = req.params
        // TODO: Check for active requests? 
        // For now, allow delete.
        const workflow = await WorkflowDefinition.findByIdAndDelete(id)
        if (!workflow) return res.status(404).json({ success: false, msg: 'Workflow not found' })

        res.status(200).json({ success: true, msg: 'Workflow deleted successfully' })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

export const assignRequest = async (req, res) => {
    try {
        const { id } = req.params
        const { assignToUserId, reRun } = req.body
        const adminId = req.user._id

        const request = await RequestInstance.findById(id)
        if (!request) return res.status(404).json({ success: false, msg: 'Request not found' })

        if (request.status !== 'PENDING_ASSIGNMENT') {
            return res.status(400).json({ success: false, msg: 'Request is not in PENDING_ASSIGNMENT status' })
        }

        if (assignToUserId) {
            // Force assign
            request.currentAssignees = [assignToUserId]
            request.status = 'IN_PROGRESS'

            // Log
            await ApprovalAction.create({
                requestId: request._id,
                stepIndex: request.currentStepIndex,
                action: 'ADMIN_FORCE_ASSIGN',
                byUserId: adminId,
                comment: `Admin assigned to user ${assignToUserId}`
            })

            request.history.push({
                stepIndex: request.currentStepIndex,
                action: 'ADMIN_FORCE_ASSIGN',
                byUserId: adminId,
                comment: `Admin assigned to user ${assignToUserId}`,
                timestamp: new Date()
            })

            await request.save()
            return res.status(200).json({ success: true, data: request })
        } else if (reRun) {
            // Re-run engine
            // We pass currentStepIndex - 1 so it tries to move TO currentStepIndex
            const result = await Engine.moveToNextAssignableStep(id, request.currentStepIndex - 1)

            // Check if it's still pending assignment
            if (result.status === 'PENDING_ASSIGNMENT') {
                return res.status(400).json({ success: false, msg: 'Auto-assignment failed again. No eligible assignees found.' })
            }
            return res.status(200).json({ success: true, data: result })
        } else {
            return res.status(400).json({ success: false, msg: 'Provide assignToUserId or reRun=true' })
        }

    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}
