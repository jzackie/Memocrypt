import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";

export async function POST(req) {
  try {
    const { username, email, password } = await req.json();
    await dbConnect();
    // Check if user exists by username or email
    const existingUser = await User.findOne({ $or: [ { username }, { email } ] });
    if (existingUser) {
      if (existingUser.username === username && existingUser.email === email) {
        return new Response(JSON.stringify({ error: "Username and email already exist" }), { status: 400 });
      } else if (existingUser.username === username) {
        return new Response(JSON.stringify({ error: "Username already exists" }), { status: 400 });
      } else {
        return new Response(JSON.stringify({ error: "Email already exists" }), { status: 400 });
      }
    }
    // Password policy
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;
    if (!passwordPolicy.test(password)) {
      return new Response(JSON.stringify({ error: "Password must be at least 12 characters and include uppercase, lowercase, number, and special character." }), { status: 400 });
    }
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    // Generate reset key
    const resetKey = crypto.randomBytes(32).toString("hex");
    const resetKeyHash = crypto.createHash("sha256").update(resetKey).digest("hex");
    const resetKeyExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    console.log("[SIGNUP] Generated resetKey:", resetKey);
    console.log("[SIGNUP] resetKeyHash:", resetKeyHash);
    // Create user
    const newUser = await User.create({ username, email, passwordHash, resetKeyHash, resetKeyExpires });
    console.log("[SIGNUP] Created user:", newUser);
    // After creating the user and generating the reset key:
    // Send the reset key via email with a downloadable link
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Your Memocrypt Reset Key',
        html: `
          <div style="background:#000;padding:32px 0;display:flex;flex-direction:row;align-items:center;justify-content:center;min-height:320px;">
            <p style="color:#ededed;font-size:18px;margin-bottom:18px;text-align:center;max-width:420px;">Your password reset key is below. <b>Save this key securely!</b></p>
            <div style='font-family:monospace;background:#222;color:#39ff14;padding:12px 18px;border-radius:8px;margin:18px 0;font-size:18px;'>${resetKey}</div>
            <p style='color:red;font-weight:bold;text-align:center;max-width:420px;'>This is the ONLY way to reset your password if you forget it. If you lose this key, your account and notes CANNOT be recovered.</p>
          </div>
        `
      });
    } catch (e) {
      console.error('[SIGNUP] Failed to send reset key email:', e);
    }
    // Return reset key (show only once)
    return new Response(JSON.stringify({ resetKey }), { status: 201 });
  } catch (error) {
    console.error('[SIGNUP] Internal error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500 });
  }
}
