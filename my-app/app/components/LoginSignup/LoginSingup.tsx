'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from 'sonner';
import { z } from "zod";
import './LoginSignup.css';
import { title } from 'process';

const LoginSingup = () => {
  const [isSignup, setIsSignup] = useState(false);

  const [view, setView] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  
  const resetSchema = z.object({
    resetKey: z.string().min(1, "Reset key is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
  })

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
        resetKey: '',
        newPassword: '',
    }
  })


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
  }
   
  const toggleForm = () => setIsSignup(prev => !prev);
  
  return (
    <div className="auth-container">
        <h2 className='form-heading'>
            {view == 'signin' && 'Sign In'}
            {view == 'signup' && 'Sign Up'}
            {view == 'forgot' && 'Forgot password'}
            {view == 'reset' && 'Reset key'}
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
                <>
                    <input type='text' placeholder='Username' />
                    <input type='email' placeholder='Email' />
                    <input type='password' placeholder='Password' />
                    <input type='password' placeholder='Confirm password' />
                    <button>Create Account</button>
                </>
            )}

            {view === 'signin' && (
                <>
                    <input type='text' placeholder='Username' />
                    <input type='password' placeholder='password' />
                    <button>Login</button>
                    <div className="forgot-password"
                    onClick={() => setView('forgot')}>
                        Forgot password?
                    </div>
                </>
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
                            id='resetKey'
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
                            id='newPassword'
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

                    <button type='submit'>
                        Reset password
                    </button>

                    <div className='forgot-password'
                    onClick={() => setView('signin')}>
                        Go back to login
                    </div>
                </>
            )}
        </div>
    </div>
  )
}

export default LoginSingup