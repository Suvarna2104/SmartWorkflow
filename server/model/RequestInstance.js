import mongoose from 'mongoose'

const approvalActionSchema = new mongoose.Schema({
    stepIndex: { type: Number, required: true },
    action: { type: String, enum: ['SUBMIT', 'APPROVE', 'REJECT', 'RETURN', 'ESCALATE', 'AUTO_SKIP'], required: true },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null if system action
    comment: { type: String },
    timestamp: { type: Date, default: Date.now }
})

const requestInstanceSchema = new mongoose.Schema({
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkflowDefinition', required: true },
    workflowVersion: { type: Number, required: true },
    initiatorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    formData: { type: Map, of: mongoose.Schema.Types.Mixed }, // Flexible form data
    attachments: [{
        filename: String,
        path: String,
        mimetype: String
    }],
    currentStepIndex: { type: Number, default: 0 },
    status: { type: String, enum: ['Draft', 'InProgress', 'Approved', 'Rejected', 'Returned'], default: 'InProgress' },
    currentAssignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who can act now
    kanbanStageKey: { type: String }, // For board UI
    history: [approvalActionSchema]
}, { timestamps: true })

export default mongoose.model('RequestInstance', requestInstanceSchema)
