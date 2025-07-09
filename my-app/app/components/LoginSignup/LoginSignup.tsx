'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from 'sonner';
import { z } from "zod";
import './LoginSignup.css';
import Cube from '../Cube/Cube';
import '../Cube/Cube.css';

// Password policy regex and hint
const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;
const passwordHint = "At least 12 characters, with uppercase, lowercase, number, and special character.";

// Form schemas
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(12, "Password must be at least 12 characters")
    .regex(passwordPolicy, "Password must include uppercase, lowercase, number, and special character."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signinSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const resetSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  resetKey: z.string().min(1, "Reset key is required"),
  newPassword: z.string().min(12, "Password must be at least 12 characters")
    .regex(passwordPolicy, "Password must include uppercase, lowercase, number, and special character."),
});

type SignupForm = z.infer<typeof signupSchema>;
type SigninForm = z.infer<typeof signinSchema>;
type ResetForm = z.infer<typeof resetSchema>;

const LoginSignup = () => {
  const [view, setView] = useState<'signin' | 'signup' | 'forgot' | 'reset' | 'requestResetKey' | 'showResetKey'>('signin');
  const [resetRequestSent, setResetRequestSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetRequestResult, setResetRequestResult] = useState<string | null>(null);
  // Remove all code related to signupResetKey, the 'showResetKey' view, and reset key UI after signup.
  // After successful signup, setView('signin') or redirect as before.

  // Form hooks
  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const signinForm = useForm<SigninForm>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      username: '',
      password: '',
    }
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      usernameOrEmail: '',
      resetKey: '',
      newPassword: '',
    }
  });

  // Handle forgot password (request new reset key)
  const [forgotInput, setForgotInput] = useState({ username: '', email: '' });
  const handleForgotInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForgotInput({ ...forgotInput, [e.target.name]: e.target.value });
  };
  const onRequestResetKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResetRequestResult(null);
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotInput),
      });
      const result = await response.json();
      if (response.ok) {
        setResetRequestSent(true);
        setResetRequestResult(null);
        toast.success('Reset key generated!');
      } else {
        setResetRequestResult(result.error || 'Could not generate reset key');
        toast.error(result.error || 'Could not generate reset key');
      }
    } catch {
      setResetRequestResult('An error occurred');
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signup
  const onSignup = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('Account created successfully!');
        setView('signin'); // Redirect to signin after successful signup
      } else {
        toast.error(result.error || 'Signup failed');
      }
    } catch {
      toast.error('An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signin
  const onSignin = async (data: SigninForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Store user data in localStorage for session management
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        toast.success('Login successful!');
        // Redirect to main page
        window.location.href = '/';
      } else {
        if (result.error && (result.error.includes('Invalid username or password') || result.error.includes('User not found'))) {
          toast.error('Incorrect username or password.');
        } else {
          toast.error(result.error || 'Login failed');
        }
      }
    } catch {
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const onResetPassword = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      // Determine if input is email or username
      let username = undefined;
      let email = undefined;
      if (data.usernameOrEmail.includes('@')) {
        email = data.usernameOrEmail;
      } else {
        username = data.usernameOrEmail;
      }
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          resetKey: data.resetKey,
          newPassword: data.newPassword,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('Password reset successfully!');
        setTimeout(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setView('signin');
          resetForm.reset();
        }, 600);
      } else {
        if (result.error && (result.error.includes('Invalid reset key') || result.error.includes('User not found'))) {
          toast.error('Invalid reset key for this user.');
        } else if (result.error && result.error.includes('Reset key expired')) {
          toast.error('Reset key expired. Please request a new one.');
        } else {
          toast.error(result.error || 'Password reset failed');
        }
      }
    } catch {
      toast.error('An error occurred during password reset');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload for reset key
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!e.target?.result) throw new Error('No file content');
          const data = JSON.parse(e.target.result as string);
          resetForm.setValue('resetKey', data.resetKey);
          toast.success("Reset Key Loaded! Your reset key has been loaded successfully");
        } catch {
          toast.error("Invalid File. Please select a valid reset key file");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopyResetKey = () => {
    // This function is no longer needed as reset key is not displayed in UI after signup
  };
  const handleDownloadResetKey = () => {
    // This function is no longer needed as reset key is not displayed in UI after signup
  };
  const handleContinueToApp = () => {
    // This function is no longer needed as reset key is not displayed in UI after signup
  };
  const handleGoBackToSignIn = () => {
    setView('signin');
  };

  return (
    <div className="auth-container">
      <h2 className='form-heading'>
        {view === 'signin' && 'Sign In'}
        {view === 'signup' && 'Sign Up'}
        {view === 'forgot' && 'Forgot password'}
        {view === 'reset' && 'Reset password'}
        {view === 'requestResetKey' && 'Request Reset Key'}
        {view === 'showResetKey' && 'Reset Key'}
      </h2>

      {(view === 'signin' || view === 'signup') && (
        <div className="form-toggle">
          <button
            onClick={() => setView('signin')} 
            className={view === 'signin' ? 'active' : ''}
          >
            Sign In
          </button>
          <button
            onClick={() => setView('signup')}
            className={view === 'signup' ? 'active' : ''}
          >
            Sign Up
          </button>
        </div>
      )}

      <div className="form-body">
        {view === 'signup' && (
          <form onSubmit={signupForm.handleSubmit(onSignup)}>
            <input
              {...signupForm.register("username")}
              type='text'
              placeholder='Username'
            />
            {signupForm.formState.errors.username && (
              <p className='text-red-500 text-sm mt-1'>
                {signupForm.formState.errors.username.message}
              </p>
            )}

            <input
              {...signupForm.register("email")}
              type='email'
              placeholder='Email'
            />
            {signupForm.formState.errors.email && (
              <p className='text-red-500 text-sm mt-1'>
                {signupForm.formState.errors.email.message}
              </p>
            )}

            <input
              {...signupForm.register("password")}
              type='password'
              placeholder='Password'
            />
            <p className='text-sm' style={{ color: '#aaa', marginTop: '-8px', marginBottom: '4px' }}>{passwordHint}</p>
            {signupForm.formState.errors.password && (
              <p className='text-red-500 text-sm mt-1'>
                {signupForm.formState.errors.password.message}
              </p>
            )}

            <input
              {...signupForm.register("confirmPassword")}
              type='password'
              placeholder='Confirm password'
            />
            {signupForm.formState.errors.confirmPassword && (
              <p className='text-red-500 text-sm mt-1'>
                {signupForm.formState.errors.confirmPassword.message}
              </p>
            )}

            <button type='submit' disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {view === 'signin' && (
          <form onSubmit={signinForm.handleSubmit(onSignin)}>
            <input
              {...signinForm.register("username")}
              type='text'
              placeholder='Username'
            />
            {signinForm.formState.errors.username && (
              <p className='text-red-500 text-sm mt-1'>
                {signinForm.formState.errors.username.message}
              </p>
            )}

            <input
              {...signinForm.register("password")}
              type='password'
              placeholder='Password'
            />
            {signinForm.formState.errors.password && (
              <p className='text-red-500 text-sm mt-1'>
                {signinForm.formState.errors.password.message}
              </p>
            )}

            <button type='submit' disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <div 
              className="forgot-password"
              onClick={() => setView('forgot')}
            >
              Forgot password?
            </div>
          </form>
        )}

        {view === 'requestResetKey' && (
          <form onSubmit={onRequestResetKey}>
            <input
              name="username"
              type="text"
              placeholder="Username (or leave blank)"
              value={forgotInput.username}
              onChange={handleForgotInput}
            />
            <input
              name="email"
              type="email"
              placeholder="Email (or leave blank)"
              value={forgotInput.email}
              onChange={handleForgotInput}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Requesting...' : 'Request Reset Key'}
            </button>
            {resetRequestResult && <p className='text-red-500 text-sm mt-1'>{resetRequestResult}</p>}
            <div className='forgot-password' onClick={() => setView('forgot')}>
              Already have a reset key?
            </div>
            <div className='forgot-password' onClick={() => setView('signin')}>
              Go back to login
            </div>
          </form>
        )}

        {view === 'showResetKey' ? (
          <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at center, #101010 60%, #000 100%)', color: '#ededed', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
              <Cube />
            </div>
            <div style={{
              background: 'rgba(20, 20, 20, 0.98)',
              borderRadius: 20,
              boxShadow: '0 0 40px #39ff14aa',
              padding: '56px 32px 48px 32px',
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
              border: '1.5px solid #39ff1433',
              position: 'relative',
              marginTop: 120,
              zIndex: 2,
            }}>
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 30, marginBottom: 8, letterSpacing: 1 }}>Reset Key</h2>
              <div style={{ color: '#aaa', fontSize: 16, marginBottom: 24, fontWeight: 400 }}>Keep it safe, it&apos;s the only way to reset your password!</div>
              <div style={{
                background: '#222',
                borderRadius: 16,
                padding: '14px 24px',
                color: '#ededed',
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 18,
                letterSpacing: 1.2,
                overflowX: 'auto',
                userSelect: 'all',
                border: '1.5px solid #39ff14',
                boxShadow: '0 0 16px #39ff1444',
              }}>{/* This div is no longer needed as reset key is not displayed in UI after signup */}</div>
              <button onClick={handleCopyResetKey} style={{ width: '100%', background: 'none', border: 'none', color: '#39ff14', fontWeight: 700, fontSize: 18, marginBottom: 10, cursor: 'pointer', padding: 10, borderRadius: 8, transition: 'background 0.2s', outline: 'none' }}>Copy</button>
              <button onClick={handleDownloadResetKey} style={{ width: '100%', background: 'none', border: 'none', color: '#39ff14', fontWeight: 700, fontSize: 18, marginBottom: 30, cursor: 'pointer', padding: 10, borderRadius: 8, transition: 'background 0.2s', outline: 'none' }}>Download</button>
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
              <button onClick={handleContinueToApp} style={{ width: '100%', background: 'none', border: '1.5px solid #39ff14', color: '#39ff14', fontWeight: 600, fontSize: 17, borderRadius: 10, marginBottom: 12, padding: 12, cursor: 'pointer', transition: 'background 0.2s', marginTop: 8 }}>Continue to App</button>
              <button onClick={handleGoBackToSignIn} style={{ width: '100%', background: 'none', border: '1.5px solid #39ff14', color: '#39ff14', fontWeight: 600, fontSize: 17, borderRadius: 10, padding: 12, cursor: 'pointer', transition: 'background 0.2s' }}>Go back to Sign In</button>
            </div>
          </div>
        ) : (
          <>
            {view === 'forgot' && (
              <>
                <div className='forgot-password' onClick={() => setView('requestResetKey')}>
                  Need a new reset key?
                </div>
                {resetRequestSent && (
                  <div style={{ color: '#39ff14', fontWeight: 500, margin: '12px 0' }}>
                    If an account exists, a reset email has been sent. <br />
                    <b>Please check your email inbox and spam folder.</b><br />
                    <span style={{ color: '#ff3939', fontWeight: 600 }}>You can only request a password reset once every 3 days.</span>
                  </div>
                )}
                <div>
                  <input 
                    type='file' 
                    accept='.json' 
                    onChange={handleFileUpload} 
                    className='upload_reset_key'
                  />
                </div>
                <div>
                  <input
                    {...resetForm.register("usernameOrEmail")}
                    placeholder='Enter username or email'
                  />
                  {resetForm.formState.errors.usernameOrEmail && (
                    <p className='text-red-500 text-sm mt-1'>
                      {resetForm.formState.errors.usernameOrEmail.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    {...resetForm.register("resetKey")}
                    placeholder='Enter reset key'
                  />
                  {resetForm.formState.errors.resetKey && (
                    <p className='text-red-500 text-sm mt-1'>
                      {resetForm.formState.errors.resetKey.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type='password'
                    {...resetForm.register('newPassword')}
                    placeholder='Enter new password' 
                  />
                  <p className='text-sm' style={{ color: '#aaa', marginTop: '-8px', marginBottom: '4px' }}>{passwordHint}</p>
                  {resetForm.formState.errors.newPassword && (
                    <p className='text-red-500 text-sm mt-1'>
                      {resetForm.formState.errors.newPassword.message}
                    </p>    
                  )}
                </div>
                <button 
                  onClick={resetForm.handleSubmit(onResetPassword)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset password'}
                </button>
                <div 
                  className='forgot-password'
                  onClick={() => setView('signin')}
                >
                  Go back to login
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;