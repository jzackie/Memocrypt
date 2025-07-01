import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  const { username, password } = await req.json();
  await dbConnect();
  const user = await User.findOne({ username });
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid username or password" }), { status: 401 });
  }
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return new Response(JSON.stringify({ error: "Invalid username or password" }), { status: 401 });
  }
  // Do not return sensitive fields
  const { passwordHash: _passwordHash, resetKeyHash: _resetKeyHash, ...safeUser } = user.toObject();
  // Issue JWT
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return new Response(JSON.stringify({ user: safeUser, token }), { status: 200 });
} 