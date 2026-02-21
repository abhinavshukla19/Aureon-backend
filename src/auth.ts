import express from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import database from "./db.js";
import { generaterandomotp } from "./utils/Randomgenerator.js";
import { sendMail } from "./utils/mail.js";
import { otpEmailTemplate } from "./utils/otpTemplate.js";

const auth = express.Router();

type UserRow = {
  user_id: number;
  email: string;
  phone_number: string;
  password: string;
  username: string;
  isverified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
};



// FOR SIGNUP

auth.post("/signup", async (req: Request, res: Response) => {
  try {
    const { username, phone_number, email, password } = req.body;

    if (!username || !email || !phone_number || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordStrengthRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain uppercase, lowercase, and a number",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { rows: existing } = await database.query(
      `SELECT user_id, isverified, last_otp_sent FROM user_login 
       WHERE email = $1 OR phone_number = $2 LIMIT 1`,
      [normalizedEmail, phone_number]
    );

    if (existing.length > 0) {
      // Already fully verified
      if (existing[0].isverified) {
        return res.status(409).json({
          success: false,
          message: "User already exists",
        });
      }

      // Unverified — check rate limit before resending OTP
      if (
        existing[0].last_otp_sent &&
        Date.now() - new Date(existing[0].last_otp_sent).getTime() < 60000
      ) {
        return res.status(429).json({
          success: false,
          message: "OTP already sent. Please wait 60 seconds before trying again.",
          unverified: true,
        });
      }

      // Resend OTP
      const randomotp = generaterandomotp().toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      await database.query(
        "UPDATE user_login SET otp = $1, otp_expiry = $2, otp_attempts = 0, last_otp_sent = NOW() WHERE user_id = $3",
        [randomotp, otpExpiry, existing[0].user_id]
      );

      sendMail({
        to: normalizedEmail,
        subject: "Your OTP for Aureon",
        html: otpEmailTemplate(randomotp, normalizedEmail),
      }).catch((err) => console.error("Failed to send OTP email:", err));

      return res.status(200).json({
        success: true,
        message: "Account exists but unverified. A new OTP has been sent.",
        unverified: true,
      });
    }

    // Fresh signup
    const randomotp = generaterandomotp().toString();
    const hashpassword = await bcrypt.hash(password, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await database.query(
      `INSERT INTO user_login 
       (username, email, password, phone_number, otp, otp_expiry, otp_attempts, last_otp_sent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [username, normalizedEmail, hashpassword, phone_number, randomotp, otpExpiry, 0]
    );

    sendMail({
      to: normalizedEmail,
      subject: "Your OTP for Aureon",
      html: otpEmailTemplate(randomotp, normalizedEmail),
    }).catch((err) => console.error("Failed to send OTP email:", err));

    return res.status(201).json({
      success: true,
      message: "Account created. Please check your email for the OTP.",
    });

  } catch (err: any) {
    console.error("Signup error:", err);

    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
});




// fOR SIGNIN

auth.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, phone_number, password } = req.body;

    if ((!email && !phone_number) || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone number and password are required",
      });
    }

    const normalizedEmail = email?.toLowerCase().trim() || null;

    const { rows } = await database.query(
      "SELECT * FROM user_login WHERE email = $1 OR phone_number = $2 LIMIT 1",
      [normalizedEmail, phone_number || null]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    if (!user.isverified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before signing in.",
        unverified: true,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email/phone or password",
      });
    }

    // Password valid — now send OTP for 2FA
    const randomotp = generaterandomotp().toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await database.query(
      "UPDATE user_login SET otp = $1, otp_expiry = $2, otp_attempts = 0, last_otp_sent = NOW() WHERE user_id = $3",
      [randomotp, otpExpiry, user.user_id]
    );

    sendMail({
      to: user.email,
      subject: "Your Sign-in OTP - Aureon",
      html: otpEmailTemplate(randomotp, user.email),
    }).catch((err) => console.error("Failed to send signin OTP:", err));

    return res.status(200).json({
      success: true,
      message: "Password verified. Please check your email for the OTP to complete sign-in.",
    });

  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
});

export default auth;