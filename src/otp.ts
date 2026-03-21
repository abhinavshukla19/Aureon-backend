import express from "express";
import type { Request, Response } from "express";
import database from "./db.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generaterandomotp } from "./utils/Randomgenerator.ts";
import { sendMail } from "./utils/mail.ts";
import { otpEmailTemplate } from "./utils/otpTemplate.ts";

const otp = express.Router();


// Send OTP (reused across routes)

const sendOtp = async (email: string, subject: string) => {
  const randomotp = generaterandomotp().toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  await database.query(
    "UPDATE user_login SET otp = $1, otp_expiry = $2, otp_attempts = 0, last_otp_sent = NOW() WHERE email = $3",
    [randomotp, otpExpiry, email]
  );

  await sendMail({
    to: email,
    subject,
    html: otpEmailTemplate(randomotp, email),
  });
};


// ─────────────────────────────────────────────
// OTP VERIFY
// ─────────────────────────────────────────────

otp.post("/otpverify", async (req: Request, res: Response) => {
  const { email, otp, purpose, newPassword } = req.body;

  if (!email || !otp || !purpose) {
    return res.status(400).json({
      success: false,
      message: "Email, OTP, and purpose are required",
    });
  }

  const validPurposes = ["signup", "signin", "password_change", "email_change"];
  if (!validPurposes.includes(purpose)) {
    return res.status(400).json({
      success: false,
      message: "Invalid purpose",
    });
  }

  // password_change requires newPassword
  if (purpose === "password_change" && !newPassword) {
    return res.status(400).json({
      success: false,
      message: "newPassword is required for password change",
    });
  }

  // password strength if changing password
  if (purpose === "password_change") {
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { rows } = await database.query(
      "SELECT user_id, otp, otp_expiry, otp_attempts, isverified, password, pending_email FROM user_login WHERE email = $1",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    // ── Purpose-specific checks ──
    if (purpose === "signup" && user.isverified) {
      return res.status(400).json({
        success: false,
        message: "Account already verified. Please sign in.",
      });
    }

    if (purpose === "signin" && !user.isverified) {
      return res.status(403).json({
        success: false,
        message: "Please complete signup verification first.",
      });
    }

    if (purpose === "email_change" && !user.pending_email) {
      return res.status(400).json({
        success: false,
        message: "No pending email change found. Please request email change first.",
      });
    }

    // ── OTP checks ──
    if (!user.otp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or already used. Please request a new one.",
      });
    }

    if (new Date() > new Date(user.otp_expiry)) {
      await database.query(
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL WHERE email = $1",
        [normalizedEmail]
      );
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.otp_attempts >= 5) {
      await database.query(
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL WHERE email = $1",
        [normalizedEmail]
      );
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    if (String(otp) !== String(user.otp)) {
      await database.query(
        "UPDATE user_login SET otp_attempts = otp_attempts + 1 WHERE email = $1",
        [normalizedEmail]
      );
      const remaining = 5 - (user.otp_attempts + 1);
      return res.status(401).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
      });
    }

    // ── OTP valid — handle per purpose ──

    if (purpose === "signup") {
      await database.query(
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL, otp_attempts = 0, isverified = true WHERE email = $1",
        [normalizedEmail]
      );

      const token = jwt.sign(
        { user_id: user.user_id, email: normalizedEmail },
        process.env.jwt_secret_key!,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        message: "Email verified successfully. Welcome to Aureon!",
        token,
      });
    }

    if (purpose === "signin") {
      await database.query(
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL, otp_attempts = 0, last_login = NOW() WHERE email = $1",
        [normalizedEmail]
      );

      const token = jwt.sign(
        { user_id: user.user_id, email: normalizedEmail },
        process.env.jwt_secret_key!,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        message: "Signed in successfully",
        token,
      });
    }

    if (purpose === "password_change") {
      // Check new password is not same as old
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: "New password cannot be the same as your current password",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await database.query(
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL, otp_attempts = 0, password = $1 WHERE email = $2",
        [hashedPassword, normalizedEmail]
      );

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    }

    if (purpose === "email_change") {
      await database.query(
        `UPDATE user_login 
         SET otp = NULL, otp_expiry = NULL, otp_attempts = 0, 
             email = pending_email, pending_email = NULL 
         WHERE email = $1`,
        [normalizedEmail]
      );

      return res.status(200).json({
        success: true,
        message: "Email changed successfully",
        newEmail: user.pending_email,
      });
    }

  } catch (error: any) {
    console.error("OTP verify error:", error);

    if (error?.code === "ECONNREFUSED" || error?.code === "ENOTFOUND") {
      return res.status(503).json({
        success: false,
        message: "Database connection failed. Please try again later.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


// ─────────────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────────────
otp.post("/resend-otp", async (req: Request, res: Response) => {
  const { email, purpose } = req.body;

  if (!email || !purpose) {
    return res.status(400).json({
      success: false,
      message: "Email and purpose are required",
    });
  }

  const validPurposes = ["signup", "signin", "password_change", "email_change"];
  if (!validPurposes.includes(purpose)) {
    return res.status(400).json({
      success: false,
      message: "Invalid purpose",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { rows } = await database.query(
      "SELECT user_id, isverified, last_otp_sent, pending_email FROM user_login WHERE email = $1",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    if (purpose === "signup" && user.isverified) {
      return res.status(400).json({
        success: false,
        message: "Account already verified. Please sign in.",
      });
    }

    if (purpose === "email_change" && !user.pending_email) {
      return res.status(400).json({
        success: false,
        message: "No pending email change. Please request email change first.",
      });
    }

    // Rate limit: 60 seconds
    if (
      user.last_otp_sent &&
      Date.now() - new Date(user.last_otp_sent).getTime() < 60000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting a new OTP.",
      });
    }

    const subjects: Record<string, string> = {
      signup:           "Your OTP for Aureon",
      signin:           "Your Sign-in OTP - Aureon",
      password_change:  "OTP for Password Change - Aureon",
      email_change:     "OTP for Email Change - Aureon",
    };

    // For email_change, send OTP to the pending new email
    const sendTo = purpose === "email_change" ? user.pending_email : normalizedEmail;

    await sendOtp(normalizedEmail, subjects[purpose] as string);  
    
    // if email_change, also send to new email
    if (purpose === "email_change") {
      await sendMail({
        to: sendTo,
        subject: subjects[purpose] as string,
        html: otpEmailTemplate("check your registered email for OTP", sendTo),
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Please check your email.",
    });

  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again later.",
    });
  }
});


export default otp;