import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingsAPI } from '../utils/api';

function BookingForm({ user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    service_name: '',
    appointment_date: '',
    appointment_time: '',
    duration: 60,
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const data = await bookingsAPI.getAvailableSlots(formData.appointment_date);
      setAvailableSlots(data.availableSlots);
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

  const handleTimeSlotClick = (time) => {
    setFormData({
      ...formData,
      appointment_time: time
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await bookingsAPI.create(formData);
      setSuccess('Booking created successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '30px' }}>Book an Appointment</h2>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
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
              <option value="">Select a service</option>
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
                    onClick={() => handleTimeSlotClick(slot)}
                  >
                    {slot}
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
            <label htmlFor="notes">Additional Notes (Optional)</label>
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
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingForm;