import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: { // Legacy field, kept for backward compatibility if needed, else prefer 'roles'
        type: String,
        required: false,  // loosened from true if we rely on roles[]
        default: 'employee'
    },
    team: {
        type: String,
        default: 'General'
    },
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    reportingManagerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdByAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

export default mongoose.model('User', userSchema)