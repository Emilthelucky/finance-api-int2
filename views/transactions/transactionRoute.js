import express from 'express'
import {
    create,
    deleteTransaction,
    getTransactions,
    updateTransaction,
} from '../../controllers/transactionController/transactionController.js'

export const transactionRouter = express.Router()

transactionRouter.post('/create', create)
transactionRouter.get('/:userName', getTransactions)
transactionRouter.post('/update', updateTransaction)
transactionRouter.post('/delete', deleteTransaction)
