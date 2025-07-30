import pool from '../Library/database.js';
import { hashPassword } from '../Library/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // Required for password comparison

// 🔐 Compare plain password with hashed password
const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// 🎫 Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id }, // Use any identifying field you'd like
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * POST /api/auth/signup
 * 📦 JSON Body Required:
 * {
 *   "firstName": "Lizzo",
 *   "lastName": "BatLady",
 *   "email": "lizzo@test.com",
 *   "password": "12345a",
 *   "contact": "000 000 0000",
 *   "accounts": ["bank", "credit card"]
 * }
 * 📌 Example Thunder Client Test:
 *   - Method: POST
 *   - URL: http://localhost:3000/api/auth/signup
 *   - Body: JSON (see above)
 *   - Auth: None required
 */
// 📝 SIGNUP
export const signupUser = async (req, res) => {
  try {
    console.log("Received signup request:", req.body);
    const { firstName, lastName, email, password, contact, accounts } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await pool.query('SELECT * FROM tbluser WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await hashPassword(password);
    const newUser = await pool.query(
      'INSERT INTO tbluser (firstName, lastName, email, password, contact, accounts) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [firstName, lastName, email, hashed, contact, accounts]
    );

    const token = generateToken(newUser.rows[0]);

    res.status(201).json({
      message: "User created successfully",
      token,
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/auth/login
 * 📦 JSON Body Required:
 * {
 *   "email": "lizzo@test.com",
 *   "password": "12345a"
 * }
 * 📌 Example Thunder Client Test:
 *   - Method: POST
 *   - URL: http://localhost:3000/api/auth/login
 *   - Body: JSON (see above)
 *   - Auth: None required
 */
// 🔐 LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await pool.query('SELECT * FROM tbluser WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await comparePassword(password, user.rows[0].password);
    if (!isMatch) {
      console.error("Invalid credentials");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.rows[0]);

    res.status(200).json({
      message: "Login successful",
      token,
      user: user.rows[0],
    });

    console.log("User logged in successfully:", user.rows[0].email, token);
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};