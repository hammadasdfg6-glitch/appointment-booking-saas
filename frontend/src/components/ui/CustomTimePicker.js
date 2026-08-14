'use client';
import { useState, useRef, useEffect } from 'react';
import './picker.css';

export default function CustomTimePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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

  const handleSelectTime = (time, e) => {
    e.preventDefault();
    onChange(time);
    setIsOpen(false);
  };

  // Generate time slots (e.g., every 30 minutes)
  const timeSlots = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      timeSlots.push(`${hh}:${mm}`);
    }
  }

  // Format display value
  const displayValue = value ? (() => {
    let [h, m] = value.split(':');
    h = parseInt(h, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${m} ${suffix}`;
  })() : 'Select Time';

  return (
    <div className="custom-picker-container" ref={containerRef}>
      <div 
        className={`custom-picker-input ${isOpen ? 'focused' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{displayValue}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
           <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className="custom-picker-dropdown fade-scale-in" style={{ padding: '0', maxHeight: '250px', overflowY: 'auto' }}>
          <div className="time-grid">
            {timeSlots.map(time => {
              let [h, m] = time.split(':');
              h = parseInt(h, 10);
              const suffix = h >= 12 ? 'PM' : 'AM';
              const hour12 = h % 12 || 12;
              const formattedTime = `${String(hour12).padStart(2, '0')}:${m} ${suffix}`;
              const isSelected = value === time;
              
              return (
                <button 
                  key={time} 
                  className={`time-slot ${isSelected ? 'selected' : ''} animate-tap`}
                  onClick={(e) => handleSelectTime(time, e)}
                  type="button"
                >
                  {formattedTime}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
