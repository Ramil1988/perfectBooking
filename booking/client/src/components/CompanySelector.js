import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CompanySelector({ onCompanySelect }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    fetchAvailableCompanies();
  }, []);

  const fetchAvailableCompanies = async () => {
    try {
      const response = await axios.get('/api/available-companies');
      console.log('Available companies:', response.data);
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (company) => {
    setSelectedCompany(company);
    onCompanySelect(company);
  };

  const getBusinessTypeConfig = (businessType) => {
    const configs = {
      'massage': {
        icon: '💆‍♀️',
        color: '#10b981',
        name: 'Massage Therapy'
      },
      'dental': {
        icon: '🦷',
        color: '#06b6d4',
        name: 'Dental Clinic'
      },
      'beauty': {
        icon: '💄',
        color: '#ff6b9d',
        name: 'Beauty Salon'
      }
    };
    return configs[businessType] || {
      icon: '🏢',
      color: '#6b7280',
      name: businessType
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>🔍</div>
        <h2>Finding Available Companies...</h2>
        <p style={{ color: '#64748b' }}>Please wait while we load companies accepting bookings</p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏢</div>
        <h2>No Companies Available</h2>
        <p style={{ color: '#1e293b', marginBottom: '30px', fontSize: '16px', fontWeight: '500' }}>
          There are currently no companies accepting bookings. Please check back later.
        </p>
        <div style={{
          background: '#f8fafc',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            💡 Companies need an active subscription to accept bookings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
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
          Choose a Company
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: '#64748b', 
          marginBottom: '0',
          lineHeight: '1.6'
        }}>
          Select a company to book your appointment with
        </p>
      </div>

      {/* Companies Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px',
        marginBottom: '60px'
      }}>
        {companies.map((company) => {
          const config = getBusinessTypeConfig(company.business_type);
          
          return (
            <div
              key={company.id}
              onClick={() => handleSelect(company)}
              style={{
                padding: '28px',
                border: selectedCompany?.id === company.id ? `3px solid ${config.color}` : '2px solid #e5e7eb',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: selectedCompany?.id === company.id 
                  ? `linear-gradient(135deg, ${config.color}10 0%, ${config.color}05 100%)`
                  : '#ffffff',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (selectedCompany?.id !== company.id) {
                  e.currentTarget.style.borderColor = config.color;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 40px ${config.color}20`;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCompany?.id !== company.id) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Business Type Icon */}
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'center'
              }}>
                {config.icon}
              </div>

              {/* Company Name */}
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: '#1e293b',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                {company.business_name || company.user_name}
              </h3>

              {/* Business Type */}
              <div style={{
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <span style={{
                  background: `${config.color}15`,
                  color: config.color,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: `1px solid ${config.color}30`
                }}>
                  {config.name}
                </span>
              </div>

              {/* Subscription Status */}
              <div style={{
                background: company.subscription_status === 'active' ? '#dcfce7' : '#fef3c7',
                color: company.subscription_status === 'active' ? '#166534' : '#92400e',
                padding: '12px 16px',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '16px',
                fontSize: '14px',
                fontWeight: '600',
                border: `1px solid ${company.subscription_status === 'active' ? '#bbf7d0' : '#fde68a'}`
              }}>
                {company.subscription_status === 'active' ? '✅ Active Subscription' : '⏰ Trial Period'}
              </div>

              {/* Contact Info */}
              {company.user_email && (
                <div style={{
                  fontSize: '13px',
                  color: '#64748b',
                  textAlign: 'center',
                  marginBottom: '16px'
                }}>
                  📧 {company.user_email}
                </div>
              )}

              {/* Book Now Button */}
              <div style={{
                background: config.color,
                color: 'white',
                padding: '12px 20px',
                borderRadius: '10px',
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: '600',
                marginTop: '20px'
              }}>
                Book Appointment
              </div>

              {/* Selection Indicator */}
              {selectedCompany?.id === company.id && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: config.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  boxShadow: `0 4px 12px ${config.color}40`
                }}>
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        paddingTop: '40px',
        paddingBottom: '40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        margin: '0 -20px',
        marginTop: '60px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
          <h3 style={{ 
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#1e293b'
          }}>
            AppointSync
          </h3>
          <p style={{ 
            color: '#64748b',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            Your trusted platform for booking appointments with professional service providers.
            Easy, secure, and reliable scheduling for all your needs.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                For Customers
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#64748b' }}>
                <li style={{ marginBottom: '8px' }}>Book Appointments</li>
                <li style={{ marginBottom: '8px' }}>Manage Bookings</li>
                <li style={{ marginBottom: '8px' }}>Secure Payments</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                For Businesses
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#64748b' }}>
                <li style={{ marginBottom: '8px' }}>Schedule Management</li>
                <li style={{ marginBottom: '8px' }}>Customer Management</li>
                <li style={{ marginBottom: '8px' }}>Business Analytics</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                Support
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#64748b' }}>
                <li style={{ marginBottom: '8px' }}>Help Center</li>
                <li style={{ marginBottom: '8px' }}>Contact Support</li>
                <li style={{ marginBottom: '8px' }}>Terms & Privacy</li>
              </ul>
            </div>
          </div>
          
          <div style={{
            borderTop: '1px solid #d1d5db',
            paddingTop: '24px',
            fontSize: '14px',
            color: '#64748b'
          }}>
            <p style={{ margin: 0 }}>
              © 2025 AppointSync. All rights reserved. | 
              <span style={{ margin: '0 8px' }}>•</span>
              Empowering businesses with seamless appointment management
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CompanySelector;