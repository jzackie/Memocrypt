"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import "../../../page.css";
import Image from "next/image";

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3939" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const noteIdFromParams = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id ?? null;
  const [noteId, setNoteId] = useState<string | null>(noteIdFromParams);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<{ url: string; type?: string; name?: string }[]>([]);
  const CLOUDINARY_UPLOAD_PRESET = 'unsigned-notes';
  const CLOUDINARY_CLOUD_NAME = 'df4onlwnk';

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (!noteId) return;
    const token = localStorage.getItem("token");
    fetch(`/api/notes?noteId=${noteId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(notes => {
        const note = Array.isArray(notes) ? notes.find((n: any) => n._id === noteId) : notes;
        if (note) {
          setTitle(note.title);
          setContent(note.content);
          setCreatedAt(note.createdAt);
          setUpdatedAt(note.updatedAt);
          setAttachments(note.attachments || []);
        }
      });
  }, [noteId]);

  // Auto-save logic
  const saveNote = async (newTitle: string, newContent: string) => {
    setError("");
    setSuccess(false);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not found or not authenticated. Please log in again.");
      return;
    }
    if (!newTitle.trim()) {
      setError("Title is required.");
      return;
    }
    setLoading(true);
    let res;
    if (!noteId) {
      // Should not happen, but fallback to create
      res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, content: newContent, attachments }),
      });
      if (res.ok) {
        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          setError("Unexpected server response.");
        }
        if (data && typeof data === 'object') {
          if (data._id) {
            setNoteId(data._id);
          } else if (data.error) {
            setError(data.error);
          }
        } else {
          setError("Unexpected server response.");
        }
      }
    } else {
      // Update note
      res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ noteId, title: newTitle, content: newContent, attachments }),
      });
      if (res.ok) {
        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          setError("Unexpected server response.");
        }
        if (data && typeof data === 'object') {
          if (data._id) {
            setNoteId(data._id);
          } else if (data.error) {
            setError(data.error);
          }
        } else {
          setError("Unexpected server response.");
        }
      }
    }
    setLoading(false);
    if (res && res.ok) {
      setSuccess(true);
    } else {
      setError("Failed to save note. Please try again.");
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleBack = () => router.push("/");
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleAddFiles = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const uploaded = await Promise.all(files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
          { method: 'POST', body: formData }
        );
        const data = await res.json();
        if (data.secure_url) {
          return { url: data.secure_url, type: file.type, name: file.name };
        }
        return null;
      }));
      setAttachments(prev => [...prev, ...uploaded.filter((att): att is { url: string; type: string; name: string } => !!att)]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const handleDeleteAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveOrUpdate = () => {
    saveNote(title, content);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#ededed", fontFamily: "var(--font-sans)", position: 'relative' }}>
      <header className="main-header minimal-header">
        <span className="main-username">{user?.username || "Username"}</span>
        <button onClick={handleLogout} className="logout-btn" title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </header>
      {/* Absolutely positioned back button */}
      <button onClick={handleBack} style={{ position: 'absolute', left: 24, top: 'calc(32px + 24px)', background: 'none', border: 'none', color: '#39ff14', fontSize: 24, cursor: 'pointer', padding: 0, height: 48, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', zIndex: 10 }} title="Back">
        &#8592;
      </button>
      <div className="main-centered-container">
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 24, marginBottom: 0, justifyContent: 'space-between' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              className="note-title-input"
              placeholder="Title"
              value={title}
              onChange={handleTitleChange}
              maxLength={100}
              style={{ fontWeight: 700, fontSize: 28, border: 'none', color: '#ededed', outline: 'none', marginBottom: 0, padding: 0, height: 48, textAlign: 'left', width: '100%' }}
            />
          </div>
          <div style={{ minWidth: 180, display: 'flex', justifyContent: 'flex-end' }}>
            {(error || success) && (
              <div className="note-message-top" style={{ marginLeft: 16, background: 'none', textAlign: 'right' }}>{error || (success && "Note saved!")}</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#aaa', fontSize: 13, margin: '8px 0 2px 0' }}>
            <ClockIcon />
            <span>{createdAt ? formatDate(createdAt) : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#aaa', fontSize: 13, marginBottom: 18 }}>
            <EditIcon />
            <span>Last Edited {updatedAt ? formatDate(updatedAt) : ''}</span>
          </div>
          <textarea
            className="note-content-input"
            placeholder="Type anything..."
            value={content}
            onChange={handleContentChange}
            style={{ width: "100%", minHeight: 500, marginBottom: 18, borderRadius: 10, border: "none", color: "#ededed", fontSize: 15, resize: 'vertical', outline: 'none' }}
          />
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div style={{ marginBottom: 12, width: '100%' }}>
              {attachments.map((att, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <button onClick={() => handleDeleteAttachment(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 2 }} title="Remove attachment"><TrashIcon /></button>
                  {att.type && att.type.startsWith('image') ? (
                    <Image src={att.url} alt={att.name || 'attachment'} width={80} height={80} style={{ borderRadius: 6, background: '#181818', cursor: 'pointer' }} />
                  ) : att.type && att.type.startsWith('video') ? (
                    <video src={att.url} controls style={{ maxWidth: 120, maxHeight: 80, borderRadius: 6, background: '#181818', cursor: 'pointer' }} />
                  ) : (
                    <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ color: '#39ff14', textDecoration: 'underline', fontSize: 14 }}>{att.name}</a>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Buttons row: Add Files + Save/Update */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, width: '100%', marginTop: 20 }}>
            <button 
              onClick={handleAddFiles} 
              style={{ background: 'none', border: 'none', color: '#39ff14cc', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400, opacity: 0.85, transition: 'opacity 0.2s' }}
            >
              <span style={{ fontSize: 17 }}>📎</span> <span style={{ fontSize: 14 }}>Add Files</span>
            </button>
            <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} multiple />
            <button
              onClick={handleSaveOrUpdate}
              disabled={loading || !title.trim()}
              style={{
                background: 'rgba(17,17,17,0.85)',
                color: '#39ff14',
                border: '1px solid #222',
                borderRadius: 7,
                padding: '8px 20px',
                fontWeight: 600,
                fontSize: 15,
                cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !title.trim() ? 0.5 : 0.92,
                boxShadow: '0 1px 6px #0005',
                transition: 'all 0.2s',
                marginTop: 0
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 