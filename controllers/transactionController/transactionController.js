import { responseError } from '../../utilities/responseError.js'
import { responseSuccess } from '../../utilities/responseSuccess.js'
import { userModel } from '../../models/userModel/userModel.js'
import { transactionModel } from '../../models/transactionModel/transactionModel.js'
import { accountModel } from '../../models/accountModel/accountModel.js'

export const create = async (req, res) => {
    try {
        const { userName, accountName, amount, transactionType, description } =
            req.body

        // Check if required fields are missing
        if (!userName) return responseError(res, 'Username Not Found!')
        if (!amount) return responseError(res, 'Please provide an amount!')
        if (!transactionType)
            return responseError(res, 'Please provide a transaction type!')
        if (!accountName)
            return responseError(res, 'Account Name Not Provided!')

        // Find the user by username and populate accounts
        const user = await userModel
            .findOne({ username: userName })
            .populate('accounts')
        if (!user) return responseError(res, 'User Not Found!')

        // Find the account by accountName and user ID
        const account = await accountModel.findOne({
            name: accountName,
            user: user._id,
        })
        if (!account)
            return responseError(res, 'Account Not Found in User Accounts!')

        // Check for sufficient funds in case of Withdrawal, Transfer, or Payment
        if (
            ['Withdrawal', 'Transfer', 'Payment'].includes(transactionType) &&
            account.balance < amount
        ) {
            return responseError(res, 'Insufficient funds!')
        }

        // Update the account balance based on the transaction type
        if (['Withdrawal', 'Transfer', 'Payment'].includes(transactionType)) {
            account.balance -= amount
        } else if (['Deposit', 'Refund'].includes(transactionType)) {
            account.balance += amount
        } else {
            return responseError(res, 'Invalid transaction type!')
        }

        // Save the updated account balance
        await account.save()

        // Generate a random transaction number
        const random = Math.floor(Math.random() * 901) + 100 // Random number between 100 and 1000

        // Create a new transaction
        const newTransaction = await transactionModel.create({
            amount: amount,
            transactionType: transactionType,
            description: description,
            transactionNumber: random,
            account: account._id,
        })

        // Add the new transaction to both user and account's transactions array
        user.transactions.push(newTransaction._id)
        account.transactions.push(newTransaction._id)

        // Save the updated user and account with the new transaction
        await user.save()
        await account.save()

        // Respond with the newly created transaction
        return responseSuccess(res, newTransaction)
    } catch (error) {
        console.error('Error creating transaction:', error)
        return responseError(res, error.message)
    }
}

export const getTransactions = async (req, res) => {
    try {
        const { userName } = req.params

        if (!userName) {
            return responseError(res, 'Username Not Found!')
        }

        // Find the user by username
        const user = await userModel
            .findOne({
                username: userName,
            })
            .populate({
                path: 'transactions',
                populate: {
                    path: 'account',
                },
            })

        if (!user) {
            return responseError(res, 'User Not Found!')
        }

        // Retrieve the user's transactions
        const transactions = user.transactions
        console.log(transactions)

        // If no transactions found
        if (!transactions || transactions.length === 0) {
            return responseError(res, 'No transactions found for this user.')
        }

        // Respond with the transactions
        return responseSuccess(res, transactions)
    } catch (error) {
        return responseError(res, error.message)
    }
}

export const updateTransaction = async (req, res) => {
    const { operation, field, value, transactions } = req.body

    // Validate input
    if (!operation || !field || !transactions || !value) {
        return responseError(res, 'Invalid input data')
    }

    if (operation !== 'Update' && operation !== 'Delete') {
        return responseError(res, 'Invalid operation')
    }

    try {
        // Perform update or delete operation based on the request
        const updatePromises = transactions.map(async (id) => {
            const transaction = await transactionModel.findById(id)
            if (!transaction) {
                return { id, error: 'Transaction not found' }
            }

            if (operation === 'Update') {
                // Ensure the field to update is valid
                if (
                    !['amount', 'transactionType', 'description'].includes(
                        field
                    )
                ) {
                    return { id, error: 'Invalid field' }
                }

                // Update the specified field
                transaction[field] = value
                await transaction.save()
                return { id, success: true }
            } else if (operation === 'Delete') {
                await transaction.remove()
                return { id, success: true }
            }
        })

        // Await all promises and filter out errors
        const results = await Promise.all(updatePromises)
        const errors = results.filter((result) => result.error)

        if (errors.length > 0) {
            return responseError(
                res,
                'Some transactions could not be processed',
                { results }
            )
        }

        responseSuccess(res, results)
    } catch (err) {
        console.error('Error updating transactions:', err)
        return responseError(res, 'Server error')
    }
}

export const deleteTransaction = async (req, res) => {
    try {
        const { transactions } = req.body
        console.log(transactions) // Expecting an array of transaction IDs in the request body

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return responseError(
                res,
                'No transaction IDs provided for deletion'
            )
        }

        // Find the transactions to be deleted
        const transactionsToDelete = await transactionModel.find({
            _id: { $in: transactions },
        })

        // Check if any transactions found
        if (transactionsToDelete.length === 0) {
            return responseError(res, 'No transactions found for deletion')
        }

        // Iterate over each transaction and update the account balance accordingly
        for (let transaction of transactionsToDelete) {
            const account = await accountModel.findById(transaction.account)

            if (!account) {
                return responseError(
                    res,
                    `Account not found for transaction ID: ${transaction._id}`
                )
            }

            if (
                transaction.transactionType === 'Withdrawal' ||
                transaction.transactionType === 'Transfer' ||
                transaction.transactionType === 'Payment'
            ) {
                account.balance += transaction.amount
            } else if (
                transaction.transactionType === 'Deposit' ||
                transaction.transactionType === 'Refund'
            ) {
                account.balance -= transaction.amount
            } else {
                return responseError(
                    res,
                    `Invalid transaction type for transaction ID: ${transaction._id}`
                )
            }

            // Save the updated account balance
            await account.save()
        }

        // Delete the transactions
        const result = await transactionModel.deleteMany({
            _id: { $in: transactions },
        })

        return responseSuccess(res, {
            message: `${result.deletedCount} transactions deleted`,
        })
    } catch (err) {
        console.error(err)
        return responseError(res, 'Server error')
    }
}
