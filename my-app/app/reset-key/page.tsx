'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetKeyPage() {
  const [resetKey, setResetKey] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const key = localStorage.getItem('signupResetKey');
    setResetKey(key);
  }, []);

  const handleCopy = () => {
    if (resetKey) {
      navigator.clipboard.writeText(resetKey);
    }
  };

  const handleDownload = () => {
    if (!resetKey) return;
    const data = { resetKey };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reset-key.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleContinue = () => {
    localStorage.removeItem('signupResetKey');
    router.push('/');
  };

  const handleGoBack = () => {
    localStorage.removeItem('signupResetKey');
    router.push('/');
  };

  if (!resetKey) {
    return (
      <div style={{ color: 'white', textAlign: 'center', marginTop: 100 }}>
        No reset key found. Please sign up again.
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'rgba(20, 20, 20, 0.98)',
        borderRadius: 20,
        boxShadow: '0 0 40px #39ff14aa',
        padding: '40px 32px 48px 32px',
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        border: '1.5px solid #39ff1433',
        position: 'relative',
      }}>
        <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 28, marginBottom: 8 }}>Reset Key</h2>
        <div style={{ color: '#aaa', fontSize: 15, marginBottom: 24 }}>Keep it safe, it&apos;s the only way to reset your password!</div>
        <div style={{
          background: '#222',
          borderRadius: 16,
          padding: '12px 24px',
          color: '#ededed',
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 18,
          letterSpacing: 1.2,
          overflowX: 'auto',
          userSelect: 'all',
        }}>{resetKey}</div>
        <button onClick={handleCopy} style={{ width: '100%', background: 'none', border: 'none', color: '#39ff14', fontWeight: 700, fontSize: 18, marginBottom: 10, cursor: 'pointer', padding: 10 }}>Copy</button>
        <button onClick={handleDownload} style={{ width: '100%', background: 'none', border: 'none', color: '#39ff14', fontWeight: 700, fontSize: 18, marginBottom: 30, cursor: 'pointer', padding: 10 }}>Download</button>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#39ff14" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#39ff14" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="60" cy="30" rx="55" ry="18" fill="url(#glow)" />
            <path d="M60 10 v25" stroke="#39ff14" strokeWidth="6" strokeLinecap="round" />
            <polyline points="50,25 60,35 70,25" fill="none" stroke="#39ff14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <button onClick={handleContinue} style={{ width: '100%', background: 'none', border: '1.5px solid #39ff14', color: '#39ff14', fontWeight: 600, fontSize: 17, borderRadius: 10, marginBottom: 12, padding: 12, cursor: 'pointer', transition: 'background 0.2s' }}>Continue to App</button>
        <button onClick={handleGoBack} style={{ width: '100%', background: 'none', border: '1.5px solid #39ff14', color: '#39ff14', fontWeight: 600, fontSize: 17, borderRadius: 10, padding: 12, cursor: 'pointer', transition: 'background 0.2s' }}>Go back to Sign In</button>
      </div>
    </div>
  );
} 