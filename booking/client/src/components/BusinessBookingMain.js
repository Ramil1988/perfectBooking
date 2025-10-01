import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CompanySelector from './CompanySelector';
import BusinessBookingWizard from './BusinessBookingWizard';

function getBusinessTypeName(businessType) {
  const names = {
    'massage': 'Massage Therapy',
    'dental': 'Dental Clinic', 
    'beauty': 'Beauty Salon'
  };
  return names[businessType] || businessType;
}

function getBusinessTypeData(businessType, specialists = []) {
  const businessTypes = {
    'massage': {
      id: 'massage',
      name: 'Massage Therapy',
      description: 'Professional massage and wellness services',
      icon: '💆‍♀️',
      color: '#10b981',
      features: ['Select Therapist', 'Choose Service', 'Book Appointment'],
      services: [
        { name: 'Swedish Massage', duration: 60, price: '$120' },
        { name: 'Deep Tissue Massage', duration: 90, price: '$150' },
        { name: 'Hot Stone Massage', duration: 75, price: '$140' },
        { name: 'Aromatherapy Massage', duration: 60, price: '$130' },
        { name: 'Sports Massage', duration: 60, price: '$125' }
      ]
    },
    'dental': {
      id: 'dental',
      name: 'Dental Clinic',
      description: 'Comprehensive dental care and treatments',
      icon: '🦷',
      color: '#06b6d4',
      features: ['Choose Service', 'Select Dentist', 'Book Appointment'],
      services: [
        { name: 'Regular Cleaning', duration: 45, price: '$120' },
        { name: 'Dental Exam', duration: 30, price: '$80' },
        { name: 'Teeth Whitening', duration: 90, price: '$300' },
        { name: 'Cavity Filling', duration: 60, price: '$180' },
        { name: 'Root Canal', duration: 120, price: '$800' },
        { name: 'Crown Placement', duration: 90, price: '$1200' }
      ]
    },
    'beauty': {
      id: 'beauty',
      name: 'Beauty Salon',
      description: 'Professional beauty and wellness treatments',
      icon: '💄',
      color: '#ff6b9d',
      features: ['Choose Service', 'Select Specialist', 'Book Appointment'],
      services: [
        { name: 'Haircut & Style', duration: 60, price: '$45' },
        { name: 'Hair Coloring', duration: 120, price: '$80' },
        { name: 'Facial Treatment', duration: 75, price: '$65' },
        { name: 'Manicure', duration: 45, price: '$25' },
        { name: 'Pedicure', duration: 60, price: '$35' },
        { name: 'Eyebrow Threading', duration: 20, price: '$15' },
        { name: 'Makeup Application', duration: 60, price: '$50' },
        { name: 'Hair Extensions', duration: 180, price: '$120' },
        { name: 'Chemical Peel', duration: 60, price: '$75' },
        { name: 'Eyelash Extensions', duration: 90, price: '$60' }
      ]
    }
  };
  
  const baseData = businessTypes[businessType] || {
    id: businessType,
    name: businessType,
    description: 'Professional services',
    icon: '🏢',
    color: '#6b7280',
    features: [],
    services: []
  };

  // Convert database specialists to the format expected by the booking wizard
  const convertedStaff = specialists.map(specialist => ({
    id: specialist.id,
    name: specialist.name,
    specialty: specialist.specialty, // Keep original specialty for matching
    specialties: [specialist.specialty], // Convert single specialty to array
    experience: '5+ years', // Default since we don't have this in DB
    rating: 4.8, // Default rating
    email: specialist.email,
    phone: specialist.phone
  }));

  return {
    ...baseData,
    staff: convertedStaff
  };
}

function BusinessBookingMain({ user }) {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [specialists, setSpecialists] = useState([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);

  const fetchSpecialists = async (businessType) => {
    try {
      setLoadingSpecialists(true);
      const response = await axios.get(`/api/specialists?business_type=${businessType}`);
      setSpecialists(response.data.specialists || []);
    } catch (error) {
      console.error('Error fetching specialists:', error);
      setSpecialists([]);
    } finally {
      setLoadingSpecialists(false);
    }
  };

  const handleCompanySelect = async (company) => {
    setSelectedCompany(company);
    setShowWizard(true);
    await fetchSpecialists(company.business_type);
  };

  const handleBackToSelection = () => {
    setShowWizard(false);
    setSelectedCompany(null);
    setSpecialists([]);
  };

  if (showWizard && selectedCompany) {
    // Convert company data to match the expected businessType format
    const businessTypeData = getBusinessTypeData(selectedCompany.business_type, specialists);
    businessTypeData.company = selectedCompany;

    if (loadingSpecialists) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading specialists...</p>
        </div>
      );
    }

    return (
      <div>
        {/* Back button */}
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={handleBackToSelection}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            ← Change Company
          </button>
        </div>
        
        <BusinessBookingWizard 
          user={user} 
          businessType={businessTypeData}
        />
      </div>
    );
  }

  return (
    <CompanySelector 
      onCompanySelect={handleCompanySelect}
    />
  );
}

export default BusinessBookingMain;