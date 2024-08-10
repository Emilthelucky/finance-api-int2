import { verifyToken } from '../../utilities/JWT/token.js'
import lodash from 'lodash'
import { responseError } from '../../utilities/responseError.js'

const { merge } = lodash

export const checkUser = async (req, res, next) => {
    const authorization = req.headers['authorization']
    const accessToken = authorization?.split(' ')[1]

    if (!accessToken) {
        return next()
    }

    const verifiedUser = await verifyToken(res, accessToken)

    if (verifiedUser) {
        merge(req, {
            identity: {
                user: verifiedUser,
            },
        })
    }

    return next()
}

export const isAuthenticated = async (req, res) => {
    const authorization = req.headers['authorization']
    const accessToken = authorization?.split(' ')[1]

    if (!accessToken) {
        return responseError(res, 'Missing authenticated')
    }

    const verifiedUser = await verifyToken(res, token)

    if (verifiedUser) {
        return next()
    } else {
        return responseError(res, 'Authentication failed')
    }
}
