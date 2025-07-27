import pool from "../Library/database.js";
import bcrypt from "bcrypt";

export const getUser = async (req, res) => {
  try {
    const { userId } = req.user;
    console.log("🔍 Fetching user with ID:", userId);

    const userExists = await pool.query(
      "SELECT * FROM tbluser WHERE id = $1",
      [userId]
    );

    if (!userExists.rows.length) {
      console.log("⚠️ User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    const user = userExists.rows[0];
    console.log("✅ User found:", user);
    res.status(200).json({ user });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    console.log("🔐 Change password request for user:", userId);

    const userExists = await pool.query(
      "SELECT * FROM tbluser WHERE id = $1",
      [userId]
    );

    if (!userExists.rows.length) {
      console.log("⚠️ User not found for password change:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    if (newPassword !== confirmPassword) {
      console.log("⚠️ Passwords do not match");
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const isMatch = await bcrypt.compare(
      oldPassword,
      userExists.rows[0].password
    );

    if (!isMatch) {
      console.log("⚠️ Old password is incorrect");
      return res
        .status(400)
        .json({ message: "Old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE tbluser SET password = $1 WHERE id = $2",
      [hashedPassword, userId]
    );

    console.log("✅ Password changed successfully for user:", userId);
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("❌ Error changing password:", error);
    res.status(500).json({ message: "Error changing password" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { email, password, firstName, lastName, contact, accounts, country, currency } = req.body;
    console.log("✏️ Updating user:", userId);

    const updatedUser = await pool.query(
      "UPDATE tbluser SET email = $1, password = $2, firstName = $3, lastName = $4, contact = $5, accounts = $6, country = $7, currency = $8 WHERE id = $9 RETURNING *",
      [email, password, firstName, lastName, contact, accounts, country, currency, userId]
    );

    if (!updatedUser.rows.length) {
      console.log("⚠️ User not found for update:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User updated:", updatedUser.rows[0]);
    res.status(200).json({ user: updatedUser.rows[0] });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
};

export default {
  getUser,
  changePassword,
  updateUser,
};