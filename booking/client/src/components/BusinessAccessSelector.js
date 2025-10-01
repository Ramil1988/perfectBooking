import React, { useState, useEffect } from 'react';
import { userAccessAPI } from '../utils/api';

function BusinessAccessSelector({ onBusinessSelect, user, onLogout }) {
  const [userPermissions, setUserPermissions] = useState([]);
  const [availableBusinessTypes, setAvailableBusinessTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAccess();
  }, []);

  const fetchUserAccess = async () => {
    try {
      const [permissionsRes, availableRes] = await Promise.all([
        userAccessAPI.getPermissions(),
        userAccessAPI.getAvailableBusinessTypes()
      ]);

      setUserPermissions(permissionsRes.permissions || []);
      setAvailableBusinessTypes(availableRes.businessTypes || []);
    } catch (error) {
      console.error('Error fetching user access:', error);
      setUserPermissions([]);
      setAvailableBusinessTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const getBusinessIcon = (businessType) => {
    const icons = {
      massage: '💆‍♀️',
      dental: '🦷',
      beauty: '💄'
    };
    return icons[businessType] || '🏢';
  };

  const getBusinessColor = (businessType) => {
    const colors = {
      massage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      dental: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      beauty: 'linear-gradient(135deg, #ff6b9d 0%, #fd746c 100%)'
    };
    return colors[businessType] || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading your business access...</div>
      </div>
    );
  }

  const activePermissions = userPermissions.filter(p => !p.isExpired && p.subscription_status !== 'cancelled');

  if (activePermissions.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative'
      }}>
        {/* Floating Sign Out Button */}
        {user && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '8px 15px',
              borderRadius: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '14px'
            }}>
              {user.email}
            </div>
            <button
              onClick={onLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        <div style={{
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h1 style={{
              fontSize: '3em',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 20px 0',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}>
              🚫 No Active Business Access
            </h1>
            <p style={{
              fontSize: '1.2em',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 40px 0',
              lineHeight: '1.6'
            }}>
              You don't currently have access to any business types. 
              Contact your administrator to get access to the platform.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '15px',
              padding: '30px',
              marginTop: '30px'
            }}>
              <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>Available Business Types</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px' 
              }}>
                {availableBusinessTypes.map(businessType => (
                  <div
                    key={businessType.business_type}
                    style={{
                      padding: '20px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      textAlign: 'center',
                      background: 'white'
                    }}
                  >
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                      {getBusinessIcon(businessType.business_type)}
                    </div>
                    <h3 style={{ 
                      textTransform: 'capitalize', 
                      color: '#1e293b',
                      marginBottom: '10px'
                    }}>
                      {businessType.business_type}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>
                      {businessType.description}
                    </p>
                    <div style={{
                      background: '#f1f5f9',
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#1e293b'
                    }}>
                      ${businessType.monthly_price}/month
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{
                marginTop: '30px',
                padding: '20px',
                background: '#fef3c7',
                borderRadius: '10px',
                border: '1px solid #f59e0b'
              }}>
                <p style={{ color: '#92400e', margin: 0, fontSize: '16px' }}>
                  💡 <strong>Need Access?</strong> Contact your administrator at{' '}
                  <a href="mailto:superadmin@platform.com" style={{ color: '#92400e' }}>
                    superadmin@platform.com
                  </a>{' '}
                  to get started with any of these business types.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Floating Sign Out Button */}
      {user && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            padding: '8px 15px',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '14px'
          }}>
            {user.email}
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Sign Out
          </button>
        </div>
      )}

      <div style={{
        maxWidth: '1200px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '40px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h1 style={{
            fontSize: '3em',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 20px 0',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            Choose Your Business Platform
          </h1>
          <p style={{
            fontSize: '1.2em',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 40px 0',
            lineHeight: '1.6'
          }}>
            Select from your licensed business types to access the management platform.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '30px',
          marginTop: '40px'
        }}>
          {activePermissions.map(permission => (
            <div
              key={permission.business_type}
              onClick={() => onBusinessSelect(permission.business_type)}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '30px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transform: 'translateY(0)',
                backdropFilter: 'blur(10px)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
              }}
            >
              {/* Subscription Status Badge */}
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: permission.subscription_status === 'active' ? '#dcfce7' : '#fef3c7',
                color: permission.subscription_status === 'active' ? '#166534' : '#92400e',
                textTransform: 'uppercase'
              }}>
                {permission.subscription_status}
              </div>

              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: getBusinessColor(permission.business_type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                fontSize: '2.5em'
              }}>
                {getBusinessIcon(permission.business_type)}
              </div>
              
              <h3 style={{
                fontSize: '1.5em',
                fontWeight: 'bold',
                color: '#333',
                margin: '0 0 15px 0',
                textTransform: 'capitalize'
              }}>
                {permission.business_type} Platform
              </h3>
              
              <p style={{
                color: '#666',
                fontSize: '1em',
                lineHeight: '1.5',
                margin: '0 0 20px 0'
              }}>
                {permission.description}
              </p>

              {/* Features */}
              <div style={{
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  fontSize: '0.9em',
                  fontWeight: 'bold',
                  color: '#333',
                  margin: '0 0 10px 0',
                  textAlign: 'center'
                }}>
                  Included Features:
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '5px'
                }}>
                  {permission.features?.slice(0, 4).map((feature, index) => (
                    <li key={index} style={{
                      fontSize: '0.85em',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        marginRight: '8px'
                      }}></span>
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div style={{
                marginTop: '25px',
                padding: '15px 25px',
                borderRadius: '25px',
                background: getBusinessColor(permission.business_type),
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1em',
                border: 'none',
                cursor: 'pointer'
              }}>
                Access Platform
              </div>

              {/* Subscription Info */}
              {permission.subscription_end_date && (
                <div style={{
                  marginTop: '15px',
                  fontSize: '12px',
                  color: '#64748b'
                }}>
                  {permission.subscription_status === 'active' ? 'Renews' : 'Expires'}: {' '}
                  {new Date(permission.subscription_end_date).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '40px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.9em'
        }}>
          💡 Need access to additional business types? Contact your administrator.
        </div>
      </div>
    </div>
  );
}

export default BusinessAccessSelector;