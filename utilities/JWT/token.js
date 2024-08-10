import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
import { responseError } from '../responseError.js'
import { userModel } from '../../models/userModel/userModel.js'
config()

const JWT_SECRET = process.env.JWT_SECRET

export const createToken = (userId, expiresIn) => {
    const payload = {
        userId: userId,
    }

    const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: expiresIn,
    })

    return token
}

export const verifyToken = async (res, token) => {
    try {
        const decoded = await jwt.verify(token, JWT_SECRET)
        const userId = decoded.userId
        console.log('userId', userId)

        const user = await userModel.findById(userId)
        if (!user) {
            return responseError(res, 'User not found')
        }

        return user
    } catch (err) {
        return false
    }
}
