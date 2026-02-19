import mongoose from 'mongoose'

const approvalActionSchema = new mongoose.Schema({
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RequestInstance',
        required: true
    },
    stepIndex: {
        type: Number,
        required: true
    },
    action: {
        type: String,
        enum: ['SUBMIT', 'APPROVE', 'REJECT', 'RETURN', 'AUTO_SKIP_SELF', 'ERROR_NO_ASSIGNEES'],
        required: true
    },
    byUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }, // Optional for auto actions
    comment: {
        type: String
    }
}, { timestamps: true })

export default mongoose.model('ApprovalAction', approvalActionSchema)
