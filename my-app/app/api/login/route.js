import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
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
    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    delete safeUser.resetKeyHash;
    // Issue JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return new Response(JSON.stringify({ user: safeUser, token }), { status: 200 });
  } catch (error) {
    console.error('[LOGIN] Internal error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500 });
  }
} 