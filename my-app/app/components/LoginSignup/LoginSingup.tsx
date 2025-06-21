'use client';

import React, { useState } from 'react';
import './LoginSignup.css';

const LoginSingup = () => {
  const [isSignup, setIsSignup] = useState(false);
  
  const toggleForm = () => setIsSignup(prev => !prev);
  
  return (
    <div className="auth-container">
        <h2 className='form-heading'>{isSignup ? 'Sign Up' : 'Sign In'}</h2>

        <div className="form-toggle">
            <button
                onClick={() => setIsSignup(false)} 
                className={!isSignup ? 'active' : ''}
            >
                Sign In
            </button>
            <button
                onClick={() => setIsSignup(true)}
                className={isSignup ? 'active' : ''}
            >
                Sign Up
            </button>
        </div>

        {isSignup ? (
            <div className="signup-form">
                <input type='text' placeholder='Username' />
                <input type='email' placeholder='Email' />
                <input type='password' placeholder='Password' />
                <input type='password' placeholder='Confirm password' />
                <button>Create Account</button>
            </div>
        ) : (
            <div className="signin-form">
                <input type='text' placeholder='Username' />
                <input type='password' placeholder='password' />
                <button>Login</button>
            </div>
        )}

        <div className="forgot-password">
            Forgot password?
        </div>
    </div>
  )
}

export default LoginSingup