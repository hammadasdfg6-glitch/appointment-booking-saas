'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/utils/api'

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState('confirming')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setStatus('success')
      return
    }

    async function confirmBooking() {
      try {
        await apiFetch(`/api/checkout/confirm?session_id=${sessionId}`)
        setStatus('success')
      } catch (err) {
        if (err.message?.includes('already confirmed')) {
          setStatus('success')
        } else {
          setError(err.message || 'Failed to confirm booking')
          setStatus('error')
        }
      }
    }

    confirmBooking()
  }, [sessionId])

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
      {status === 'confirming' && (
        <>
          <div style={{
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            marginBottom: '1.5rem',
            opacity: 0.6
          }}>
            ⏳
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>
            Confirming your booking...
          </h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.7, fontSize: '1.1rem' }}>
            Please wait while we finalize your appointment.
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            marginBottom: '1.5rem'
          }}>
            ✓
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
            Booking Confirmed!
          </h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.7, fontSize: '1.1rem', maxWidth: '500px', marginBottom: '2.5rem' }}>
            Your appointment has been successfully scheduled. We've sent a confirmation email with all the details.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/dashboard/customer" className="primary-btn animate-tap">
              View My Bookings
            </Link>
            <Link href="/" className="secondary-btn animate-hover">
              Back to Home
            </Link>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
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
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.7, fontSize: '1.1rem', maxWidth: '500px', marginBottom: '2.5rem' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/dashboard/customer" className="primary-btn animate-tap">
              Go to Dashboard
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function BookingSuccess() {
  return (
    <Suspense fallback={
      <div className="container fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
        <p>Loading booking details...</p>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}
