import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useBusinessContext } from '../contexts/BusinessContext';

function SimpleCalendar() {
  const { businessConfig } = useBusinessContext();
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState('2025-09-15'); // Hardcoded for testing
  const [dayBookings, setDayBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('SimpleCalendar: Component mounted, businessConfig:', businessConfig?.id);
    fetchBookings();
  }, [businessConfig]);

  const fetchBookings = async () => {
    try {
      console.log('SimpleCalendar: Fetching all bookings...');
      const response = await axios.get('/api/bookings');
      console.log('SimpleCalendar: Raw bookings response:', response.data);
      
      const filtered = response.data.bookings.filter(booking => 
        booking.business_type === businessConfig?.id
      );
      console.log(`SimpleCalendar: Filtered ${filtered.length} bookings:`, filtered);
      
      setBookings(filtered);
      
      // Filter for selected date
      const dayFiltered = filtered.filter(booking => booking.appointment_date === selectedDate);
      console.log(`SimpleCalendar: Day bookings for ${selectedDate}:`, dayFiltered);
      setDayBookings(dayFiltered);
      
      setLoading(false);
    } catch (error) {
      console.error('SimpleCalendar: Error fetching bookings:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Simple Calendar - {businessConfig?.name}</h2>
      <p>Date: {selectedDate}</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>All Bookings ({bookings.length})</h3>
        {bookings.length === 0 ? (
          <p>No bookings found for {businessConfig?.name}</p>
        ) : (
          <div>
            {bookings.map(booking => (
              <div key={booking.id} style={{ 
                padding: '10px', 
                margin: '5px 0', 
                border: '1px solid #ccc',
                borderRadius: '5px',
                backgroundColor: '#f9f9f9'
              }}>
                <strong>#{booking.id}</strong> - {booking.customer_name} - {booking.service_name}
                <br />
                Date: {booking.appointment_date}, Time: {booking.appointment_time}, Duration: {booking.duration}min
                <br />
                Staff ID: {booking.staff_id}, Business: {booking.business_type}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3>Bookings for {selectedDate} ({dayBookings.length})</h3>
        {dayBookings.length === 0 ? (
          <p>No bookings for this date</p>
        ) : (
          <div>
            {dayBookings.map(booking => (
              <div key={booking.id} style={{ 
                padding: '15px', 
                margin: '10px 0', 
                border: '2px solid #ff6b6b',
                borderRadius: '8px',
                backgroundColor: '#ffe8e8'
              }}>
                <h4>BOOKED SLOT</h4>
                <strong>{booking.customer_name}</strong> - {booking.service_name}
                <br />
                Time: {booking.appointment_time} ({booking.duration} minutes)
                <br />
                Staff ID: {booking.staff_id}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleCalendar;