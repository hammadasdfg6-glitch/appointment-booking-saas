'use client';
import { useState, useRef, useEffect } from 'react';
import './picker.css';

export default function CustomDatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current value
  const currentDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = (e) => {
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDate = (date, e) => {
    e.preventDefault();
    const formatted = date.toISOString().split('T')[0];
    // Check if the timezone messed up the string conversion (e.g. going back a day).
    // The safest way to format local dates without timezone shifting is:
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localFormatted = `${year}-${month}-${day}`;
    
    onChange(localFormatted);
    setIsOpen(false);
  };

  // Generate calendar grid
  const startDay = currentMonth.getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
    
    // Check local formatted date to compare properly
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dFormatted = `${year}-${month}-${day}`;
    
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const isSelected = value === dFormatted;
    const isToday = todayFormatted === dFormatted;
    
    days.push(
      <button 
        key={`day-${i}`} 
        className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''} animate-tap`}
        onClick={(e) => handleSelectDate(d, e)}
        type="button"
      >
        {i}
      </button>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="custom-picker-container" ref={containerRef}>
      <div 
        className={`custom-picker-input ${isOpen ? 'focused' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
            {value ? (() => {
                const parts = value.split('-');
                const d = new Date(parts[0], parts[1]-1, parts[2]);
                return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            })() : 'Select Date'}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
           <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className="custom-picker-dropdown fade-scale-in">
          <div className="calendar-header">
            <button type="button" onClick={handlePrevMonth} className="cal-nav-btn animate-tap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"></path></svg>
            </button>
            <div className="cal-month-year">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</div>
            <button type="button" onClick={handleNextMonth} className="cal-nav-btn animate-tap">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"></path></svg>
            </button>
          </div>
          <div className="calendar-grid">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
            {days}
          </div>
        </div>
      )}
    </div>
  );
}
