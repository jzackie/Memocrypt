import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req) {
  const { username, email, password } = await req.json();

  await dbConnect();

  // Check if user exists
  if (await User.findOne({ username })) {
    return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 });
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

  // Create user
  await User.create({ username, email, passwordHash, resetKeyHash, resetKeyExpires });

  // Return reset key (show only once)
  return new Response(JSON.stringify({ resetKey }), { status: 201 });
}
