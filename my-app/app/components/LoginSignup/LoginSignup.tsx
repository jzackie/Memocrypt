'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from 'sonner';
import { z } from "zod";
import './LoginSignup.css';

// Form schemas
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
  resetKey: z.string().min(1, "Reset key is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;
type SigninForm = z.infer<typeof signinSchema>;
type ResetForm = z.infer<typeof resetSchema>;

const LoginSignup = () => {
  const [view, setView] = useState<'signin' | 'signup' | 'forgot' | 'reset' | 'resetKey'>('signin');
  const [resetKey, setResetKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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
      resetKey: '',
      newPassword: '',
    }
  });

  // Handle signup
  const onSignup = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
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
        setResetKey(result.resetKey);
        setView('resetKey');
        toast.success('Account created successfully!');
      } else {
        toast.error(result.error || 'Signup failed');
      }
    } catch (error) {
      toast.error('An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signin
  const onSignin = async (data: SigninForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
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
        toast.success('Login successful!');
        // Redirect to main page
        window.location.href = '/';
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const onResetPassword = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetKey: data.resetKey,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Password reset successfully!');
        setView('signin');
        resetForm.reset();
      } else {
        toast.error(result.error || 'Password reset failed');
      }
    } catch (error) {
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
          const data = JSON.parse(e.target?.result as string);
          resetForm.setValue('resetKey', data.resetKey);
          toast.success("Reset Key Loaded! Your reset key has been loaded successfully");
        } catch (error) {
          toast.error("Invalid File. Please select a valid reset key file");
        }
      };
      reader.readAsText(file);
    }
  };

  // Download reset key
  const downloadResetKey = () => {
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

  // Copy reset key to clipboard
  const copyResetKey = async () => {
    try {
      await navigator.clipboard.writeText(resetKey);
      toast.success('Reset key copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy reset key');
    }
  };

  return (
    <div className="auth-container">
      <h2 className='form-heading'>
        {view === 'signin' && 'Sign In'}
        {view === 'signup' && 'Sign Up'}
        {view === 'forgot' && 'Forgot password'}
        {view === 'reset' && 'Reset password'}
        {view === 'resetKey' && 'Your Reset Key'}
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

        {view === 'forgot' && (
          <>
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

        {view === 'resetKey' && (
          <div className="reset-key-container">
            <div className="reset-key-info">
              <h3>Important: Save Your Reset Key</h3>
              <p>This is the only way to reset your password if you forget it. Keep it safe!</p>
            </div>
            
            <div className="reset-key-display">
              <input
                type="text"
                value={resetKey}
                readOnly
                className="reset-key-input"
              />
            </div>

            <div className="reset-key-actions">
              <button onClick={copyResetKey} className="copy-btn">
                Copy Reset Key
              </button>
              <button onClick={downloadResetKey} className="download-btn">
                Download Reset Key
              </button>
            </div>

            <div 
              className='forgot-password'
              onClick={() => setView('signin')}
            >
              Go to Login
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;