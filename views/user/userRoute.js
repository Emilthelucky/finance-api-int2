import express from 'express'
import {
    register,
    login,
    regenerateAccessToken,
    verifyTokenEndpoint,
    updateUser,
} from '../../controllers/userController/userController.js'

export const userRouter = express.Router()

userRouter.post('/register', register)
userRouter.post('/login', login)
userRouter.post('/regenerateToken', regenerateAccessToken)
userRouter.post('/verifyToken', verifyTokenEndpoint)
userRouter.put('/update', updateUser)
