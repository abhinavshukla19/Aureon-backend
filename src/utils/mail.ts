import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

export const verifyMailConnection = async () => {
  try {
    if (!process.env.BREVO_API_KEY) throw new Error("No Brevo API key found");
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
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "Aureon", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
};