'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/utils/api';
import '../admin/admin.css';
import Link from 'next/link';

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    try {
      const data = await apiFetch('/api/booking');
      setBookings(data.bookings || []);
      setError(null);
    } catch (err) {
      if (err.message.includes('No Bookings Found')) {
         setBookings([]);
         setError(null);
      } else {
         setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const confirmCancel = (bookingId) => {
    setShowCancelModal(bookingId);
  };

  const handleCancelBooking = async () => {
    const bookingId = showCancelModal;
    if (!bookingId) return;
    
    setShowCancelModal(null);
    setCancellingId(bookingId);
    try {
      await apiFetch(`/api/booking/${bookingId}`, {
        method: 'DELETE'
      });
      fetchBookings(); // Refresh the list
    } catch (err) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  return (
    <DashboardLayout role="customer">
      <div className="admin-header fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Dashboard</h1>
          <p style={{ opacity: 0.7 }}>Welcome back! Here are your appointments.</p>
        </div>
        <div>
          <Link href="/book" className="btn-primary animate-tap" style={{ textDecoration: 'none' }}>
            + Book New Service
          </Link>
        </div>
      </div>

      {error && <div className="error-message fade-in">{error}</div>}

      <div className="dashboard-grid fade-in">
        <section className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Upcoming Appointments
          </h2>
          
          <div className="booking-table-wrapper">
            <table className="booking-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Provider</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading appointments...</td>
                  </tr>
                ) : upcomingBookings.length > 0 ? (
                  upcomingBookings.map(b => (
                    <tr key={b._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.serviceId?.name || 'Service'}</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8, color: 'var(--accent)' }}>${b.price}</div>
                      </td>
                      <td>{b.staffId?.name || 'Staff'}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.date}</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{b.startAt} - {b.endAt}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${b.status?.toLowerCase() || 'pending'}`}>
                          {b.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        {cancellingId === b._id ? (
                          <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>Cancelling...</span>
                        ) : (
                          <button 
                            className="btn-icon text-red" 
                            style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', border: '1px solid var(--error-color)', borderRadius: '4px' }}
                            onClick={() => confirmCancel(b._id)}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
                      You have no upcoming appointments. <br/><br/>
                      <Link href="/book" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'bold' }}>Book one now</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {pastBookings.length > 0 && (
          <section className="dashboard-section fade-in" style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
            <h2 style={{ opacity: 0.8, marginBottom: '1.5rem' }}>Past Appointments</h2>
            <div className="booking-table-wrapper" style={{ opacity: 0.8 }}>
              <table className="booking-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Provider</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastBookings.map(b => (
                    <tr key={b._id}>
                      <td>{b.serviceId?.name || 'Service'}</td>
                      <td>{b.staffId?.name || 'Staff'}</td>
                      <td>{b.date}</td>
                      <td>
                        <span className={`badge badge-${b.status?.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {showCancelModal && (
        <div className="modal-overlay fade-in" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px',
            maxWidth: '400px', width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid var(--border)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--foreground)' }}>Cancel Appointment</h3>
            <p style={{ opacity: 0.8, marginBottom: '2rem', color: 'var(--foreground)' }}>Are you sure you want to cancel this appointment? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="secondary-btn animate-tap" onClick={() => setShowCancelModal(null)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Keep Appointment
              </button>
              <button className="primary-btn animate-tap" onClick={handleCancelBooking} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: '#e74c3c', color: '#fff', border: 'none' }}>
                Yes, Cancel it
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
