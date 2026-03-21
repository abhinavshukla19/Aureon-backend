import express from "express";
import type { Request, Response } from "express";
import database from "./db.js";
import { authmiddeware } from "./auth_middleware.js";
import { generaterandomotp } from "./utils/Randomgenerator.js";
import { sendMail } from "./utils/mail.js";
import { otpEmailTemplate } from "./utils/otpTemplate.js";

const update = express.Router();


// ─────────────────────────────────────────────
// REQUEST PASSWORD CHANGE — sends OTP
// ─────────────────────────────────────────────
update.post("/request-password-change", authmiddeware, async (req: Request, res: Response) => {
  try {
    const user_id = req.authentication?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in.",
      });
    }

    const { rows } = await database.query(
      "SELECT email, last_otp_sent FROM user_login WHERE user_id = $1",
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { email, last_otp_sent } = rows[0];

    // Rate limit: 60 seconds
    if (
      last_otp_sent &&
      Date.now() - new Date(last_otp_sent).getTime() < 60000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting a new OTP.",
      });
    }

    const randomotp = generaterandomotp().toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await database.query(
      "UPDATE user_login SET otp = $1, otp_expiry = $2, otp_attempts = 0, last_otp_sent = NOW() WHERE user_id = $3",
      [randomotp, otpExpiry, user_id]
    );

    await sendMail({
      to: email,
      subject: "OTP for Password Change - Aureon",
      html: otpEmailTemplate(randomotp, email),
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your registered email. Valid for 5 minutes.",
      email, 
    });

  } catch (error) {
    console.error("Request password change error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});


// ─────────────────────────────────────────────
// REQUEST EMAIL CHANGE — validates new email + sends OTP
// ─────────────────────────────────────────────
update.post("/request-email-change", authmiddeware, async (req: Request, res: Response) => {
  try {
    const { newEmail } = req.body;
    const user_id = req.authentication?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in.",
      });
    }

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: "New email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = newEmail.toLowerCase().trim();

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const { rows } = await database.query(
      "SELECT email, last_otp_sent FROM user_login WHERE user_id = $1",
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { email: currentEmail, last_otp_sent } = rows[0];

    // Same as current
    if (currentEmail.toLowerCase() === normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "New email must be different from your current email",
      });
    }

    // Already taken by someone else
    const { rows: existing } = await database.query(
      "SELECT user_id FROM user_login WHERE email = $1 AND user_id != $2",
      [normalizedEmail, user_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This email is already in use",
      });
    }

    // Rate limit: 60 seconds
    if (
      last_otp_sent &&
      Date.now() - new Date(last_otp_sent).getTime() < 60000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting a new OTP.",
      });
    }

    const randomotp = generaterandomotp().toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Store OTP + pending_email (actual change happens after OTP verify)
    await database.query(
      `UPDATE user_login 
       SET otp = $1, otp_expiry = $2, otp_attempts = 0, last_otp_sent = NOW(), pending_email = $3 
       WHERE user_id = $4`,
      [randomotp, otpExpiry, normalizedEmail, user_id]
    );

    // Send OTP to the NEW email so they prove they own it
    await sendMail({
      to: normalizedEmail,
      subject: "OTP for Email Change - Aureon",
      html: otpEmailTemplate(randomotp, normalizedEmail),
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your new email address. Verify to complete the change.",
    });

  } catch (error: any) {
    console.error("Request email change error:", error);

    if (error?.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This email is already in use",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});


export default update;