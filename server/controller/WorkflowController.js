import WorkflowDefinition from "../model/WorkflowDefinition.js"

export const createWorkflow = async (req, res) => {
    try {
        const { name, description, formSchema, steps } = req.body
        const newWorkflow = new WorkflowDefinition({
            name,
            description,
            formSchema,
            steps,
            createdBy: req.user._id,
            updatedBy: req.user._id
        })
        const savedWorkflow = await newWorkflow.save()
        res.status(201).json(savedWorkflow)
    } catch (error) {
        res.status(500).json({ msg: "Failed to create workflow", error: error.message })
    }
}

export const getWorkflows = async (req, res) => {
    try {
        // Fetch only active workflows, simple list
        const workflows = await WorkflowDefinition.find({ isActive: true }).sort({ createdAt: -1 })
        res.json(workflows)
    } catch (error) {
        res.status(500).json({ msg: "Failed to fetch workflows", error: error.message })
    }
}

export const getWorkflowById = async (req, res) => {
    try {
        const workflow = await WorkflowDefinition.findById(req.params.id)
        if (!workflow) {
            return res.status(404).json({ msg: "Workflow not found" })
        }
        res.json(workflow)
    } catch (error) {
        res.status(500).json({ msg: "Error fetching workflow", error: error.message })
    }
}

export const updateWorkflow = async (req, res) => {
    try {
        const { id } = req.params
        const formData = req.body

        // Versioning: Deactivate old, create new
        const oldWorkflow = await WorkflowDefinition.findById(id)
        if (!oldWorkflow) {
            return res.status(404).json({ msg: "Workflow not found" })
        }

        oldWorkflow.isActive = false
        await oldWorkflow.save()

        const newWorkflow = new WorkflowDefinition({
            ...formData,
            version: oldWorkflow.version + 1,
            isActive: true,
            createdBy: oldWorkflow.createdBy, // Preserve original creator? Or change?
            updatedBy: req.user._id
        })

        await newWorkflow.save()
        res.json(newWorkflow)

    } catch (error) {
        res.status(500).json({ msg: "Failed to update workflow", error: error.message })
    }
}
