const responseSuccess = (res, data) => {
    return res.status(200).json({
        data: data,
    })
}

export { responseSuccess }
