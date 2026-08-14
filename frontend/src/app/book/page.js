'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/utils/api';
import BookingCalendar from '@/components/ui/BookingCalendar';
import './book.css';

export default function BookService() {
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [slots, setSlots] = useState([]);
  
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null); // Will store the slot object
  
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  const [error, setError] = useState('');
  // 1. Fetch Services on mount
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await apiFetch('/api/service');
        setServices(res.services || []);
      } catch (err) {
        setError('Failed to load services: ' + err.message);
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  // 2. Fetch Staff when service is selected
  useEffect(() => {
    if (selectedService) {
      setLoadingStaff(true);
      apiFetch('/api/auth/staff')
        .then(res => {
          const bookableStaff = (res.staff || []).filter(s => s.role !== 'owner');
          setStaffList(bookableStaff);
          setSelectedStaff(null);
          setSelectedDate(null);
          setSelectedSlot(null);
        })
        .catch(err => setError('Failed to load staff: ' + err.message))
        .finally(() => setLoadingStaff(false));
    }
  }, [selectedService]);

  // 3. Fetch Slots when staff and date are selected
  useEffect(() => {
    if (selectedStaff && selectedDate) {
      setLoadingSlots(true);
      apiFetch(`/api/availiability/slots?staffId=${selectedStaff}&date=${selectedDate}`)
        .then(res => {
          setSlots(res.slots || []);
          setSelectedSlot(null);
        })
        .catch(err => setError('Failed to load slots: ' + err.message))
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedStaff, selectedDate]);

  const handleCheckout = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedSlot) return;
    
    setCheckoutLoading(true);
    setError('');
    
    try {
      const res = await apiFetch('/api/checkout/session', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedService,
          staffId: selectedStaff,
          date: selectedDate,
          startAt: selectedSlot.startTime,
          slotId: selectedSlot._id
        })
      });
      
      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError('Checkout failed: ' + err.message);
      setCheckoutLoading(false);
    }
  };

  return (
    <DashboardLayout role="customer">
      <div className="booking-header fade-in">
        <h1>Book a Service</h1>
        <p>Select a service, provider, date, and time that works for you.</p>
        {error && <div style={{ color: 'var(--red)', marginTop: '1rem', padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>{error}</div>}
      </div>

      <div className="booking-steps">
        <section className="step-section fade-in">
          <h2>1. Select Service</h2>
          {loadingServices ? <p>Loading services...</p> : (
            <div className="options-grid">
              {services.map(svc => (
                <div 
                  key={svc._id} 
                  className={`option-card animate-hover ${selectedService === svc._id ? 'selected' : ''}`}
                  onClick={() => setSelectedService(svc._id)}
                >
                  <h3>{svc.name}</h3>
                  <div className="svc-meta">
                    <span>{svc.durationMinutes} min</span>
                    <span className="price">${svc.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {selectedService && (
          <section className="step-section fade-in">
            <h2>2. Select Provider</h2>
            {loadingStaff ? <p>Loading providers...</p> : (
              <div className="options-grid">
                {staffList.map(staff => (
                  <div 
                    key={staff._id} 
                    className={`option-card animate-hover ${selectedStaff === staff._id ? 'selected' : ''}`}
                    onClick={() => setSelectedStaff(staff._id)}
                  >
                    <h3>{staff.name}</h3>
                    <div className="svc-meta">
                      <span>{staff.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {selectedStaff && (
          <section className="step-section fade-in">
            <h2>3. Select Date & Time</h2>
            <BookingCalendar 
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              slots={slots}
              loadingSlots={loadingSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
          </section>
        )}

        {selectedSlot && (
          <div className="booking-action fade-in">
            <button 
              className="confirm-book-btn animate-tap" 
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? 'Redirecting to Checkout...' : 'Proceed to Checkout'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
