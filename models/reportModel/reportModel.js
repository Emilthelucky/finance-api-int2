import mongoose from 'mongoose'

const reportSchema = mongoose.Schema({
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'transaction',
    },
    details: {
        type: String,
        required: true,
    },
    reportType: {
        type: String,
        required: true,
    },
    reportTitle: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    email: {
        type: String,
    },
    sent: {
        type: Boolean,
    },
})

export const reportModel = mongoose.model('report', reportSchema)
