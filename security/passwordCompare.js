import bcrypt from 'bcryptjs'

const Compare = async (password, userPassword) => {
    const checkPassword = await bcrypt.compare(password, userPassword)

    return checkPassword
}

export { Compare }
