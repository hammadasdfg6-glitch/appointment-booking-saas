'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/utils/api';
import '../admin.css';

export default function AdminStats() {
  const [totalStats, setTotalStats] = useState(null);
  const [advancedStats, setAdvancedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [totalRes, advancedRes] = await Promise.all([
          apiFetch('/api/stats').catch(e => { console.error(e); return {}; }),
          apiFetch('/api/stats/advanced').catch(e => { console.error(e); return { data: {} }; })
        ]);

        setTotalStats(totalRes);
        setAdvancedStats(advancedRes.data);
      } catch (err) {
        setError("Failed to load statistics.");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="admin-header fade-in">
          <h1>System Statistics</h1>
          <p className="text-muted">Loading metrics...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin">
        <div className="admin-header fade-in">
          <h1>System Statistics</h1>
        </div>
        <div className="error-message fade-in">{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="admin-header fade-in">
        <h1>Comprehensive Statistics</h1>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Detailed breakdown of all your platform metrics.</p>
      </div>

      <div className="dashboard-grid fade-in">
        
        {/* Revenue & Bookings Performance */}
        <section className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
          <div className="section-header">
            <h2>Performance Trends</h2>
          </div>
          <div className="stats-panel" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            
            {/* Revenue Today */}
            <div className="stat-card animate-hover" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="stat-title">Revenue (Today)</div>
              <div className="stat-value">${advancedStats?.today?.revenue || 0}</div>
              <div className="stat-trend text-muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                vs Yesterday
              </div>
            </div>

            {/* Bookings Today */}
            <div className="stat-card animate-hover">
              <div className="stat-title">Bookings (Today)</div>
              <div className="stat-value">{advancedStats?.today?.bookings || 0}</div>
              <div className={`stat-trend ${Number(advancedStats?.comparisons?.bookingTodayVsTomorrow) >= 0 ? 'positive' : 'negative'}`} style={{ marginTop: '0.5rem' }}>
                {Number(advancedStats?.comparisons?.bookingTodayVsTomorrow) >= 0 ? '+' : ''}{advancedStats?.comparisons?.bookingTodayVsTomorrow || 0}% vs Tomorrow
              </div>
            </div>

            {/* Weekly Revenue Growth */}
            <div className="stat-card animate-hover">
              <div className="stat-title">Weekly Revenue Growth</div>
              <div className={`stat-value ${Number(advancedStats?.comparisons?.revenueThisWeekVsLastWeek) >= 0 ? 'text-green' : 'text-red'}`} style={{ fontSize: '2rem' }}>
                {Number(advancedStats?.comparisons?.revenueThisWeekVsLastWeek) >= 0 ? '+' : ''}{advancedStats?.comparisons?.revenueThisWeekVsLastWeek || 0}%
              </div>
              <div className="stat-trend text-muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                This week vs Last week
              </div>
            </div>

            {/* Monthly Revenue Growth */}
            <div className="stat-card animate-hover">
              <div className="stat-title">Monthly Revenue Growth</div>
              <div className={`stat-value ${Number(advancedStats?.comparisons?.revenueThisMonthVsLastMonth) >= 0 ? 'text-green' : 'text-red'}`} style={{ fontSize: '2rem' }}>
                {Number(advancedStats?.comparisons?.revenueThisMonthVsLastMonth) >= 0 ? '+' : ''}{advancedStats?.comparisons?.revenueThisMonthVsLastMonth || 0}%
              </div>
              <div className="stat-trend text-muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                This month vs Last month
              </div>
            </div>

          </div>
        </section>

        {/* System Totals */}
        <section className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
          <div className="section-header">
            <h2>Overall System Totals</h2>
          </div>
          <div style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem'
          }}>
            <div className="stat-card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="stat-value" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{totalStats?.totalCustomers || 0}</div>
              <div className="stat-title" style={{ marginTop: '0.5rem' }}>Total Customers</div>
            </div>
            
            <div className="stat-card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="stat-value" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{totalStats?.totalStaff || 0}</div>
              <div className="stat-title" style={{ marginTop: '0.5rem' }}>Total Staff</div>
            </div>
            
            <div className="stat-card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="stat-value" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{totalStats?.totalServices || 0}</div>
              <div className="stat-title" style={{ marginTop: '0.5rem' }}>Total Services</div>
            </div>
            
            <div className="stat-card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="stat-value" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{totalStats?.totalBookings || 0}</div>
              <div className="stat-title" style={{ marginTop: '0.5rem' }}>Total Bookings</div>
            </div>
            
            <div className="stat-card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="stat-value" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{totalStats?.totalSlots || 0}</div>
              <div className="stat-title" style={{ marginTop: '0.5rem' }}>Total Slots</div>
            </div>

            <div className="stat-card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="stat-value" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{totalStats?.totalAvailabilities || 0}</div>
              <div className="stat-title" style={{ marginTop: '0.5rem' }}>Availabilities</div>
            </div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
