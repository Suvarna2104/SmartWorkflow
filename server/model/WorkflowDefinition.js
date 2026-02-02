import mongoose from 'mongoose'

const stepSchema = new mongoose.Schema({
    stepOrder: { type: Number, required: true },
    stageName: { type: String, required: true },
    approverType: { type: String, enum: ['ROLE', 'USER', 'MANAGER'], default: 'ROLE' }, // MANAGER for dynamic reporting manager
    approverRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    approverUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If specific user
    mode: { type: String, enum: ['ANY_ONE', 'ALL_REQUIRED'], default: 'ANY_ONE' },
    slaHours: { type: Number, default: 24 },
    condition: { type: String } // Optional: simple logic string or JSON logic
})

const workflowSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
    formSchema: { type: Array, default: [] }, // Array of field objects { name, label, type, required, options }
    steps: [stepSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

export default mongoose.model('WorkflowDefinition', workflowSchema)
