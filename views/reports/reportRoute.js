import express from 'express'
import {
    create,
    getAllReports,
    sendReport,
    deleteReport,
    updateReport,
} from '../../controllers/reportController/reportController.js'

export const reportRouter = express.Router()

reportRouter.post('/create', create)
reportRouter.get('/:userName', getAllReports)
reportRouter.post('/send/:reportId', sendReport)
reportRouter.post('/delete/', deleteReport)
reportRouter.post('/update', updateReport)
