import User from '../../model/User.js'
import Role from '../../model/Role.js'
import WorkflowDefinition from '../../model/WorkflowDefinition.js'

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
