"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginSignup from "./components/LoginSignup/LoginSignup";
import Cube from "./components/Cube/Cube";
import "./page.css";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function groupNotesByDate(notes: any[]) {
  const today = new Date();
  const todayStr = today.toLocaleDateString();
  const groups: Record<string, any[]> = {};
  notes.forEach(note => {
    const noteDate = new Date(note.updatedAt || note.createdAt);
    const noteDateStr = noteDate.toLocaleDateString();
    let group = formatDate(noteDate.toISOString());
    if (noteDateStr === todayStr) group = "Recent";
    if (!groups[group]) groups[group] = [];
    groups[group].push(note);
  });
  return groups;
}

const MinimalIcon = ({ path, ...props }: { path: string; [key: string]: any }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d={path} />
  </svg>
);

const PencilIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>
);

const NoteModal = ({ open, onClose, initial }: any) => {
  const router = useRouter();
  if (!open) return null;
  const { title, content, updatedAt, createdAt, _id } = initial || {};
  const dateStr = updatedAt || createdAt ? formatDate(updatedAt || createdAt) : formatDate(new Date().toISOString());
  const handleEdit = () => {
    if (_id) router.push(`/note/${_id}/edit`);
  };
  return (
    <div className="note-modal-overlay" onClick={onClose}>
      <div className="note-modal" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button onClick={onClose} className="note-modal-close" title="Close">
          <CloseIcon />
        </button>
        {/* Title */}
        <div className="note-modal-title">{title}</div>
        {/* Date/Last Edited */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#aaa', fontSize: 13, margin: '8px 0 2px 0' }}>
          <ClockIcon />
          <span>{dateStr}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#aaa', fontSize: 13, marginBottom: 18 }}>
          <EditIcon />
          <span>Last Edited {dateStr === 'Recent' ? 'Today' : dateStr}</span>
        </div>
        {/* Content */}
        <div className="note-modal-content">{content}</div>
        {/* Attachments preview in modal */}
        {initial && initial.attachments && initial.attachments.length > 0 && (
          <div style={{ margin: '16px 0 0 0', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {initial.attachments.map((att: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {att.type && att.type.startsWith('image') ? (
                  <img src={att.url} alt={att.name} style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, background: '#181818' }} />
                ) : att.type && att.type.startsWith('video') ? (
                  <video src={att.url} controls style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8, background: '#181818' }} />
                ) : (
                  <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ color: '#39ff14', fontSize: 15, textDecoration: 'underline' }}>{att.name || 'File'}</a>
                )}
              </div>
            ))}
          </div>
        )}
        {/* Edit Button */}
        <button onClick={handleEdit} className="note-modal-edit" title="Edit">
          <PencilIcon />
        </button>
      </div>
    </div>
  );
};

export default function MainPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewNote, setPreviewNote] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`/api/notes`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotes(data);
        } else {
          setNotes([]);
          if (data.error) {
            alert(data.error);
            if (data.error === 'Unauthorized') {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              window.location.href = '/';
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (noteId: string) => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const res = await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
      body: JSON.stringify({ noteId }),
    });
    if (res.ok) setNotes(notes.filter(n => n._id !== noteId));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const filteredNotes = Array.isArray(notes)
    ? notes.filter(n =>
        n.title.toLowerCase().includes(filter.toLowerCase()) ||
        n.content.toLowerCase().includes(filter.toLowerCase())
      )
    : [];
  const grouped = groupNotesByDate(filteredNotes);

  const handleDownload = (note: any) => {
    const blob = new Blob([
      `Title: ${note.title}\n\n${note.content}`
    ], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'note'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div>
        <Cube />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          color: 'white'
        }}>
          <LoginSignup />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minWidth: "100vw", minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
        {/* Header */}
        <header className="main-header minimal-header">
          <span className="main-username">{user?.username || "Username"}</span>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </header>

        {/* Filter */}
        <div className="notes-filter">
          <input
            placeholder="Filter notes..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>

        {/* Notes Grid, grouped by date */}
      <div className="main-centered-container">
        <main className="main-notes-content">
          {loading ? (
            <div style={{ color: "#888", marginTop: 40 }}>Loading...</div>
          ) : (
            Object.entries(grouped).map(([date, notes]) => (
              <div key={date} style={{ width: '100%', maxWidth: 1200, marginBottom: 32 }}>
                <div className="notes-date-label">{date}</div>
                <div className="notes-grid">
                  {notes.map(note => (
                    <div key={note._id} className="note-card minimal-card" onClick={() => setPreviewNote(note)}>
                      <div style={{padding: '16px 14px 0 14px', width: '100%', boxSizing: 'border-box', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start'}}>
                        <div className="note-card-title">{note.title || 'Example Header'}</div>
                        <div className="note-card-content">{note.content ? note.content.slice(0, 100) : 'Text Preview'}</div>
                      </div>
                      {/* Attachments preview at the bottom */}
                      {note.attachments && note.attachments.length > 0 && (
                        <div style={{ margin: '0 0 36px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          {note.attachments.slice(0, 2).map((att: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {att.type && att.type.startsWith('image') ? (
                                <img src={att.url} alt={att.name} style={{ maxWidth: 40, maxHeight: 40, borderRadius: 4, background: '#181818' }} />
                              ) : att.type && att.type.startsWith('video') ? (
                                <video src={att.url} style={{ maxWidth: 50, maxHeight: 40, borderRadius: 4, background: '#181818' }} />
                              ) : (
                                <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ color: '#39ff14', fontSize: 13, textDecoration: 'underline' }}>{att.name || 'File'}</a>
                              )}
                            </div>
                          ))}
                          {note.attachments.length > 2 && <span style={{ color: '#888', fontSize: 12 }}>+{note.attachments.length - 2} more</span>}
                        </div>
                      )}
                      <div className="note-card-download" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); handleDownload(note); }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff3939" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); handleDelete(note._id); }}>
                          <title>Delete</title>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {/* Floating Create Button */}
      <button
        className="floating-create-btn minimal-create-btn"
        title="Create New Notes"
        onClick={() => router.push('/note/new')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Create New Notes
      </button>

      {/* Note Preview Modal */}
      <NoteModal
        open={!!previewNote}
        onClose={() => setPreviewNote(null)}
        initial={previewNote}
      />
    </div>
  );
}
