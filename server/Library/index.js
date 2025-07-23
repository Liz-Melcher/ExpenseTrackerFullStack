import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';

export const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        throw new Error("Error hashing password");
    }
}

export const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        console.error("Error comparing passwords:", error);
        throw new Error("Error comparing passwords");
    }
}

export const generateToken = (user) => {
    const token = JWT.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return token;
}