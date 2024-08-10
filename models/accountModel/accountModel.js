import mongoose from 'mongoose'

const AccountSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    balance: {
        type: Number,
    },
    initialBalance: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
    },
    description: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    transactions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'transaction',
        },
    ],
})

export const accountModel = mongoose.model('account', AccountSchema)
