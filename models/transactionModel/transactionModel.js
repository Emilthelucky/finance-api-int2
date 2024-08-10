import mongoose from 'mongoose'

const transactionSchema = mongoose.Schema({
    transactionNumber: {
        type: String,
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
    },
    amount: {
        type: Number,
        required: true,
    },
    transactionType: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String,
    },
})

export const transactionModel = mongoose.model('transaction', transactionSchema)
