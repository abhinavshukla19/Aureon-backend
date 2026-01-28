import express from "express"
import type { Request , Response } from "express";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { database } from "./db.js";
import { generaterandomotp } from "./utils/Randomgenerator.js";
import { sendMail } from "./utils/mail.js";
import { otpEmailTemplate } from "./utils/otpTemplate.js";

const auth= express.Router();


type UserRow = {
    user_id: number;
    email: string;
    phone_number: string;
    password: string;
    username: string;
    created_at: Date;
    updated_at: Date;
    last_login: Date | null;
};



        // for signup

auth.post("/signup", async (req: Request, res: Response) => {
  try {
    const { username, phone_number, email, password } = req.body;

    // Input validation
    if (!username || !email || !phone_number || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please fill all the fields" 
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const randomotp = generaterandomotp().toFixed(0);
    const hashpassword = await bcrypt.hash(password, 10);
    
    // OTP expires in 5 minutes
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Check existing user
    const [existing] = await database.query(
      "SELECT user_id FROM user_login WHERE email = ? OR phone_number = ? LIMIT 1",
      [email, phone_number]
    );

    if ((existing as any[]).length > 0) {
      return res.status(409).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // Insert user with OTP and expiry
    await database.query(
      "INSERT INTO user_login (username, email, password, phone_number, otp, otp_expiry, otp_attempts) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [username, email, hashpassword, phone_number, randomotp, otpExpiry, 0]
    );

    // Send OTP email
    await sendMail({
      to: email,
      subject: "Your OTP for Aureon",
      html: otpEmailTemplate(randomotp, email)
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please check your email for OTP."
    });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later."
    });
  }
});





   // for signin

auth.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, phone_number, password } = req.body;
    const secret_key = process.env.jwt_secret_key as string;

    if ((!email && !phone_number) || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone number and password are required",
      });
    }

    if (!secret_key) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const identifier = email || phone_number;

    const [rows] = await database.query(
      "SELECT * FROM user_login WHERE email = ? OR phone_number = ? LIMIT 1",
      [identifier, identifier]
    );

    const users = rows as UserRow[] | any;

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist",
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email/Phone number or password is incorrect",
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
      },
      secret_key,
      { expiresIn: "7d" }
    );

    await database.query(
      "UPDATE user_login SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?",
      [user.user_id]
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });

  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later",
    });
  }
});


export default auth;
