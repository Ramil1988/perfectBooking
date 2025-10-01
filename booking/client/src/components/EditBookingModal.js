import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EditBookingModal({ booking, onClose, onBookingUpdated, onBookingDeleted }) {
  const [formData, setFormData] = useState({
    service_name: booking.service_name,
    appointment_date: booking.appointment_date,
    appointment_time: booking.appointment_time,
    duration: booking.duration,
    notes: booking.notes || ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const services = [
    'Consultation',
    'Hair Cut',
    'Massage',
    'Medical Checkup',
    'Dental Cleaning',
    'Personal Training',
    'Business Meeting',
    'Other'
  ];

  useEffect(() => {
    if (formData.appointment_date) {
      fetchAvailableSlots();
    }
  }, [formData.appointment_date]);

  const fetchAvailableSlots = async () => {
    try {
      const response = await axios.get(`/api/bookings/available-slots?date=${formData.appointment_date}`);
      // Include the current booking's time slot since it's being edited
      const slots = [...response.data.availableSlots];
      if (!slots.includes(booking.appointment_time)) {
        slots.push(booking.appointment_time);
        slots.sort();
      }
      setAvailableSlots(slots);
    } catch (error) {
      setError('Error fetching available time slots');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, set status to confirmed when editing
      const updateData = {
        ...formData,
        status: 'confirmed'
      };
      
      const response = await axios.put(`/api/bookings/${booking.id}`, updateData);
      onBookingUpdated(response.data.booking);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating booking');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this appointment? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.delete(`/api/bookings/${booking.id}`);
      onBookingDeleted(booking.id);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting booking');
      setLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90%',
        overflowY: 'auto'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Edit Appointment</h3>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="service_name">Service</label>
            <select
              id="service_name"
              name="service_name"
              value={formData.service_name}
              onChange={handleChange}
              required
            >
              {services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="appointment_date">Date</label>
            <input
              type="date"
              id="appointment_date"
              name="appointment_date"
              value={formData.appointment_date}
              onChange={handleChange}
              min={getTomorrowDate()}
              required
            />
          </div>

          {formData.appointment_date && availableSlots.length > 0 && (
            <div className="form-group">
              <label>Available Time Slots</label>
              <div className="time-slots">
                {availableSlots.map(slot => (
                  <div
                    key={slot}
                    className={`time-slot ${formData.appointment_time === slot ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, appointment_time: slot})}
                  >
                    {formatTime(slot)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.appointment_date && availableSlots.length === 0 && (
            <div className="alert alert-error">
              No available time slots for this date. Please choose another date.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes)</label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special requirements or notes..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="submit" 
              className="btn" 
              disabled={loading || !formData.appointment_time}
              style={{ flex: 1 }}
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
            <button 
              type="button" 
              className=""
              onClick={handleDelete}
              disabled={loading}
              style={{ 
                backgroundColor: '#e74c3c', 
                color: 'white',
                border: '1px solid #e74c3c',
                transition: 'all 0.3s ease',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'inline-block',
                outline: 'none'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#c0392b';
                  e.target.style.borderColor = '#c0392b';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#e74c3c';
                  e.target.style.borderColor = '#e74c3c';
                }
              }}
            >
              Delete
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditBookingModal;