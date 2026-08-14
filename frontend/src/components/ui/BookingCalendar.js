'use client';

import { useState, useEffect } from 'react';
import './BookingCalendar.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookingCalendar({ 
  selectedDate, 
  onSelectDate, 
  slots, 
  loadingSlots, 
  selectedSlot, 
  onSelectSlot 
}) {
  // Current month being viewed
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  // Sync viewed month with selected date when it changes externally
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (dateStr) => {
    onSelectDate(dateStr);
  };

  const handleSlotClick = (slot) => {
    onSelectSlot(slot);
  };

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month (0 = Sun, 1 = Mon, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    // Total days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];

    // Empty slots before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day-empty" />);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      
      // Format as YYYY-MM-DD
      const localFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const isPast = currentDate < today;
      const isToday = currentDate.getTime() === today.getTime();
      const isSelected = selectedDate === localFormatted;

      days.push(
        <button
          key={`day-${day}`}
          className={`calendar-day-btn ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
          onClick={() => handleDateClick(localFormatted)}
          disabled={isPast}
          type="button"
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="booking-calendar-wrapper fade-in-content">
      {/* LEFT: Calendar Section */}
      <div className="calendar-section">
        <div className="calendar-header">
          <button 
            className="calendar-nav-btn" 
            onClick={handlePrevMonth} 
            type="button"
            disabled={currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          
          <div className="calendar-month-title">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          
          <button className="calendar-nav-btn" onClick={handleNextMonth} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div className="calendar-grid">
          {DAYS.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {renderCalendarDays()}
        </div>
      </div>

      {/* RIGHT: Time Slots Section */}
      {selectedDate && (
        <div className="time-slots-section fade-in-content">
          <div className="time-slots-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Available Times
          </div>
          
          {loadingSlots ? (
            <div className="empty-slots-msg">
              <div className="spinner"></div>
              <p>Finding slots...</p>
            </div>
          ) : slots.length > 0 ? (
            <div className="time-slots-grid">
              {slots.map((slot, index) => {
                const isSelected = selectedSlot?._id === slot._id;
                // Add staggered animation delay
                const animDelay = `${index * 0.05}s`;
                
                return (
                  <button
                    key={slot._id}
                    className={`time-slot-btn ${isSelected ? 'is-selected' : ''}`}
                    style={{ animationDelay: animDelay }}
                    onClick={() => handleSlotClick(slot)}
                    type="button"
                  >
                    {slot.startTime}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-slots-msg">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <p>No available times for<br/>{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
