'use client';
import Link from 'next/link';

export default function BookingCancelled() {
  return (
    <div className="container fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        borderRadius: '50%',
        width: '80px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
        marginBottom: '1.5rem'
      }}>
        ✕
      </div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
        Booking Cancelled
      </h1>
      <p style={{ color: 'var(--foreground)', opacity: 0.7, fontSize: '1.1rem', maxWidth: '500px', marginBottom: '2.5rem' }}>
        Your booking process was cancelled. No charges were made to your account.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/book" className="primary-btn animate-tap">
          Try Booking Again
        </Link>
        <Link href="/" className="secondary-btn animate-hover">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
