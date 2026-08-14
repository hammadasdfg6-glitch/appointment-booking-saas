'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/utils/api';
import '../admin/admin.css'; 

export default function StaffOverview() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    upcomingBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStaffData() {
      try {
        const data = await apiFetch('/api/booking');
        const bookings = data.bookings || [];
        
        const today = new Date().toISOString().split('T')[0];
        
        const todayBookings = bookings.filter(b => b.date === today && b.status !== 'cancelled').length;
        const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;

        setStats({
          todayBookings,
          upcomingBookings
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStaffData();
  }, []);

  return (
    <DashboardLayout role="staff">
      <div className="admin-header fade-in">
        <h1>Staff Dashboard</h1>
        <p style={{ opacity: 0.7 }}>Welcome back! Here's a quick look at your schedule.</p>
      </div>

      <div className="dashboard-grid fade-in">
        <div className="stat-card">
          <h3>Today's Bookings</h3>
          {loading ? <p>...</p> : <div className="stat-value">{stats.todayBookings}</div>}
        </div>
        <div className="stat-card">
          <h3>Total Upcoming</h3>
          {loading ? <p>...</p> : <div className="stat-value">{stats.upcomingBookings}</div>}
        </div>
      </div>
      
      <div className="dashboard-grid fade-in" style={{ marginTop: '2rem' }}>
         <section className="dashboard-section" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: 'var(--surface-color)', borderRadius: '12px' }}>
            <h2 style={{ marginBottom: '1rem' }}>Ready for the day?</h2>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Make sure you've generated your availability slots so customers can book you.</p>
            <a href="/dashboard/staff/availability" className="btn-primary animate-tap" style={{ textDecoration: 'none' }}>Manage Availability</a>
         </section>
      </div>
    </DashboardLayout>
  );
}
