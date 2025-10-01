import React, { createContext, useContext, useState, useEffect } from 'react';

const BusinessContext = createContext();

export const useBusinessContext = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinessContext must be used within a BusinessProvider');
  }
  return context;
};

export const BusinessProvider = ({ children }) => {
  const [selectedBusinessType, setSelectedBusinessType] = useState(null);
  const [businessConfig, setBusinessConfig] = useState(null);

  const businessConfigs = {
    massage: {
      id: 'massage',
      name: 'Massage Therapy',
      icon: '💆‍♀️',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      services: [
        'Deep Tissue Massage',
        'Swedish Massage',
        'Hot Stone Massage',
        'Aromatherapy Massage',
        'Sports Massage',
        'Reflexology'
      ],
      staff: [
        { id: 'therapist_1', name: 'Sarah Johnson', specialty: 'Deep Tissue' },
        { id: 'therapist_2', name: 'Maria Garcia', specialty: 'Swedish & Relaxation' },
        { id: 'therapist_3', name: 'Jennifer Lee', specialty: 'Hot Stone' },
        { id: 'therapist_4', name: 'Ashley Chen', specialty: 'Sports Massage' }
      ],
      durations: [30, 60, 90, 120],
      defaultDuration: 60,
      bookingFlow: ['service', 'therapist', 'datetime'],
      metadataFields: ['therapy_type', 'therapist_name', 'client_preferences', 'pressure_level'],
      businessHours: { start: '08:00', end: '20:00' },
      pricePerHour: 120
    },
    
    dental: {
      id: 'dental',
      name: 'Dental Clinic',
      icon: '🦷',
      primaryColor: '#4facfe',
      secondaryColor: '#00f2fe',
      services: [
        'Teeth Cleaning',
        'Root Canal',
        'Dental Checkup',
        'Teeth Whitening',
        'Crown/Bridge Work',
        'Oral Surgery'
      ],
      doctors: [
        { id: 'dentist_1', name: 'Dr. Emily Davis', specialty: 'General Dentistry' },
        { id: 'dentist_2', name: 'Dr. Michael Chen', specialty: 'Endodontics' },
        { id: 'dentist_3', name: 'Dr. Lisa Rodriguez', specialty: 'Oral Surgery' },
        { id: 'dentist_4', name: 'Dr. James Park', specialty: 'Cosmetic Dentistry' }
      ],
      durations: [30, 45, 60, 90, 120],
      defaultDuration: 45,
      bookingFlow: ['service', 'doctor', 'datetime'],
      metadataFields: ['dentist_name', 'procedure_type', 'tooth_number', 'insurance_coverage', 'anesthesia'],
      businessHours: { start: '08:00', end: '18:00' },
      pricePerHour: 150
    },

    beauty: {
      id: 'beauty',
      name: 'Beauty Salon',
      icon: '💄',
      primaryColor: '#ff6b9d',
      secondaryColor: '#fd746c',
      services: [
        'Haircut & Style',
        'Hair Coloring',
        'Facial Treatment',
        'Manicure',
        'Pedicure',
        'Eyebrow Threading',
        'Makeup Application',
        'Hair Extensions',
        'Chemical Peel',
        'Eyelash Extensions'
      ],
      specialists: [
        { id: 'beautician_1', name: 'Isabella Martinez', specialty: 'Hair Styling' },
        { id: 'beautician_2', name: 'Sophie Anderson', specialty: 'Facial Treatments' },
        { id: 'beautician_3', name: 'Emma Wilson', specialty: 'Nail Artistry' },
        { id: 'beautician_4', name: 'Olivia Brown', specialty: 'Makeup & Brows' }
      ],
      durations: [30, 45, 60, 90, 120, 180],
      defaultDuration: 60,
      bookingFlow: ['service', 'specialist', 'datetime'],
      metadataFields: ['specialist_name', 'service_type', 'hair_type', 'skin_type', 'color_preference', 'allergies'],
      businessHours: { start: '09:00', end: '19:00' },
      pricePerHour: 80
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('selectedBusinessType');
    if (saved && businessConfigs[saved]) {
      setSelectedBusinessType(saved);
      setBusinessConfig(businessConfigs[saved]);
    }
  }, []);

  const selectBusinessType = (type) => {
    if (businessConfigs[type]) {
      setSelectedBusinessType(type);
      setBusinessConfig(businessConfigs[type]);
      localStorage.setItem('selectedBusinessType', type);
    }
  };

  const clearBusinessType = () => {
    setSelectedBusinessType(null);
    setBusinessConfig(null);
    localStorage.removeItem('selectedBusinessType');
  };

  const value = {
    selectedBusinessType,
    businessConfig,
    selectBusinessType,
    clearBusinessType,
    businessConfigs
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};

export default BusinessContext;