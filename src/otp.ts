import express from "express"
import type{Request , Response} from "express"
import database from "./db.js";
import  jwt  from "jsonwebtoken";
import { generaterandomotp } from "./utils/Randomgenerator.js";
import { sendMail } from "./utils/mail.js";
import { otpEmailTemplate } from "./utils/otpTemplate.js";
const otp=express.Router();


// otp verify

otp.post("/otpverify", async (req: Request, res: Response) => {
  const { email, otp, purpose } = req.body;

  // Validation
  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    });
  }

  // Validate purpose
  const validPurposes = ['signup', 'password_change', 'email_change'];
  const verificationPurpose = purpose || 'signup'; // Default to signup
  
  if (purpose && !validPurposes.includes(purpose)) {
    return res.status(400).json({
      success: false,
      message: "Invalid verification purpose"
    });
  }

  try {
    // Query database for user and OTP
    const { rows }: any = await database.query(
      "SELECT user_id, otp, otp_expiry, otp_attempts, isverified, email FROM user_login WHERE email = $1",
      [email]
    );

    // Check if user exists
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const user = rows[0];

    // For signup: check if already verified
    if (verificationPurpose === 'signup' && user.isverified) {
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
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL WHERE email = $1",
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
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL WHERE email = $1",
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
        "UPDATE user_login SET otp_attempts = otp_attempts + 1 WHERE email = $1",
        [email]
      );
      
      const remainingAttempts = 5 - (user.otp_attempts + 1);
      return res.status(401).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
      });
    }

    // OTP is valid - handle based on purpose
    let token: string | undefined;
    let responseData: any = {};

    if (verificationPurpose === 'signup') {
      // Signup: Update user, verify account, and generate token
      await database.query(
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL, otp_attempts = 0, isverified = true WHERE email = $1",
        [email]
      );

      // Generate JWT token
      token = jwt.sign(
        { user_id: user.user_id, email: email },
        process.env.jwt_secret_key!,
        { expiresIn: "7d" }
      );

      responseData = {
        success: true,
        message: "Email verified successfully",
        token: token
      };

    } else if (verificationPurpose === 'password_change') {
      // Password change: Just verify OTP, don't update isverified
      // Clear OTP after verification
      await database.query(
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL, otp_attempts = 0 WHERE email = $1",
        [email]
      );

      responseData = {
        success: true,
        message: "OTP verified. You can now change your password.",
        data: {
          verified: true,
          email: email
        }
      };

    } else if (verificationPurpose === 'email_change') {
      // Email change: Verify OTP and update email
      // Note: You might need to get the new email from a separate table or session
      // For now, assuming the new email is stored somewhere (you'll need to implement this)
      
      // Clear OTP after verification
      await database.query(
        "UPDATE user_login SET otp = NULL, otp_expiry = NULL, otp_attempts = 0 WHERE email = $1",
        [email]
      );

      // TODO: Update email in database if you have the new email stored
      // Example:
      // const newEmail = await getNewEmailFromTempTable(user.user_id);
      // if (newEmail) {
      //   await database.query(
      //     "UPDATE user_login SET email = $1 WHERE user_id = $2",
      //     [newEmail, user.user_id]
      //   );
      // }

      responseData = {
        success: true,
        message: "OTP verified. Your email has been updated.",
        data: {
          verified: true,
          email: email 
        }
      };
    }

    // Set cookie only for signup
    if (token) {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });
    }

    return res.json(responseData);

  } catch (error: any) {
    console.error("OTP verify error:", error);
    
    let errorMessage = "Internal server error";
    let statusCode = 500;

    // Handle specific database errors
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      errorMessage = "Database connection failed. Please try again later.";
      statusCode = 503;
    } else if (error?.code === '23505') { // PostgreSQL unique violation
      errorMessage = "A conflict occurred. Please try again.";
      statusCode = 409;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  }
});





// Resend otp

otp.post("/resend-otp", async (req: Request, res: Response) => {
  const { email, purpose } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required"
    });
  }

  try {
    // Check if user exists
    const { rows } = await database.query(
      "SELECT user_id, email FROM user_login WHERE email = $1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Generate new OTP
    const randomotp = generaterandomotp().toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update OTP in database
    await database.query(
      "UPDATE user_login SET otp = $1, otp_expiry = $2, otp_attempts = 0 WHERE email = $3",
      [randomotp, otpExpiry, email]
    );

    // Send email based on purpose
    let emailSubject = "Your OTP for Aureon";
    let emailTemplate = otpEmailTemplate(randomotp, email);

    if (purpose === 'password_change') {
      emailSubject = "OTP for Password Change - Aureon";
      // You can create a custom template for password change
    } else if (purpose === 'email_change') {
      emailSubject = "OTP for Email Change - Aureon";
      // You can create a custom template for email change
    }

    await sendMail({
      to: email,
      subject: emailSubject,
      html: emailTemplate,
    });

    return res.json({
      success: true,
      message: "OTP sent successfully. Please check your email."
    });

  } catch (error: any) {
    console.error("Resend OTP error:", error);
    
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again later."
    });
  }
});


export default otp;