'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/utils/api';
import './admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletePrompt, setDeletePrompt] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, servicesRes, bookingsRes] = await Promise.all([
          apiFetch('/api/stats/advanced').catch(() => ({ data: {} })),
          apiFetch('/api/service').catch(() => ({ services: [] })),
          apiFetch('/api/booking?limit=5').catch(() => ({ bookings: [] }))
        ]);
        
        setStats(statsRes.data);
        setServices(servicesRes.services || []);
        setBookings(bookingsRes.bookings || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!deletePrompt) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/service/${encodeURIComponent(deletePrompt)}`, { method: 'DELETE' });
      // Refresh services list
      const res = await apiFetch('/api/service').catch(() => ({ services: [] }));
      setServices(res.services || []);
      setDeletePrompt(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="admin-header"><h1>Loading Dashboard...</h1></div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin">
        <div className="admin-header"><h1>Error Loading Dashboard</h1><p>{error}</p></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="admin-header">
        <h1>Admin Overview</h1>
      </div>

      <div className="stats-panel fade-in">
        <div className="stat-card animate-hover">
          <div className="stat-title">Total Revenue</div>
          <div className="stat-value">${stats?.today?.revenue || 0}</div>
          <div className={`stat-trend ${Number(stats?.comparisons?.revenueThisWeekVsLastWeek) >= 0 ? 'positive' : 'negative'}`}>
            {Number(stats?.comparisons?.revenueThisWeekVsLastWeek) >= 0 ? '+' : ''}{stats?.comparisons?.revenueThisWeekVsLastWeek || 0}%
          </div>
        </div>
        <div className="stat-card animate-hover">
          <div className="stat-title">Bookings Today</div>
          <div className="stat-value">{stats?.today?.bookings || 0}</div>
          <div className={`stat-trend ${Number(stats?.comparisons?.bookingTodayVsTomorrow) >= 0 ? 'positive' : 'negative'}`}>
            {Number(stats?.comparisons?.bookingTodayVsTomorrow) >= 0 ? '+' : ''}{stats?.comparisons?.bookingTodayVsTomorrow || 0}% vs Tmrw
          </div>
        </div>
        <div className="stat-card animate-hover">
          <div className="stat-title">Active Services</div>
          <div className="stat-value">{services.length}</div>
        </div>
      </div>

      <div className="dashboard-grid fade-in">
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Active Services</h2>
            <Link href="/dashboard/admin/services">
              <button className="btn-primary animate-tap">+ Add New</button>
            </Link>
          </div>
          <div className="service-list">
            {services.map(svc => (
              <div key={svc._id} className="service-card animate-hover">
                <div className="svc-info">
                  <h3>{svc.name}</h3>
                  <p>${svc.price} / {svc.durationMinutes} min</p>
                </div>
                <div className="svc-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <Link href="/dashboard/admin/services" style={{ flex: 1 }}>
                    <button className="secondary-btn" style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}>Edit</button>
                  </Link>
                  <button 
                    className="secondary-btn" 
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', borderColor: 'var(--error-color)', color: 'var(--error-color)' }}
                    onClick={() => setDeletePrompt(svc.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {services.length === 0 && <p style={{opacity: 0.7}}>No services found. Add one above.</p>}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Upcoming Bookings</h2>
            <button className="btn-link">View All</button>
          </div>
          <div className="booking-table-wrapper">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td>{b.customerId?.name || 'Unknown'}</td>
                    <td>{b.serviceId?.name || 'Service'}</td>
                    <td>{b.date}, {b.startAt}</td>
                    <td><span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span></td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', opacity: 0.7 }}>No recent bookings found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {deletePrompt && (
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
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--foreground)' }}>Delete Service</h3>
            <p style={{ opacity: 0.8, marginBottom: '2rem', color: 'var(--foreground)' }}>
              Are you sure you want to delete {deletePrompt}? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="secondary-btn animate-tap" 
                onClick={() => setDeletePrompt(null)} 
                disabled={isDeleting}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Cancel
              </button>
              <button 
                className="primary-btn animate-tap" 
                onClick={handleDelete} 
                disabled={isDeleting}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: '#e74c3c', color: '#fff', border: 'none' }}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
