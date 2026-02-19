import mongoose from 'mongoose'

const stepSchema = new mongoose.Schema({
    stepOrder: { type: Number, required: true },
    stageName: { type: String, required: true },
    approverType: {
        type: String,
        enum: ['ROLE', 'USER', 'MANAGER_OF_INITIATOR'],
        required: true
    },
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    mode: {
        type: String,
        enum: ['ANY_ONE', 'ALL_REQUIRED'],
        default: 'ANY_ONE'
    },
    slaHours: { type: Number, default: 24 },
    condition: {
        fieldKey: String,
        operator: { type: String, enum: ['>', '<', '==', '!='] },
        value: mongoose.Schema.Types.Mixed
    }
})

// Validation: meaningful approver configuration
stepSchema.path('roleIds').validate(function (value) {
    if (this.approverType === 'ROLE') {
        return value && value.length > 0
    }
    return true
}, 'At least one Role must be selected for ROLE approver type.')

stepSchema.path('userIds').validate(function (value) {
    if (this.approverType === 'USER') {
        return value && value.length > 0
    }
    return true
}, 'At least one User must be selected for USER approver type.')

const workflowSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    formSchema: [{
        key: { type: String, required: true },
        label: { type: String, required: true },
        type: {
            type: String,
            enum: ['text', 'number', 'date', 'select', 'file', 'textarea'],
            required: true
        },
        required: { type: Boolean, default: false },
        options: [String] // For 'select' type
    }],
    steps: [stepSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

workflowSchema.index({ name: 1, version: 1 }, { unique: true })

export default mongoose.model('WorkflowDefinition', workflowSchema)
