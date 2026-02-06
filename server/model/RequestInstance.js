import mongoose from 'mongoose'

const requestInstanceSchema = new mongoose.Schema({
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkflowDefinition', required: true },
    workflowVersion: { type: Number, required: true },
    initiatorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    formData: { type: mongoose.Schema.Types.Mixed }, // Object with key-value pairs
    status: {
        type: String,
        enum: ['DRAFT', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'RETURNED'],
        default: 'IN_PROGRESS'
    },
    currentStepIndex: { type: Number, default: 0 },
    currentAssignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    stepApprovals: [{
        stepIndex: Number,
        approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }]
}, { timestamps: true })

export default mongoose.model('RequestInstance', requestInstanceSchema)
