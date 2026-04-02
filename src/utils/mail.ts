import { Resend } from "resend";

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class MailDeliveryError extends Error {
  code: "TESTING_RECIPIENT_RESTRICTED" | "MAIL_SERVICE_UNAVAILABLE";

  constructor(
    code: "TESTING_RECIPIENT_RESTRICTED" | "MAIL_SERVICE_UNAVAILABLE",
    message: string
  ) {
    super(message);
    this.code = code;
    this.name = "MailDeliveryError";
  }
}

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

const getResend = (): Resend => {
  const key = process.env.RESEND_API_KEY;
  if (!key?.trim()) {
    throw new Error("RESEND_API_KEY must be set in environment variables");
  }
  return new Resend(key);
};

/** "Name <email@domain.com>" — verify domain in Resend dashboard for production */
const getFromAddress = (): string => {
  const from = process.env.RESEND_FROM?.trim();
  if (from) return from;
  // Safe default for quick testing; production should use verified domain via RESEND_FROM.
  return "Aureon <onboarding@resend.dev>";
};

/**
 * Lightweight check that the API key works (does not send an email).
 */
export const verifyMailConnection = async (): Promise<void> => {
  if (!process.env.RESEND_API_KEY?.trim()) {
    console.warn("⚠️ RESEND_API_KEY not set — skipping Resend verification");
    return;
  }
  if (process.env.SKIP_MAIL_VERIFY === "1" || process.env.SKIP_MAIL_VERIFY === "true") {
    console.log("ℹ️ SKIP_MAIL_VERIFY set — skipping mail verification");
    return;
  }
  try {
    const resend = getResend();
    const { error } = await resend.domains.list();
    if (error) {
      console.error("❌ Resend API check failed:", error.message);
      return;
    }
    console.log("✅ Resend API key OK");
  } catch (err) {
    console.error("❌ Resend verification error:", err);
  }
};

export const sendMail = async (
  { to, subject, text, html }: MailOptions,
  retries = 2
): Promise<void> => {
  if (!html && !text) {
    throw new Error("sendMail requires html and/or text");
  }

  const from = getFromAddress();
  const resend = getResend();

  // Default reply-to to the same recipient address for OTP flows.
  // Can still be overridden globally via RESEND_REPLY_TO.
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || to;

  type SendEmailPayload = Parameters<Resend["emails"]["send"]>[0];
  const payload = {
    from,
    to,
    subject,
    ...(html !== undefined ? { html } : {}),
    ...(text !== undefined ? { text } : {}),
    ...(replyTo ? { replyTo } : {}),
  } as SendEmailPayload;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const { error } = await resend.emails.send(payload);

      if (error) {
        throw new Error(error.message);
      }
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const normalized = message.toLowerCase();
      const isTestingRecipientRestricted =
        normalized.includes("testing mode") ||
        normalized.includes("testing emails") ||
        normalized.includes("verify a domain") ||
        normalized.includes("verify your domain") ||
        normalized.includes("you can only send testing emails");
      const isLastAttempt = attempt === retries + 1;

      if (isTestingRecipientRestricted) {
        throw new MailDeliveryError(
          "TESTING_RECIPIENT_RESTRICTED",
          "Email service is in testing mode and cannot send OTP to this address. Verify your domain and set RESEND_FROM to that verified domain."
        );
      }

      if (isLastAttempt) {
        console.error(
          `❌ Failed to send email to ${to} after ${retries + 1} attempts:`,
          message
        );
        throw new MailDeliveryError(
          "MAIL_SERVICE_UNAVAILABLE",
          "OTP email service is temporarily unavailable. Please try again later."
        );
      }

      console.warn(`⚠️ Email attempt ${attempt} failed, retrying in 2s...`);
      await wait(2000);
    }
  }
};
