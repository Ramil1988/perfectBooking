import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function BusinessBookingWizard({ user, businessType }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    service_name: '',
    staff_id: '',
    resource_id: '', // For equipment or other resources
    appointment_date: '',
    appointment_time: '',
    duration: 60,
    notes: '',
    business_type: businessType.id
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dynamic steps based on business type
  const getSteps = () => {
    switch (businessType.id) {
      case 'massage':
        return [
          { number: 1, title: 'Select Service', icon: '💆‍♀️' },
          { number: 2, title: 'Choose Therapist', icon: '👩‍⚕️' },
          { number: 3, title: 'Pick Date & Time', icon: '📅' },
          { number: 4, title: 'Confirm Booking', icon: '✅' }
        ];
      case 'dental':
        return [
          { number: 1, title: 'Select Service', icon: '🦷' },
          { number: 2, title: 'Choose Dentist', icon: '👨‍⚕️' },
          { number: 3, title: 'Pick Date & Time', icon: '📅' },
          { number: 4, title: 'Confirm Appointment', icon: '✅' }
        ];
      default:
        return [];
    }
  };

  const steps = getSteps();

  useEffect(() => {
    if (currentStep === 3 && formData.appointment_date) {
      fetchAvailableSlots();
    }
  }, [currentStep, formData.appointment_date, formData.staff_id]);

  const fetchAvailableSlots = async () => {
    try {
      console.log(`🔍 [FRONTEND] fetchAvailableSlots called - staff_id: ${formData.staff_id}, business_type: ${businessType.id}, date: ${formData.appointment_date}`);
      
      if (formData.staff_id && (businessType.id === 'dental' || businessType.id === 'massage')) {
        // For dental and massage specialists, get their specific availability
        const url = `/api/specialists/${formData.staff_id}/availability?date=${formData.appointment_date}`;
        console.log(`🔍 [FRONTEND] Making ${businessType.id} specialist request to: ${url}`);

        const response = await axios.get(url);
        console.log(`🔍 [FRONTEND] Response data:`, response.data);

        // Extract only available time slots
        const availableSlots = response.data.availability
          ?.filter(slot => slot.available)
          ?.map(slot => slot.time) || [];

        console.log(`🔍 [FRONTEND] Available slots:`, availableSlots);
        setAvailableSlots(availableSlots);
      } else {
        // Fallback to general available slots
        console.log(`🔍 [FRONTEND] Using fallback general slots endpoint`);
        const response = await axios.get(`/api/bookings/available-slots?date=${formData.appointment_date}`);
        setAvailableSlots(response.data.availableSlots);
      }
    } catch (error) {
      console.error('🔍 [FRONTEND] Error fetching available time slots:', error);
      setError('Error fetching available time slots');
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const bookingData = {
        ...formData,
        // Add business-specific metadata
        metadata: {
          business_type: businessType.id,
          staff_name: businessType.staff?.find(s => s.id === formData.staff_id)?.name
        }
      };

      const response = await axios.post('/api/bookings', bookingData);
      setSuccess(getSuccessMessage());
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  const getSuccessMessage = () => {
    switch (businessType.id) {
      case 'massage':
        return 'Your massage appointment has been confirmed!';
      case 'dental':
        return 'Your dental appointment has been booked!';
      default:
        return 'Your booking has been confirmed!';
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

  const selectedService = businessType.services.find(s => s.name === formData.service_name);
  const selectedStaff = businessType.staff?.find(s => s.id === formData.staff_id);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Business Type Header */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <span style={{ fontSize: '32px' }}>{businessType.icon}</span>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700',
            color: businessType.color,
            margin: 0
          }}>
            {businessType.name}
          </h2>
        </div>
        <p style={{ color: '#64748b', margin: '8px 0 0 0' }}>
          {businessType.description}
        </p>
      </div>

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
              background: `linear-gradient(135deg, ${businessType.color} 0%, ${businessType.color}aa 100%)`,
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
                  ? `linear-gradient(135deg, ${businessType.color} 0%, ${businessType.color}aa 100%)`
                  : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: currentStep >= step.number 
                  ? `0 4px 14px ${businessType.color}40`
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
              Select Service
            </h2>
            
            {/* Service Selection */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '20px' 
            }}>
              {businessType.services.map((service) => (
                <div
                  key={service.name}
                  onClick={() => {
                    setFormData({
                      ...formData, 
                      service_name: service.name,
                      duration: service.duration
                    });
                    handleNext();
                  }}
                  style={{
                    padding: '24px',
                    border: formData.service_name === service.name ? `2px solid ${businessType.color}` : '2px solid #e5e7eb',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: formData.service_name === service.name ? `${businessType.color}10` : '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = businessType.color;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 12px 40px ${businessType.color}15`;
                  }}
                  onMouseLeave={(e) => {
                    if (formData.service_name !== service.name) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                      {service.name}
                    </h3>
                    <span style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: businessType.color,
                      background: `${businessType.color}20`,
                      padding: '4px 12px',
                      borderRadius: '20px'
                    }}>
                      {service.price}
                    </span>
                  </div>
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

        {/* Step 2: Staff Selection */}
        {currentStep === 2 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                Choose Your {businessType.id === 'massage' ? 'Therapist' : 'Dentist'}
              </h2>
              <p style={{ color: '#64748b' }}>
                Service: <strong style={{ color: businessType.color }}>{formData.service_name}</strong>
              </p>
            </div>
            
            {/* Staff selection */}
            {(() => {
              const filteredStaff = businessType.staff.filter(staff => {
                // Filter staff based on selected service
                if (!formData.service_name) return true;

                // Service to specialty mapping
                const serviceSpecialtyMap = {
                  'Swedish Massage': 'Swedish & Relaxation',
                  'Deep Tissue Massage': 'Deep Tissue',
                  'Hot Stone Massage': 'Hot Stone',
                  'Sports Massage': 'Sports Massage',
                  'Prenatal Massage': 'Swedish & Relaxation' // Default to Swedish for now
                };

                const requiredSpecialty = serviceSpecialtyMap[formData.service_name];
                return !requiredSpecialty || staff.specialty === requiredSpecialty;
              });

              if (filteredStaff.length === 0) {
                return (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <p style={{ color: '#64748b', margin: 0 }}>
                      No specialists available for {formData.service_name}. Please select a different service.
                    </p>
                  </div>
                );
              }

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px'
                }}>
                  {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => {
                    setFormData({...formData, staff_id: staff.id});
                    handleNext();
                  }}
                  style={{
                    padding: '24px',
                    border: formData.staff_id === staff.id ? `2px solid ${businessType.color}` : '2px solid #e5e7eb',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: formData.staff_id === staff.id ? `${businessType.color}10` : '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                      {staff.name}
                    </h3>
                    <div style={{ 
                      background: `${businessType.color}20`,
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: businessType.color
                    }}>
                      ⭐ {staff.rating}
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                    {staff.experience} experience
                  </p>
                  {staff.specialties && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {staff.specialties.map((specialty, index) => (
                        <span key={index} style={{
                          fontSize: '12px',
                          background: '#f8fafc',
                          color: '#64748b',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0'
                        }}>
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                  ))}
                </div>
              );
            })()}

            <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
              <button 
                onClick={handleBack}
                className="btn btn-secondary"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time Selection */}
        {currentStep === 3 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                Schedule Your Appointment
              </h2>
              <div style={{ color: '#64748b', fontSize: '14px' }}>
                Service: <strong style={{ color: businessType.color }}>{formData.service_name}</strong>
                {selectedStaff && (
                  <> • with <strong style={{ color: businessType.color }}>{selectedStaff.name}</strong></>
                )}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                  Select Date
                </label>
                <input
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({...formData, appointment_date: e.target.value, appointment_time: ''})}
                  min={getTomorrowDate()}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                  Available Times
                </label>
                {formData.appointment_date && availableSlots.length > 0 ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setFormData({...formData, appointment_time: slot})}
                        style={{
                          padding: '12px 8px',
                          border: formData.appointment_time === slot ? `2px solid ${businessType.color}` : '2px solid #e5e7eb',
                          borderRadius: '8px',
                          background: formData.appointment_time === slot ? businessType.color : '#ffffff',
                          color: formData.appointment_time === slot ? 'white' : '#1e293b',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                ) : formData.appointment_date && availableSlots.length === 0 ? (
                  <div className="alert alert-error">
                    No available time slots for this date.
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '14px' }}>
                    Please select a date first
                  </p>
                )}
              </div>
            </div>
            
            <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
              <button 
                onClick={handleBack}
                className="btn btn-secondary"
              >
                ← Back
              </button>
              {formData.appointment_time && (
                <button 
                  onClick={handleNext}
                  className="btn"
                >
                  Continue →
                </button>
              )}
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
              background: `linear-gradient(135deg, ${businessType.color}10 0%, ${businessType.color}05 100%)`,
              padding: '32px',
              borderRadius: '16px',
              marginBottom: '32px',
              border: `1px solid ${businessType.color}30`
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Service:</span>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>{formData.service_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>
                    {businessType.id === 'massage' ? 'Therapist:' : 'Dentist:'}
                  </span>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>{selectedStaff?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Price:</span>
                  <span style={{ fontWeight: '700', color: businessType.color, fontSize: '18px' }}>
                    {selectedService?.price}
                  </span>
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
                onClick={handleBack}
                className="btn btn-secondary"
              >
                ← Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="btn"
                style={{ flex: 1, background: `linear-gradient(135deg, ${businessType.color} 0%, ${businessType.color}aa 100%)` }}
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

export default BusinessBookingWizard;