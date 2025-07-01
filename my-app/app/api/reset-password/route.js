import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export async function POST(req) {
  const { username, email, newPassword, resetKey } = await req.json();

  await dbConnect();

  // Try JWT auth first
  let user = null;
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const token = auth.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.userId);
    } catch {}
  }
  // If no valid JWT, fall back to reset key flow
  if (!user) {
    // Find user by username or email
    user = await User.findOne({ $or: [
      username ? { username } : {},
      email ? { email } : {}
    ] });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    // Hash provided reset key and compare
    const resetKeyHash = crypto.createHash("sha256").update(resetKey).digest("hex");
    if (resetKeyHash !== user.resetKeyHash) {
      return new Response(JSON.stringify({ error: "Invalid reset key" }), { status: 401 });
    }

    if (!user.resetKeyExpires || user.resetKeyExpires < new Date()) {
      return new Response(JSON.stringify({ error: "Reset key expired. Please request a new one." }), { status: 401 });
    }
  }

  // Password policy
  const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;
  if (!passwordPolicy.test(newPassword)) {
    return new Response(JSON.stringify({ error: "Password must be at least 12 characters and include uppercase, lowercase, number, and special character." }), { status: 400 });
  }

  // Hash new password and update
  const passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordHash = passwordHash;
  user.resetKeyHash = null;
  user.resetKeyExpires = undefined;
  await user.save();

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
