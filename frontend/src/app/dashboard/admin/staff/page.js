'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/utils/api';
import '../admin.css';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    passwordHash: '',
    role: 'staff'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/staff');
      setStaff(data.staff || []);
      setError(null);
    } catch (err) {
      if (err.message.includes('Not Found')) {
         setStaff([]);
         setError(null);
      } else {
         setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      // Create new staff
      // API expects req.params.orgId to be present in route, though it uses JWT orgId. We can pass 'me' or anything.
      await apiFetch('/api/auth/orgs/me/staff', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsFormOpen(false);
      setFormData({ name: '', email: '', passwordHash: '', role: 'staff' });
      fetchStaff();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (staffId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your organization?`)) return;
    
    try {
      await apiFetch(`/api/auth/staff/${staffId}`, {
        method: 'DELETE'
      });
      fetchStaff();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="admin-header">
        <h1>Manage Staff</h1>
        {!isFormOpen && (
          <button className="btn-primary animate-tap" onClick={() => setIsFormOpen(true)}>
            + Add Staff Member
          </button>
        )}
      </div>

      {error && <div className="error-message fade-in">{error}</div>}

      {isFormOpen ? (
        <div className="fade-in" style={{ maxWidth: '600px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', padding: '2rem', borderRadius: '12px' }}>
          <h2>Add New Staff Member</h2>
          <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>An email will be sent to notify them.</p>
          {formError && <div className="error-message" style={{marginBottom: '1rem'}}>{formError}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div className="input-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="jane@example.com"
              />
            </div>

            <div className="input-group">
              <label>Temporary Password *</label>
              <input
                type="password"
                name="passwordHash"
                value={formData.passwordHash}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Minimum 4 characters"
                minLength={4}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" disabled={formLoading} style={{ flex: 1 }}>
                {formLoading ? 'Creating...' : 'Create Staff'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)} disabled={formLoading} style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="dashboard-grid fade-in">
          <section className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
            <div className="service-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {loading ? (
                <p>Loading staff...</p>
              ) : staff.length > 0 ? (
                staff.map(member => (
                  <div key={member._id} className="service-card animate-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="svc-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>{member.name}</h3>
                        <span className={`badge badge-${member.role === 'owner' ? 'confirmed' : 'pending'}`}>
                          {member.role === 'owner' ? 'Owner' : 'Staff'}
                        </span>
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        {member.email}
                      </p>
                    </div>
                    <div className="svc-actions" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      {member.role !== 'owner' ? (
                        <button className="btn-icon text-red" onClick={() => handleDelete(member._id, member.name)} style={{ flex: 1, textAlign: 'center' }}>Remove</button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', opacity: 0.5, flex: 1, textAlign: 'center' }}>Owner cannot be removed</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <p style={{ opacity: 0.7, marginBottom: '1rem' }}>You don't have any staff members yet.</p>
                  <button className="btn-primary animate-tap" onClick={() => setIsFormOpen(true)}>Add your first staff member</button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
