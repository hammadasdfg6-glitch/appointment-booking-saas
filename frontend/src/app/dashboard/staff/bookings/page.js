'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/utils/api';
import '../../admin/admin.css';

export default function StaffBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

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

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      if (newStatus === 'cancelled') {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) {
          setUpdatingId(null);
          return;
        }
        await apiFetch(`/api/booking/${bookingId}`, {
          method: 'DELETE'
        });
      } else {
        await apiFetch(`/api/booking/status/${bookingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        });
      }
      fetchBookings();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout role="staff">
      <div className="admin-header">
        <h1>My Bookings</h1>
      </div>

      {error && <div className="error-message fade-in">{error}</div>}

      <div className="dashboard-grid fade-in">
        <section className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
          <div className="booking-table-wrapper">
            <table className="booking-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading schedule...</td>
                  </tr>
                ) : bookings.length > 0 ? (
                  bookings.map(b => (
                    <tr key={b._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.customerId?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{b.customerId?.email}</div>
                      </td>
                      <td>{b.serviceId?.name || 'Service'}</td>
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
                        {updatingId === b._id ? (
                          <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>Updating...</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {b.status !== 'completed' && b.status !== 'cancelled' && (
                              <button 
                                className="btn-icon" 
                                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary-color)', color: 'var(--bg-color)', borderRadius: '4px' }}
                                onClick={() => handleUpdateStatus(b._id, 'completed')}
                              >
                                Complete
                              </button>
                            )}
                            {b.status !== 'cancelled' && (
                              <button 
                                className="btn-icon text-red" 
                                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', border: '1px solid var(--error-color)', borderRadius: '4px' }}
                                onClick={() => handleUpdateStatus(b._id, 'cancelled')}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
                      No upcoming bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
