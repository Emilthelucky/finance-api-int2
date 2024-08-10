import bcrypt from 'bcryptjs'

const Hash = async (password) => {
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    return hashedPassword
}

export { Hash }
