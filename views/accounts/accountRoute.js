import express from 'express'
import {
    createAccount,
    getAccounts,
    getAccountById,
    updateAccount,
    deleteAccount,
} from '../../controllers/accountController/accountController.js'

export const accountRouter = express.Router()

// Create a new account
accountRouter.post('/create', createAccount)

// Get all accounts
accountRouter.get('/:userName', getAccounts)

// Get a single account by ID
accountRouter.get('/:id', getAccountById)

// Update an account by ID
accountRouter.put('/update', updateAccount)

// Delete an account by ID
accountRouter.post('/delete', deleteAccount)
