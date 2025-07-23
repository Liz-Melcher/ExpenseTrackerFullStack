import pool from '../Library/database.js';
import { hashPassword } from '../Library/index.js';

export const singupUser = async (req, res) => {
    try {
        const {firstName, lastName, email, password} = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const userExists = await pool.query('SELECT * FROM tbluser WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashed = await (hashpaassword(password));
        const newUser = await pool.query(
            'INSERT INTO tbluser (firstName, lastName, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
            [firstName, lastName, email, hashedPassword]
        );
        res.status(201).json({ message: "User created successfully", user: newUser.rows[0] });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};  
  // Logic for signing up a user


export const loginUser = async (req, res) => {
    try {}
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}