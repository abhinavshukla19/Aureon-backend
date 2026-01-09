import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";


interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const transporter: Transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER as string,
    pass: process.env.EMAIL_PASS as string
  }
});

export const sendMail = async ({
  to,
  subject,
  text,
  html
}: MailOptions): Promise<void> => {
  await transporter.sendMail({
    from: `"Aureon" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};
