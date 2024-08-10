import mongoose from 'mongoose'

const userSchema = mongoose.Schema({
    username: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
    transactions: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'transaction' },
    ],
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'account' }],
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'report' }],
    expiryDate: { type: Date },
})

export const userModel = mongoose.model('user', userSchema)
