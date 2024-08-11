import { accountModel } from '../../models/accountModel/accountModel.js'
import { reportModel } from '../../models/reportModel/reportModel.js'
import { transactionModel } from '../../models/transactionModel/transactionModel.js'
import { userModel } from '../../models/userModel/userModel.js'
import { responseError } from '../../utilities/responseError.js'
import { responseSuccess } from '../../utilities/responseSuccess.js'
import nodemailer from 'nodemailer'

export const create = async (req, res) => {
    try {
        const {
            reportType,
            reportTitle,
            details,
            transactionId,
            userName,
            email,
            sent,
        } = req.body

        if (!email) {
            return responseError(res, 'Please provide email to send reports!')
        }

        if (!userName) {
            return responseError(res, 'Username not found!')
        }

        const user = await userModel
            .findOne({
                username: userName,
            })
            .populate('reports')
        if (!user) {
            return responseError(res, 'User not found!')
        }

        if (!reportTitle) {
            return responseError(res, 'Please provide a title!')
        }

        if (!reportType) {
            return responseError(res, 'Please provide a type!')
        }

        const transaction = await transactionModel.findById(transactionId)
        if (!transaction) {
            return responseError(res, 'Transaction not found!')
        }

        let report = await reportModel.create({
            details,
            reportType,
            reportTitle,
            transaction: transaction._id,
            email,
            sent: sent || false,
        })

        report = await reportModel.findById(report._id)

        if (!report) {
            return responseError(res, "Report couldn't created")
        }

        const populatedReport = await reportModel
            .findById(report._id)
            .populate('transaction')

        user.reports.push(report._id)
        await user.save()

        return responseSuccess(res, populatedReport)
    } catch (error) {
        return responseError(res, error.message)
    }
}

export const getAllReports = async (req, res) => {
    try {
        const { userName } = req.params

        if (!userName) {
            return responseError(res, 'Username is required!')
        }

        const user = await userModel
            .findOne({
                username: userName,
            })
            .populate('reports')
        if (!user) {
            return responseError(res, 'User is required!')
        }

        const reports = await user.reports

        return responseSuccess(res, reports)
    } catch (error) {
        return responseError(res, error.message)
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

export const sendReport = async (req, res) => {
    try {
        const { reportId } = req.params

        if (!reportId) {
            return responseError(res, 'Report ID is required!')
        }

        const report = await reportModel
            .findById(reportId)
            .populate('transaction')

        if (!report) {
            return responseError(res, 'Report not found!')
        }

        if (report.sent) {
            return responseError(res, 'Report has already been sent!')
        }

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: report.email,
            subject: `Report: ${report.reportTitle}`,
            text: `Dear ${report.email},\n\nPlease find the report details below:\n\nReport Title: ${report.reportTitle}\nReport Type: ${report.reportType}\nDetails: ${report.details}\n\nBest Regards,\Finance Management Company`,
        }

        await transporter.sendMail(mailOptions)

        // Update the report as sent
        report.sent = true
        await report.save()

        return responseSuccess(res, 'Report sent successfully!')
    } catch (error) {
        return responseError(res, error.message)
    }
}

export const deleteReport = async (req, res) => {
    try {
        const { reports } = req.body

        if (!Array.isArray(reports) || reports.length === 0) {
            return responseError(res, 'No report IDs provided for deletion')
        }

        // Find the reports to be deleted
        const reportsToDelete = await reportModel.find({
            _id: { $in: reports },
        })

        // Check if any reports found
        if (reportsToDelete.length === 0) {
            return responseError(res, 'No reports found for deletion')
        }

        // Delete the reports
        const result = await reportModel.deleteMany({
            _id: { $in: reports },
        })

        return responseSuccess(res, {
            message: `${result.deletedCount} reports deleted`,
        })
    } catch (err) {
        console.error(err)
        return responseError(res, 'Server error')
    }
}

export const updateReport = async (req, res) => {
    const { operation, field, value, reports } = req.body

    // Input validation
    if (
        !operation ||
        !field ||
        !reports ||
        !Array.isArray(reports) ||
        reports.length === 0
    ) {
        return responseError(res, 'Invalid input data')
    }

    if (operation !== 'Update' && operation !== 'Delete') {
        return responseError(res, 'Invalid operation')
    }

    try {
        // Perform the specified operation (update or delete)
        const updatePromises = reports.map(async (id) => {
            const report = await reportModel.findById(id)
            if (!report) {
                return { id, error: 'Report not found' }
            }

            if (operation === 'Update') {
                // Check if the field to be updated is valid
                if (
                    ![
                        'reportType',
                        'reportTitle',
                        'details',
                        'transaction',
                        'email',
                        'sent',
                    ].includes(field)
                ) {
                    return { id, error: 'Invalid field' }
                }

                // Update the specified field
                report[field] = value

                // Automatically set sent to false if updating a field other than sent
                if (field !== 'sent') {
                    report.sent = false
                }

                await report.save()
                return { id, success: true }
            } else if (operation === 'Delete') {
                await report.remove()
                return { id, success: true }
            }
        })

        // Wait for all operations to complete and filter errors
        const results = await Promise.all(updatePromises)
        const errors = results.filter((result) => result.error)

        if (errors.length > 0) {
            return responseError(res, 'Some reports could not be processed', {
                results,
            })
        }

        responseSuccess(res, results)
    } catch (err) {
        console.error('Error updating reports:', err)
        return responseError(res, 'Server error')
    }
}
