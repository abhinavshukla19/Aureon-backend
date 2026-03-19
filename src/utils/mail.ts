import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Retry helper
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

const createTransporter = (): Transporter => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set in environment variables");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",  
    port: 465,                
    secure: true,        
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Timeout settings
    connectionTimeout: 10000,  // 10s to connect
    greetingTimeout: 10000,    // 10s for SMTP greeting
    socketTimeout: 15000,      // 15s for socket inactivity
  });
};

// Verify connection on startup
export const verifyMailConnection = async (): Promise<void> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Mail server connection verified");
  } catch (error) {
    console.error("❌ Mail server connection failed:", error);
  }
};

export const sendMail = async (
  { to, subject, text, html }: MailOptions,
  retries = 2  // retry up to 2 times
): Promise<void> => {
  const transporter = createTransporter();

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      await transporter.sendMail({
        from: `"Aureon" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });
      return; // success
    } catch (error: any) {
      const isLastAttempt = attempt === retries + 1;

      if (isLastAttempt) {
        console.error(`❌ Failed to send email to ${to} after ${retries + 1} attempts:`, error.message);
        throw error; // bubble up after all retries exhausted
      }

      console.warn(`⚠️ Email attempt ${attempt} failed, retrying in 2s...`);
      await wait(2000);
    }
  }
};