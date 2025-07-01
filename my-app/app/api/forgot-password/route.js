import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import crypto from "crypto";

export async function POST(req) {
  const { username, email } = await req.json();
  await dbConnect();
  // Find user by username or email
  const user = await User.findOne({ $or: [
    username ? { username } : {},
    email ? { email } : {}
  ] });
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }
  // Generate new reset key
  const resetKey = crypto.randomBytes(32).toString("hex");
  const resetKeyHash = crypto.createHash("sha256").update(resetKey).digest("hex");
  const resetKeyExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  user.resetKeyHash = resetKeyHash;
  user.resetKeyExpires = resetKeyExpires;
  await user.save();
  // Log for debugging
  console.log("[FORGOT-PASSWORD] Generated resetKey:", resetKey);
  console.log("[FORGOT-PASSWORD] resetKeyHash:", resetKeyHash);
  console.log("[FORGOT-PASSWORD] User after save:", JSON.stringify(user, null, 2));
  // Return the new reset key
  return new Response(JSON.stringify({ resetKey }), { status: 200 });
} 