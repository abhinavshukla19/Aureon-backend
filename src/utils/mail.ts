import dotenv from "dotenv";
dotenv.config();
import * as nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify connection on startup
export const verifyMailConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Mail server connected successfully");
  } catch (err) {
    console.error("❌ Mail server connection failed:", err);
  }
};

export const sendMail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  await transporter.sendMail({
    from: `"Aureon" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
};