import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import crypto from "crypto";
import { Resend } from "resend";
import nodemailer from "nodemailer";

// Utility to send email using Resend in production, Ethereal in development
async function sendResetEmail(to, resetKey) {
  if (process.env.NODE_ENV === "production") {
    console.log("[FORGOT-PASSWORD] Using Resend for email (production mode)");
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject: 'Your Memocrypt Password Reset Key',
        html: `<p>Your password reset key is: <b>${resetKey}</b></p>`
      });
    } catch (e) {
      console.error("[FORGOT-PASSWORD] Resend email error:", e);
    }
  } else {
    console.log("[FORGOT-PASSWORD] Using Ethereal for email (development mode)");
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      const info = await transporter.sendMail({
        from: '"Memocrypt" <no-reply@memocrypt.com>',
        to,
        subject: "Your Memocrypt Password Reset Key",
        text: `Your password reset key is: ${resetKey}`,
        html: `<p>Your password reset key is: <b>${resetKey}</b></p>`
      });
      console.log("[FORGOT-PASSWORD] Preview email: %s", nodemailer.getTestMessageUrl(info));
    } catch (e) {
      console.error("[FORGOT-PASSWORD] Ethereal email error:", e);
    }
  }
}

export async function POST(req) {
  const { username, email } = await req.json();
  await dbConnect();
  // Find user by username or email
  const user = await User.findOne({ $or: [
    username ? { username } : {},
    email ? { email } : {}
  ] });
  // Persistent rate limit: allow only one reset every 3 days per user
  if (user) {
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (user.lastResetRequest && now - user.lastResetRequest < threeDays) {
      // Too soon, return generic response
      return new Response(JSON.stringify({ message: "If an account exists, a reset email has been sent." }), { status: 200 });
    }
    user.lastResetRequest = now;
    await user.save();
  }
  if (!user) {
    // Generic response to prevent user enumeration
    return new Response(JSON.stringify({ message: "If an account exists, a reset email has been sent." }), { status: 200 });
  }
  // Generate new reset key
  const resetKey = crypto.randomBytes(32).toString("hex");
  const resetKeyHash = crypto.createHash("sha256").update(resetKey).digest("hex");
  const resetKeyExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  user.resetKeyHash = resetKeyHash;
  user.resetKeyExpires = resetKeyExpires;
  await user.save();
  // Send reset key via email
  try {
    await sendResetEmail(user.email, resetKey);
  } catch (e) {
    console.error("[FORGOT-PASSWORD] Failed to send reset email:", e);
    // Still return generic response
  }
  // Generic response
  return new Response(JSON.stringify({ message: "If an account exists, a reset email has been sent." }), { status: 200 });
} 