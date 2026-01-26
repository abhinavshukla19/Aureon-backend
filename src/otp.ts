import express from "express"
import type{Request , Response} from "express"
import { database } from "./db.js";
import  jwt  from "jsonwebtoken";
const otp=express.Router();


otp.post("/otpverify", async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    });
  }

  try {
    const [rows]: any = await database.query(
      "SELECT user_id, otp, otp_expiry, otp_attempts, isverified FROM user_login WHERE email = ?",
      [email]
    );

    //  check if no user found
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const user = rows[0];

    // Check if already verified
    if (user.isverified) {
      return res.status(400).json({
        success: false,
        message: "Account already verified"
      });
    }

    // Check if OTP exists
    if (!user.otp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or already used"
      });
    }

    // Check OTP expiration
    if (new Date() > new Date(user.otp_expiry)) {
      await database.query(
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL WHERE email = ?",
        [email]
      );
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    // Check attempt limit (max 5 attempts)
    if (user.otp_attempts >= 5) {
      await database.query(
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL WHERE email = ?",
        [email]
      );
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP."
      });
    }

    // Verify OTP 
    if (String(otp) !== String(user.otp)) {
      // Increment attempt counter
      await database.query(
        "UPDATE user_login SET otp_attempts = otp_attempts + 1 WHERE email = ?",
        [email]
      );
      
      const remainingAttempts = 5 - (user.otp_attempts + 1);
      return res.status(401).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
      });
    }

    // OTP is valid - update user and clear OTP data
    await database.query(
      "UPDATE user_login SET otp = NULL, otp_expiry = NULL, otp_attempts = 0, isverified = true WHERE email = ?",
      [email]
    );

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: email },process.env.jwt_secret_key!,{ expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    return res.json({ 
      success: true,
      message: "Email verified successfully"
    });

  } catch (error) {
    console.error("OTP verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});


export default otp;