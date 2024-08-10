import { userModel } from '../../models/userModel/userModel.js'
import { Hash } from '../../security/passwordHash.js'
import { responseError } from '../../utilities/responseError.js'
import { responseSuccess } from '../../utilities/responseSuccess.js'
import { createToken, verifyToken } from '../../utilities/JWT/token.js'
import { Compare } from '../../security/passwordCompare.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body

        const checkUsername = await userModel.findOne({
            username,
        })

        if (checkUsername) {
            return responseError(res, 'Please provide a different username')
        }

        const checkEmail = await userModel.findOne({
            email,
        })

        if (checkEmail) {
            return responseError(res, 'Please provide a different email')
        }

        const user = await userModel.create({
            username,
            email,
            password,
        })

        if (user) {
            const hashedPassword = await Hash(password)

            user.password = hashedPassword
            await user.save()
            return responseSuccess(res, 'User created successfully')
        }
    } catch (error) {
        return responseError(res, error.message)
    }
}

export const login = async (req, res) => {
    const { username, password } = req.body

    const user = await userModel.findOne({
        username: username,
    })

    if (!user) {
        return responseError(res, "Username couldn't find")
    }

    const checkPassword = await Compare(password, user.password)
    console.log(checkPassword)
    if (checkPassword) {
        const token = createToken(user._id, '30m')
        console.log(token)

        user.refreshToken = token
        await user.save()

        const accessToken = createToken(user._id, '1m')

        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getMinutes() + 30)

        user.expiryDate = expiryDate
        await user.save()

        return responseSuccess(res, { user, accessToken: accessToken })
    } else {
        return responseError(res, 'Password is incorrect')
    }
}

export const regenerateAccessToken = async (req, res) => {
    const { refreshToken } = req.body

    if (!refreshToken) {
        return responseError(res, "User wasn't authenticated")
    }

    const verifiedUser = await verifyToken(res, refreshToken)
    if (!verifiedUser) {
        return responseError(res, 'RefreshToken expired')
    }

    const user = verifiedUser
    console.log(user)

    const payload = {
        userId: user._id,
    }
    console.log(payload)

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' })
    console.log('bug', accessToken)

    return responseSuccess(res, accessToken)
}

export const verifyTokenEndpoint = async (req, res) => {
    try {
        const { token } = req.body

        if (!token) {
            return responseError(res, 'Token is required')
        }

        const decoded = jwt.verify(token, JWT_SECRET)
        const userId = decoded.userId

        const user = await userModel.findById(userId)

        if (!user) {
            return responseError(res, 'User not found')
        }

        return responseSuccess(res, user)
    } catch (error) {
        return responseError(res, 'Token expired')
    }
}

export const updateUser = async (req, res) => {
    try {
        const { userId, currentPassword, username, email, newPassword } =
            req.body

        // Find the user to be updated
        const user = await userModel.findById(userId)
        if (!user) {
            return responseError(res, 'User not found')
        }

        // Check if the current password is correct
        console.log(1)
        if (currentPassword) {
            console.log(2)
            const isPasswordCorrect = await Compare(
                currentPassword,
                user.password
            )
            if (!isPasswordCorrect) {
                return responseError(res, 'Current password is incorrect')
            }
        } else {
            return responseError(
                res,
                'If you want save the changes, please provide your current password'
            )
        }

        // Update username if provided and valid
        if (username && username !== user.username) {
            const existingUsername = await userModel.findOne({ username })
            if (existingUsername) {
                return responseError(res, 'Username is already taken')
            }
            user.username = username
        }

        // Update email if provided and valid
        if (email && email !== user.email) {
            const existingEmail = await userModel.findOne({ email })
            if (existingEmail) {
                return responseError(res, 'Email is already taken')
            }
            user.email = email
        }

        // Update password if provided and hash it
        if (newPassword) {
            const hashedPassword = await Hash(newPassword)
            user.password = hashedPassword
        }

        // Save the updated user
        await user.save()

        return responseSuccess(res, 'User updated successfully')
    } catch (error) {
        console.error(error)
        return responseError(res, 'Server error')
    }
}
