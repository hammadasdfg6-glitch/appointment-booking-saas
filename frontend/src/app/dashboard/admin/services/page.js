'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/utils/api';
import '../admin.css';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: 30,
    price: 0,
    active: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  
  // Delete Modal state
  const [deletePrompt, setDeletePrompt] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    try {
      const data = await apiFetch('/api/service');
      setServices(data.services || []);
      setError(null);
    } catch (err) {
      if (err.message.includes('No Services Found')) {
         setServices([]);
         setError(null);
      } else {
         setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingService) {
        // Assuming PUT /api/service/:name
        await apiFetch(`/api/service/${encodeURIComponent(editingService.name)}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/api/service/create', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsFormOpen(false);
      fetchServices();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openForm = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        durationMinutes: service.durationMinutes,
        price: service.price,
        active: service.active !== false
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        durationMinutes: 30,
        price: 0,
        active: true
      });
    }
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletePrompt) return;
    setIsDeleting(true);
    
    try {
      await apiFetch(`/api/service/${encodeURIComponent(deletePrompt)}`, {
        method: 'DELETE'
      });
      fetchServices();
      setDeletePrompt(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="admin-header">
        <h1>Manage Services</h1>
        {!isFormOpen && (
          <button className="btn-primary animate-tap" onClick={() => openForm()}>
            + Add New Service
          </button>
        )}
      </div>

      {error && <div className="error-message fade-in">{error}</div>}

      {isFormOpen ? (
        <div className="fade-in" style={{ maxWidth: '600px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', padding: '2rem', borderRadius: '12px' }}>
          <h2>{editingService ? 'Edit Service' : 'Create New Service'}</h2>
          {formError && <div className="error-message" style={{marginBottom: '1rem'}}>{formError}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label>Service Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="input-field"
                disabled={!!editingService}
                placeholder="e.g. Legal Consultation"
              />
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input-field"
                rows={3}
                placeholder="Describe the service..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Duration (Minutes) *</label>
                <input
                  type="number"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="input-field"
                />
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <label>Price ($) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="input-field"
                />
              </div>
            </div>

            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                id="activeCheckbox"
              />
              <label htmlFor="activeCheckbox" style={{ marginBottom: 0 }}>Active</label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" disabled={formLoading} style={{ flex: 1 }}>
                {formLoading ? 'Saving...' : 'Save Service'}
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
                <p>Loading services...</p>
              ) : services.length > 0 ? (
                services.map(svc => (
                  <div key={svc._id} className="service-card animate-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="svc-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>{svc.name}</h3>
                        {!svc.active && <span className="badge badge-cancelled">Inactive</span>}
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        {svc.description || 'No description provided.'}
                      </p>
                      <p style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                        ${svc.price} / {svc.durationMinutes} min
                      </p>
                    </div>
                    <div className="svc-actions" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="secondary-btn" 
                        onClick={() => openForm(svc)} 
                        style={{ flex: 1, textAlign: 'center', padding: '0.5rem', fontSize: '0.85rem' }}
                      >
                        Edit
                      </button>
                      <button 
                        className="secondary-btn" 
                        onClick={() => setDeletePrompt(svc.name)} 
                        style={{ flex: 1, textAlign: 'center', padding: '0.5rem', fontSize: '0.85rem', borderColor: 'var(--error-color)', color: 'var(--error-color)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <p style={{ opacity: 0.7, marginBottom: '1rem' }}>You don't have any services yet.</p>
                  <button className="btn-primary animate-tap" onClick={() => openForm()}>Create your first service</button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

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
