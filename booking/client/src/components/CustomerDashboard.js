import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import EditBookingModal from './EditBookingModal';

function CustomerDashboard({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBooking, setEditingBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      setError('Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await axios.put(`/api/bookings/${bookingId}`, { status: 'cancelled' });
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      ));
    } catch (error) {
      setError('Error cancelling booking');
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
  };

  const handleBookingUpdated = (updatedBooking) => {
    setBookings(bookings.map(booking => 
      booking.id === updatedBooking.id ? updatedBooking : booking
    ));
  };

  const handleBookingDeleted = (bookingId) => {
    setBookings(bookings.filter(booking => booking.id !== bookingId));
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return <div>Loading your bookings...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>My Appointments</h2>
        <Link to="/book" className="btn">
          Book New Appointment
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="card">
        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              You don't have any appointments yet.
            </p>
            <Link to="/book" className="btn">
              Book Your First Appointment
            </Link>
          </div>
        ) : (
          <div>
            {bookings.map(booking => (
              <div key={booking.id} className="booking-item">
                <div className="booking-header">
                  <div>
                    <h3 style={{ margin: 0, color: '#333' }}>{booking.service_name}</h3>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      {formatDate(booking.appointment_date)} at {formatTime(booking.appointment_time)}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      Duration: {booking.duration} minutes
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`booking-status status-${booking.status}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', fontSize: '14px' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="btn"
                      style={{ padding: '5px 15px', fontSize: '14px' }}
                    >
                      Update
                    </button>
                  </div>
                </div>
                
                {booking.notes && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                    <strong>Notes:</strong> {booking.notes}
                  </div>
                )}
                
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  Booked on: {new Date(booking.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Account Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Name:</strong> {user.name}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          {user.phone && (
            <div>
              <strong>Phone:</strong> {user.phone}
            </div>
          )}
        </div>
      </div>

      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onBookingUpdated={handleBookingUpdated}
          onBookingDeleted={handleBookingDeleted}
        />
      )}
    </div>
  );
}

export default CustomerDashboard;