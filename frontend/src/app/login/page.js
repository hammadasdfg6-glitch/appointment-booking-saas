'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './login.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, passwordHash: password } : { email, passwordHash: password, name, orgName, role: 'customer' };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Authentication failed');
      }
      
      const data = await res.json();
      
      // Determine dashboard based on role (default customer)
      if (data.role === 'admin' || data.role === 'owner') {
        router.push('/dashboard/admin');
      } else if (data.role === 'staff') {
        router.push('/dashboard/staff');
      } else {
        router.push('/dashboard/customer');
      }
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card fade-in">
        <h1 className="login-title">VestAuth</h1>
        <p className="login-subtitle">
          {isLogin ? 'Welcome back. Please login to continue.' : 'Create your account to get started.'}
        </p>
        
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <>
              <input 
                type="text" 
                placeholder="Full Name" 
                className="login-input animate-hover" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
              <input 
                type="text" 
                placeholder="Organization Name (e.g. E2E Test Salon)" 
                className="login-input animate-hover" 
                value={orgName} 
                onChange={e => setOrgName(e.target.value)} 
                required 
              />
            </>
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            className="login-input animate-hover" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="login-input animate-hover" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="login-button animate-tap">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="login-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="login-toggle-btn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
