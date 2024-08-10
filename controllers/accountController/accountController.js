import { accountModel } from '../../models/accountModel/accountModel.js'
import { userModel } from '../../models/userModel/userModel.js'
import { responseError } from '../../utilities/responseError.js'
import { responseSuccess } from '../../utilities/responseSuccess.js'
import { transactionModel } from '../../models/transactionModel/transactionModel.js'

const createAccount = async (req, res) => {
    const { name, balance, type, description, userName } = req.body

    try {
        console.log(userName)
        if (!userName) {
            return responseError(res, 'User Not Found!')
        }

        if (!name) {
            return responseError(res, 'Account Name Required!')
        }

        if (!balance) {
            return responseError(res, 'Balance Required!')
        }

        if (!type) {
            return responseError(res, 'Type Required!')
        }

        const acc = await accountModel.findOne({
            name: name,
        })
        if (acc) {
            return responseError(res, 'This Account Name is Exists!')
        }

        const newAccount = await accountModel.create({
            name,
            balance,
            type,
            description,
        })
        await newAccount.save()

        const user = await userModel
            .findOne({
                username: userName,
            })
            .populate('accounts')
        if (!user) {
            return responseError(res, 'User Not Found!')
        }

        newAccount.user = user._id
        await newAccount.save()

        user.accounts.push(newAccount._id)
        await user.save()

        responseSuccess(res, newAccount)
    } catch (err) {
        responseError(res, err.message)
    }
}

const getAccounts = async (req, res) => {
    try {
        const { userName } = req.params

        if (!userName) {
            return responseError(res, 'User name is required')
        }

        const user = await userModel.findOne({ username: userName }).populate({
            path: 'accounts',
            populate: {
                path: 'user',
            },
        })

        if (!user) {
            return responseError(res, 'User not found')
        }

        // Get the user's accounts
        const accounts = user.accounts

        responseSuccess(res, accounts)
    } catch (err) {
        console.error('Error fetching accounts:', err)
        responseError(res, 'Server error')
    }
}

const getAccountById = async (req, res) => {
    try {
        const account = await accountModel.findById(req.params.id)
        if (!account) {
            return responseError(res, 'Account not found')
        }
        responseSuccess(res, account)
    } catch (err) {
        responseError(res, 'Server error')
    }
}

const updateAccount = async (req, res) => {
    const { operation, field, value, accounts } = req.body
    console.log(operation)

    // Doğrulama
    if (!operation || !field || !accounts || !value) {
        return res.status(400).json({ error: 'Invalid input data' })
    }

    if (operation !== 'Update' && operation !== 'Delete') {
        return res.status(400).json({ error: 'Invalid operation' })
    }

    try {
        // Operasyon türüne göre güncelleme işlemini belirle
        const updatePromises = accounts.map(async (id) => {
            const account = await accountModel.findById(id)
            if (!account) {
                return { id, error: 'Account not found' }
            }

            if (operation === 'Update') {
                if (!field) {
                    return { id, error: 'Field to update is required' }
                }

                // Güncelleme işlemi
                if (field === 'name') account.name = value
                if (field === 'balance') account.balance = value
                if (field === 'type') account.type = value
                // Diğer alanlar için ek kontrol ekleyebilirsiniz

                await account.save()
                return { id, success: true }
            } else if (operation === 'Delete') {
                await account.remove()
                return { id, success: true }
            }
        })

        const results = await Promise.all(updatePromises)
        const errors = results.filter((result) => result.error)

        if (errors.length > 0) {
            return res.status(400).json({ success: false, results })
        }

        res.status(200).json({ success: true, results })
    } catch (err) {
        console.error('Error updating accounts:', err)
        res.status(500).json({ error: 'Server error' })
    }
}

const deleteAccount = async (req, res) => {
    try {
        const { accounts } = req.body
        console.log(accounts) // Expecting an array of IDs in the request body

        if (!Array.isArray(accounts) || accounts.length === 0) {
            return responseError(res, 'No IDs provided for deletion')
        }

        // Fetch accounts with their associated transactions
        const accountsToDelete = await accountModel
            .find({ _id: { $in: accounts } })
            .populate('transactions')

        if (accountsToDelete.length === 0) {
            return responseError(res, 'No accounts found for deletion')
        }

        // Collect all transaction IDs for deletion
        const transactionIds = accountsToDelete.reduce((acc, account) => {
            return acc.concat(
                account.transactions.map((transaction) => transaction._id)
            )
        }, [])

        // Delete all related transactions
        await transactionModel.deleteMany({ _id: { $in: transactionIds } })

        // Delete the accounts
        const result = await accountModel.deleteMany({ _id: { $in: accounts } })

        responseSuccess(res, {
            message: `${result.deletedCount} accounts and their related transactions deleted`,
        })
    } catch (err) {
        console.error(err)
        responseError(res, 'Server error')
    }
}

export {
    createAccount,
    getAccounts,
    getAccountById,
    updateAccount,
    deleteAccount,
}
