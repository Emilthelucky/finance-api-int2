const responseError = (res, errorMessage) => {
    return res.status(400).json({
        message: errorMessage,
        error: true,
    })
}

export { responseError }
