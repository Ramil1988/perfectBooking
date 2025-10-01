import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useBusinessContext } from '../contexts/BusinessContext';

function WorkingCalendarView({ user }) {
  const { businessConfig } = useBusinessContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayBookings, setDayBookings] = useState([]);

  useEffect(() => {
    console.log('WorkingCalendarView: Component mounted, businessConfig:', businessConfig?.id);
    if (businessConfig?.id) {
      fetchBookings();
    }
  }, [businessConfig]);

  const fetchBookings = async () => {
    try {
      console.log('WorkingCalendarView: Fetching bookings for business type:', businessConfig?.id);
      const response = await axios.get('/api/bookings');
      console.log('WorkingCalendarView: Raw bookings response:', response.data);
      
      const filtered = response.data.bookings.filter(booking => 
        booking.business_type === businessConfig?.id
      );
      console.log(`WorkingCalendarView: Filtered ${filtered.length} bookings:`, filtered);
      
      setBookings(filtered);
      setLoading(false);
    } catch (error) {
      console.error('WorkingCalendarView: Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const getBookingsForDate = (date) => {
    if (!date) return [];
    const dateStr = formatDate(date);
    return bookings.filter(booking => booking.appointment_date === dateStr);
  };

  const handleDateClick = (date) => {
    if (!date) return;
    const dateBookings = getBookingsForDate(date);
    setSelectedDate(date);
    setDayBookings(dateBookings);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '20px' }}>
      <h2>Calendar - {businessConfig?.name}</h2>
      
      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => navigateMonth(-1)} style={{ padding: '10px 15px' }}>
          ← Previous
        </button>
        <h3>{monthYear}</h3>
        <button onClick={() => navigateMonth(1)} style={{ padding: '10px 15px' }}>
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#ddd' }}>
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ 
            padding: '10px', 
            backgroundColor: 'white', 
            textAlign: 'center', 
            fontWeight: 'bold' 
          }}>
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map((date, index) => {
          const dateBookings = date ? getBookingsForDate(date) : [];
          const hasBookings = dateBookings.length > 0;
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              style={{
                padding: '10px',
                backgroundColor: 'white',
                minHeight: '60px',
                cursor: date ? 'pointer' : 'default',
                border: selectedDate && date && formatDate(selectedDate) === formatDate(date) ? '2px solid #007bff' : 'none',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {date && (
                <>
                  <div style={{ fontWeight: hasBookings ? 'bold' : 'normal' }}>
                    {date.getDate()}
                  </div>
                  {hasBookings && (
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#dc3545', 
                      fontWeight: 'bold',
                      marginTop: '5px'
                    }}>
                      {dateBookings.length} booking{dateBookings.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Bookings for {selectedDate.toLocaleDateString()}</h3>
          {dayBookings.length === 0 ? (
            <p>No bookings for this date</p>
          ) : (
            dayBookings.map(booking => (
              <div key={booking.id} style={{ 
                padding: '15px', 
                margin: '10px 0', 
                border: '2px solid #dc3545',
                borderRadius: '8px',
                backgroundColor: '#f8d7da',
                cursor: 'pointer'
              }}
              onClick={() => {
                console.log('Clicked on booked slot:', booking);
                // Here you can add logic to edit the booking
              }}>
                <h4 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>BOOKED SLOT</h4>
                <strong>{booking.customer_name}</strong> - {booking.service_name}
                <br />
                Time: {booking.appointment_time} ({booking.duration} minutes)
                {booking.staff_id && <><br />Staff ID: {booking.staff_id}</>}
                <br />
                <small>Click to edit this booking</small>
              </div>
            ))
          )}
        </div>
      )}

      {/* Debug Info */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'white', fontSize: '12px', border: '1px solid #e9ecef' }}>
        <strong>Debug Info:</strong>
        <div>Total bookings: {bookings.length}</div>
        <div>Business type: {businessConfig?.id}</div>
        {bookings.length > 0 && (
          <div>Next booking: {bookings[0]?.customer_name} on {bookings[0]?.appointment_date}</div>
        )}
      </div>
    </div>
  );
}

export default WorkingCalendarView;