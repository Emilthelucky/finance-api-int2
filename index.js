import express from 'express'
import { config } from 'dotenv'
import { ConnectDB } from './configurations/dbConnection.js'
import { userRouter } from './views/user/userRoute.js'
import { checkUser } from './middlewares/Auth/index.js'
import { accountRouter } from './views/accounts/accountRoute.js'
import { transactionRouter } from './views/transactions/transactionRoute.js'
import cors from 'cors'
import { reportRouter } from './views/reports/reportRoute.js'
config()

ConnectDB()

const app = express()

const PORT = process.env.PORT

app.use(express.json())
app.use(cors())
app.use(checkUser)

app.use('/user', userRouter)
app.use('/account', accountRouter)
app.use('/transaction', transactionRouter)
app.use('/report', reportRouter)

app.get('/', (req, res) => {
    console.log(req?.identity?.user)
    res.send('hi')
})

app.listen(PORT, () => {
    console.log('App is running on ' + PORT)
})
