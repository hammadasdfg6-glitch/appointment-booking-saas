'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';
import Link from 'next/link';

export default function RegisterOrgPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch('/api/auth/orgs', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (data.success) {
        // Direct to admin dashboard as they are now an owner
        router.push('/dashboard/admin');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh' 
    }}>
      <div className="auth-card" style={{
        background: '#1a1a1a',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#FFD700', marginBottom: '0.5rem', fontSize: '2rem' }}>Get Started</h1>
        <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>Create your organization and admin account.</p>

        {error && <div style={{ color: '#ff4444', marginBottom: '1rem', background: 'rgba(255, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              name="name"
              placeholder="Organization Name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ flex: 1, padding: '0.875rem', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: 'white', outline: 'none' }}
            />
            <input
              type="text"
              name="slug"
              placeholder="Org Slug (e.g. my-biz)"
              value={formData.slug}
              onChange={handleChange}
              required
              style={{ flex: 1, padding: '0.875rem', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: 'white', outline: 'none' }}
            />
          </div>

          <input
            type="text"
            name="ownerName"
            placeholder="Your Full Name"
            value={formData.ownerName}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: 'white', outline: 'none' }}
          />

          <input
            type="email"
            name="ownerEmail"
            placeholder="Work Email Address"
            value={formData.ownerEmail}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: 'white', outline: 'none' }}
          />

          <input
            type="password"
            name="password"
            placeholder="Create Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: 'white', outline: 'none' }}
          />

          <button 
            type="submit" 
            className="primary-btn animate-hover" 
            style={{ width: '100%', border: 'none', marginTop: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', color: '#a1a1aa' }}>
          Already have an account? <Link href="/login" style={{ color: '#FFD700', textDecoration: 'none', fontWeight: 'bold' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
