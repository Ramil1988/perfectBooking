import React, { useState } from 'react';

function BusinessTypeSelector({ onBusinessTypeSelect }) {
  const [selectedType, setSelectedType] = useState('');

  const businessTypes = [
    {
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
      ],
      staff: [
        { id: 1, name: 'Sarah Johnson', specialties: ['Swedish', 'Deep Tissue'], experience: '8 years', rating: 4.9 },
        { id: 2, name: 'Mike Chen', specialties: ['Sports', 'Deep Tissue'], experience: '6 years', rating: 4.8 },
        { id: 3, name: 'Emma Rodriguez', specialties: ['Hot Stone', 'Aromatherapy'], experience: '10 years', rating: 4.9 },
        { id: 4, name: 'David Kim', specialties: ['Swedish', 'Sports'], experience: '5 years', rating: 4.7 }
      ]
    },
    {
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
      ],
      staff: [
        { id: 1, name: 'Dr. Amanda Foster', specialties: ['General', 'Cosmetic'], experience: '12 years', rating: 4.9 },
        { id: 2, name: 'Dr. James Miller', specialties: ['Endodontics', 'Surgery'], experience: '18 years', rating: 4.8 },
        { id: 3, name: 'Dr. Rachel Green', specialties: ['Pediatric', 'Orthodontics'], experience: '10 years', rating: 4.9 },
        { id: 4, name: 'Dr. Kevin Park', specialties: ['Periodontics', 'Implants'], experience: '15 years', rating: 4.7 }
      ]
    },
    {
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
      ],
      staff: [
        { id: 1, name: 'Isabella Martinez', specialties: ['Hair Styling', 'Coloring'], experience: '7 years', rating: 4.9 },
        { id: 2, name: 'Sophie Anderson', specialties: ['Facial Treatments', 'Skincare'], experience: '9 years', rating: 4.8 },
        { id: 3, name: 'Emma Wilson', specialties: ['Nail Artistry', 'Manicures'], experience: '5 years', rating: 4.9 },
        { id: 4, name: 'Olivia Brown', specialties: ['Makeup', 'Eyebrows'], experience: '6 years', rating: 4.7 }
      ]
    }
  ];

  const handleSelect = (businessType) => {
    setSelectedType(businessType.id);
    onBusinessTypeSelect(businessType);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '42px', 
          fontWeight: '800', 
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #2EABE2 0%, #26334B 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Choose Your Business Type
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: '#64748b', 
          marginBottom: '0',
          lineHeight: '1.6'
        }}>
          Select your business category to customize your booking experience
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '24px' 
      }}>
        {businessTypes.map((business) => (
          <div
            key={business.id}
            onClick={() => handleSelect(business)}
            style={{
              padding: '32px',
              border: selectedType === business.id ? `3px solid ${business.color}` : '2px solid #e5e7eb',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: selectedType === business.id 
                ? `linear-gradient(135deg, ${business.color}10 0%, ${business.color}05 100%)`
                : '#ffffff',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (selectedType !== business.id) {
                e.currentTarget.style.borderColor = business.color;
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = `0 20px 60px ${business.color}20`;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedType !== business.id) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {/* Business Icon */}
            <div style={{
              fontSize: '60px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              {business.icon}
            </div>

            {/* Business Name */}
            <h3 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1e293b',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              {business.name}
            </h3>

            {/* Description */}
            <p style={{ 
              color: '#64748b', 
              marginBottom: '24px', 
              fontSize: '16px',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              {business.description}
            </p>

            {/* Features List */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: business.color,
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                Booking Process:
              </h4>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {business.features.map((feature, index) => (
                  <li key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: '#64748b'
                  }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: business.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginRight: '8px'
                    }}>
                      {index + 1}
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Service Count */}
            <div style={{
              background: `${business.color}15`,
              padding: '12px 16px',
              borderRadius: '12px',
              textAlign: 'center',
              border: `1px solid ${business.color}30`
            }}>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: business.color
              }}>
                {business.services.length} Services Available
              </span>
            </div>

            {/* Selection Indicator */}
            {selectedType === business.id && (
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: business.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: `0 4px 14px ${business.color}40`
              }}>
                ✓
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedType && (
        <div style={{ 
          marginTop: '40px', 
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease-in-out'
        }}>
          <button 
            onClick={() => {
              const selected = businessTypes.find(b => b.id === selectedType);
              handleSelect(selected);
            }}
            className="btn"
            style={{ 
              fontSize: '18px',
              padding: '16px 32px',
              boxShadow: '0 8px 30px rgba(46, 171, 226, 0.3)'
            }}
          >
            Continue with {businessTypes.find(b => b.id === selectedType)?.name} →
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default BusinessTypeSelector;