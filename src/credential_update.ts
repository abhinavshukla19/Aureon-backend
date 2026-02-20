import express from "express"
import type{ Request , Response } from "express"
import database from "./db.js"
import bcrypt from "bcrypt"
import authmiddeware from "./auth_middleware.js"


const update=express.Router()


// change-password

update.post("/change-password", authmiddeware, async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body; 
    const user_id = req.authentication?.user_id;

    
    if (!user_id) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required. Please sign in."
      });
    }

    if (!newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "New password is required"
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Hash the new password
    const hashpassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await database.query(
      "UPDATE user_login SET password = $1 WHERE user_id = $2",
      [hashpassword, user_id]
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error: any) {
    console.error("Change password error:", error);
     
    return res.status(500).json({
      success: false,
      message: "An error occurred while changing password. Please try again."
    });
  }
});




// change-email

update.post("/change-email", authmiddeware, async (req: Request, res: Response) => {
  try {
    const { newEmail } = req.body; 
    const user_id = req.authentication?.user_id;

    if (!user_id) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required. Please sign in."
      });
    }

    if (!newEmail) {
      return res.status(400).json({ 
        success: false,
        message: "New email is required"
      });
    }

    // using regex fror checking correct email format 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    // lowercase email
    const normalizedEmail = newEmail.toLowerCase().trim();

    // Get current user email
    const { rows: userRows } = await database.query(
      "SELECT email FROM user_login WHERE user_id = $1",
      [user_id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const currentEmail = userRows[0].email;

    // Check if new email is different from current email
    if (currentEmail.toLowerCase() === normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "New email must be different from current email"
      });
    }

    // Check if email already exists
    const { rows: existingRows } = await database.query(
      "SELECT user_id FROM user_login WHERE email = $1 AND user_id != $2",
      [normalizedEmail, user_id]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This email is already in use. Please use a different email address."
      });
    }

    // Update email in database
    await database.query(
      "UPDATE user_login SET email = $1 WHERE user_id = $2",
      [normalizedEmail, user_id]
    );

    return res.status(200).json({
      success: true,
      message: "Email changed successfully"
    });

  } catch (error: any) {
    console.error("Change email error:", error);
    
    if (error?.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({
        success: false,
        message: "This email is already in use. Please use a different email address."
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "An error occurred while changing email. Please try again."
    });
  }
});




export default update;