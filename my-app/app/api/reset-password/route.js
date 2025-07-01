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
    const orConditions = [];
    if (username) orConditions.push({ username });
    if (email) orConditions.push({ email });
    if (orConditions.length === 0) {
      return new Response(JSON.stringify({ error: "Username or email required" }), { status: 400 });
    }
    const userQuery = { $or: orConditions };
    console.log("[RESET-PASSWORD] User query:", JSON.stringify(userQuery));
    const users = await User.find(userQuery);
    console.log("[RESET-PASSWORD] Users found:", users.map(u => ({ _id: u._id, username: u.username, email: u.email, resetKeyHash: u.resetKeyHash, resetKeyExpires: u.resetKeyExpires })));
    user = users[0];
    if (!user) {
      console.error("[RESET-PASSWORD] User not found for username/email:", username, email);
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    // Log user object for debugging
    console.log("[RESET-PASSWORD] User object:", JSON.stringify(user, null, 2));

    // Hash provided reset key and compare
    const resetKeyHash = crypto.createHash("sha256").update(resetKey).digest("hex");
    console.log("[RESET-PASSWORD] Provided resetKey:", resetKey);
    console.log("[RESET-PASSWORD] Computed resetKeyHash:", resetKeyHash);
    console.log("[RESET-PASSWORD] Stored resetKeyHash:", user.resetKeyHash);
    console.log("[RESET-PASSWORD] resetKeyExpires:", user.resetKeyExpires);
    if (resetKeyHash !== user.resetKeyHash) {
      console.error("[RESET-PASSWORD] Hash mismatch. Provided:", resetKeyHash, "Stored:", user.resetKeyHash);
      return new Response(JSON.stringify({ error: "Invalid reset key" }), { status: 401 });
    }

    if (!user.resetKeyExpires || user.resetKeyExpires < new Date()) {
      console.error("[RESET-PASSWORD] Reset key expired or missing. Expires:", user.resetKeyExpires);
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
