import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import crypto from "crypto";
import { Resend } from "resend";

// Utility to send email using Resend in production, Ethereal in development
async function sendResetEmail(to, resetKey) {
  // Always use Resend for both development and production
  console.log("[FORGOT-PASSWORD] Using Resend for email");
  console.log("[FORGOT-PASSWORD] To:", to);
  console.log("[FORGOT-PASSWORD] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: 'Your Memocrypt Password Reset Key',
      html: `<p>Your password reset key is: <b>${resetKey}</b></p><p style='color:red'><b>Note:</b> You can only request a password reset once every 3 days.</p>`
    });
    console.log("[FORGOT-PASSWORD] Resend API response:", result);
  } catch (e) {
    console.error("[FORGOT-PASSWORD] Resend email error:", e);
  }
}

export async function POST(req) {
  console.log('[FORGOT-PASSWORD] API route called');
  const { username, email } = await req.json();
  console.log('[FORGOT-PASSWORD] Received:', { username, email });
  console.log('[FORGOT-PASSWORD] NODE_ENV:', process.env.NODE_ENV);
  await dbConnect();
  // Find user by username or email
  const user = await User.findOne({ $or: [
    username ? { username } : {},
    email ? { email } : {}
  ] });
  console.log('[FORGOT-PASSWORD] Found user:', user);
  // Persistent rate limit: allow only one reset every 3 days per user
  if (user) {
    const now = new Date();
    // Restore rate limit to 3 days
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
  console.log('[FORGOT-PASSWORD] About to send email to:', user.email);
  try {
    await sendResetEmail(user.email, resetKey);
  } catch (e) {
    console.error("[FORGOT-PASSWORD] Failed to send reset email:", e);
    // Still return generic response
  }
  // Generic response
  return new Response(JSON.stringify({ message: "If an account exists, a reset email has been sent." }), { status: 200 });
}