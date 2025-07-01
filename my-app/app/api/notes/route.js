import dbConnect from "@/lib/dbConnect";
import Note from "@/models/Note";
import jwt from "jsonwebtoken";

function getUserIdFromAuth(req) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(req) {
  await dbConnect();
  const userId = getUserIdFromAuth(req);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("noteId");
  if (noteId) {
    const note = await Note.findOne({ _id: noteId, userId });
    if (!note) return new Response(JSON.stringify({ error: "Note not found" }), { status: 404 });
    return new Response(JSON.stringify(note), { status: 200 });
  }
  const notes = await Note.find({ userId }).sort({ updatedAt: -1 });
  return new Response(JSON.stringify(notes), { status: 200 });
}

export async function POST(req) {
  await dbConnect();
  const userId = getUserIdFromAuth(req);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const { title, content, attachments } = await req.json();
  if (!title || !content) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  const note = await Note.create({ userId, title, content, attachments });
  return new Response(JSON.stringify(note), { status: 201 });
}

export async function PUT(req) {
  await dbConnect();
  const userId = getUserIdFromAuth(req);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const { noteId, title, content, attachments } = await req.json();
  if (!noteId || !title || !content) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  const note = await Note.findOneAndUpdate(
    { _id: noteId, userId },
    { title, content, attachments, updatedAt: new Date() },
    { new: true }
  );
  if (!note) return new Response(JSON.stringify({ error: "Note not found" }), { status: 404 });
  return new Response(JSON.stringify(note), { status: 200 });
}

export async function DELETE(req) {
  await dbConnect();
  const userId = getUserIdFromAuth(req);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const { noteId } = await req.json();
  if (!noteId) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  const note = await Note.findOneAndDelete({ _id: noteId, userId });
  if (!note) return new Response(JSON.stringify({ error: "Note not found" }), { status: 404 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
} 