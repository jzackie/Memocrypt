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
      html: `
        <div style="background:#000;padding:32px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:320px;">
          <div style="margin-bottom:24px;">
            <!-- Static Cube SVG -->
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#shadow)">
                <rect x="12" y="12" width="40" height="40" rx="8" fill="#000A03"/>
                <rect x="12" y="12" width="40" height="40" rx="8" fill="url(#cubeGradient)" fill-opacity="0.7"/>
                <rect x="12" y="12" width="40" height="40" rx="8" stroke="#00DB00" stroke-width="2"/>
              </g>
              <defs>
                <filter id="shadow" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00DB00" flood-opacity="0.4"/>
                </filter>
                <linearGradient id="cubeGradient" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#001100"/>
                  <stop offset="1" stop-color="#00DB00"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p style="color:#ededed;font-size:18px;margin-bottom:18px;text-align:center;max-width:420px;">Your password reset key is below. <b>Save this key securely!</b></p>
          <div style='font-family:monospace;background:#222;color:#39ff14;padding:12px 18px;border-radius:8px;margin:18px 0;font-size:18px;'>${resetKey}</div>
          <p style='color:red;font-weight:bold;text-align:center;max-width:420px;'>This is the ONLY way to reset your password if you forget it. If you lose this key, your account and notes CANNOT be recovered.</p>
        </div>
      `
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