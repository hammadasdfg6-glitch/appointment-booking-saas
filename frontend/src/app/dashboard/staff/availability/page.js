'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/utils/api';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import CustomTimePicker from '@/components/ui/CustomTimePicker';
import '../../admin/admin.css';

export default function StaffAvailability() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const dayOfWeek = new Date(formData.date).getDay();
      
      try {
        await apiFetch('/api/availiability', {
          method: 'POST',
          body: JSON.stringify({
            dayOfWeek,
            startTime: formData.startTime,
            endTime: formData.endTime
          })
        });
      } catch (availErr) {
        if (!availErr.message.includes('already exists')) {
          throw availErr;
        }
      }

      await apiFetch('/api/availiability/generate-slots', {
        method: 'POST',
        body: JSON.stringify({
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime
        })
      });
      setSuccess('Successfully generated slots for ' + formData.date);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="staff">
      <div className="admin-header fade-in" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(90deg, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Manage Availability
        </h1>
        <p style={{ opacity: 0.7, fontSize: '1.1rem', marginTop: '0.5rem' }}>
          Define your working hours to automatically generate bookable slots for your clients.
        </p>
      </div>

      <div className="dashboard-grid fade-in">
        <section className="dashboard-section" style={{ gridColumn: '1 / -1', maxWidth: '650px', margin: '0 auto', width: '100%' }}>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Generate Slots
            </h2>
            
            {error && (
              <div className="error-message fade-in" style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message fade-in" style={{ color: 'var(--bg-color)', margin: '1rem 0', padding: '1rem', background: 'var(--accent)', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                {success}
              </div>
            )}
            
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div className="input-group" style={{ zIndex: 10 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Target Date</label>
                <CustomDatePicker 
                  value={formData.date}
                  onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', zIndex: 5 }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Start Time</label>
                  <CustomTimePicker 
                    value={formData.startTime}
                    onChange={(val) => setFormData(prev => ({ ...prev, startTime: val }))}
                  />
                </div>

                <div className="input-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>End Time</label>
                  <CustomTimePicker 
                    value={formData.endTime}
                    onChange={(val) => setFormData(prev => ({ ...prev, endTime: val }))}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="animate-tap"
                style={{ 
                  marginTop: '1rem',
                  width: '100%',
                  padding: '1rem',
                  background: 'var(--accent)',
                  color: 'var(--bg-color)',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                      <path d="M12 2a10 10 0 0 1 10 10"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                    Generate Bookable Slots
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </DashboardLayout>
  );
}
