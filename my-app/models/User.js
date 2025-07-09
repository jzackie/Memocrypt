import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    resetKeyHash: { type: String },
    resetKeyExpires: { type: Date },
    lastResetRequest: { type: Date, default: null }, // For persistent rate limiting
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema); 