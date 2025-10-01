import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function BookingWizard({ user }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
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
    { 
      name: 'Consultation', 
      duration: 60, 
      description: 'Professional consultation session',
      price: '$100'
    },
    { 
      name: 'Hair Cut', 
      duration: 45, 
      description: 'Professional hair cutting service',
      price: '$80'
    },
    { 
      name: 'Massage', 
      duration: 90, 
      description: 'Relaxing therapeutic massage',
      price: '$120'
    },
    { 
      name: 'Medical Checkup', 
      duration: 30, 
      description: 'Comprehensive health checkup',
      price: '$200'
    },
    { 
      name: 'Dental Cleaning', 
      duration: 60, 
      description: 'Professional dental cleaning',
      price: '$150'
    },
    { 
      name: 'Personal Training', 
      duration: 60, 
      description: 'One-on-one fitness training',
      price: '$90'
    }
  ];

  const steps = [
    { number: 1, title: 'Select Service', icon: '🎯' },
    { number: 2, title: 'Choose Date', icon: '📅' },
    { number: 3, title: 'Pick Time', icon: '⏰' },
    { number: 4, title: 'Confirm Details', icon: '✅' }
  ];

  useEffect(() => {
    if (currentStep === 3 && formData.appointment_date) {
      fetchAvailableSlots();
    }
  }, [currentStep, formData.appointment_date]);

  const fetchAvailableSlots = async () => {
    try {
      const response = await axios.get(`/api/bookings/available-slots?date=${formData.appointment_date}`);
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      setError('Error fetching available time slots');
    }
  };

  const handleServiceSelect = (service) => {
    setFormData({
      ...formData,
      service_name: service.name,
      duration: service.duration
    });
    setCurrentStep(2);
  };

  const handleDateSelect = (date) => {
    setFormData({
      ...formData,
      appointment_date: date,
      appointment_time: '' // Reset time when date changes
    });
    setCurrentStep(3);
  };

  const handleTimeSelect = (time) => {
    setFormData({
      ...formData,
      appointment_time: time
    });
    setCurrentStep(4);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/bookings', formData);
      setSuccess('Booking confirmed successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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

  const selectedService = services.find(s => s.name === formData.service_name);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Progress Steps */}
      <div className="card" style={{ marginBottom: '32px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          {/* Progress Line */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '0',
            right: '0',
            height: '2px',
            background: '#e5e7eb',
            zIndex: 1
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(135deg, #2EABE2 0%, #1e8db8 100%)',
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
          
          {steps.map((step) => (
            <div key={step.number} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: currentStep >= step.number 
                  ? 'linear-gradient(135deg, #2EABE2 0%, #1e8db8 100%)'
                  : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: currentStep >= step.number 
                  ? '0 4px 14px rgba(46, 171, 226, 0.25)'
                  : 'none'
              }}>
                {currentStep > step.number ? '✓' : step.icon}
              </div>
              <span style={{
                marginTop: '8px',
                fontSize: '12px',
                fontWeight: '600',
                color: currentStep >= step.number ? '#1e293b' : '#64748b',
                textAlign: 'center'
              }}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error/Success Messages */}
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

      {/* Step Content */}
      <div className="card">
        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: '700' }}>
              Choose Your Service
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '20px' 
            }}>
              {services.map((service) => (
                <div
                  key={service.name}
                  onClick={() => handleServiceSelect(service)}
                  style={{
                    padding: '24px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: '#ffffff',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2EABE2';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(46, 171, 226, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                      {service.name}
                    </h3>
                    <span style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: '#2EABE2',
                      background: 'rgba(46, 171, 226, 0.1)',
                      padding: '4px 12px',
                      borderRadius: '20px'
                    }}>
                      {service.price}
                    </span>
                  </div>
                  <p style={{ color: '#64748b', marginBottom: '12px', fontSize: '14px' }}>
                    {service.description}
                  </p>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px'
                  }}>
                    <span>⏱️ {service.duration} minutes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Date Selection */}
        {currentStep === 2 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                Select Date
              </h2>
              <p style={{ color: '#64748b' }}>
                Service: <strong style={{ color: '#2EABE2' }}>{formData.service_name}</strong>
              </p>
            </div>
            
            <div style={{ maxWidth: '400px' }}>
              <input
                type="date"
                value={formData.appointment_date}
                onChange={(e) => handleDateSelect(e.target.value)}
                min={getTomorrowDate()}
                style={{
                  width: '100%',
                  padding: '20px',
                  fontSize: '18px',
                  borderRadius: '16px',
                  border: '2px solid #e5e7eb',
                  background: '#ffffff'
                }}
              />
            </div>
            
            <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Time Selection */}
        {currentStep === 3 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                Choose Time
              </h2>
              <p style={{ color: '#64748b' }}>
                {formatDate(formData.appointment_date)} • {formData.service_name}
              </p>
            </div>
            
            {availableSlots.length > 0 ? (
              <div className="time-slots">
                {availableSlots.map(slot => (
                  <div
                    key={slot}
                    className={`time-slot ${formData.appointment_time === slot ? 'selected' : ''}`}
                    onClick={() => handleTimeSelect(slot)}
                  >
                    {formatTime(slot)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-error">
                No available time slots for this date. Please choose another date.
              </div>
            )}
            
            <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '32px' }}>
              Confirm Your Booking
            </h2>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              padding: '24px',
              borderRadius: '16px',
              marginBottom: '32px'
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Service:</span>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>{formData.service_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Date:</span>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>{formatDate(formData.appointment_date)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Time:</span>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>{formatTime(formData.appointment_time)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Duration:</span>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>{formData.duration} minutes</span>
                </div>
                {selectedService && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', color: '#64748b' }}>Price:</span>
                    <span style={{ fontWeight: '700', color: '#2EABE2', fontSize: '18px' }}>{selectedService.price}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes (Optional)</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any special requirements or notes..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
              <button 
                onClick={() => setCurrentStep(3)}
                className="btn btn-secondary"
              >
                ← Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="btn"
                style={{ flex: 1 }}
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingWizard;