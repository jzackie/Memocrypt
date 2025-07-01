import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    attachments: [
      {
        url: { type: String, required: true },
        type: { type: String },
        name: { type: String },
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Note || mongoose.model("Note", NoteSchema); 