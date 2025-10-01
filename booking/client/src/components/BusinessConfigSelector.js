import React from 'react';

function BusinessConfigSelector({ onBusinessSelect }) {
  const businessTypes = [
    {
      id: 'massage',
      name: 'Massage Therapy',
      icon: '💆‍♀️',
      description: 'Spa and wellness services with therapist management',
      features: ['Therapist selection', 'Treatment types', 'Client preferences', 'Duration-based services'],
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'dental',
      name: 'Dental Clinic',
      icon: '🦷', 
      description: 'Medical appointments and patient management',
      features: ['Doctor scheduling', 'Procedure types', 'Insurance tracking', 'Medical records'],
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      id: 'beauty',
      name: 'Beauty Salon',
      icon: '💄',
      description: 'Professional beauty and wellness treatments',
      features: ['Specialist selection', 'Beauty services', 'Style preferences', 'Package deals'],
      color: 'linear-gradient(135deg, #ff6b9d 0%, #fd746c 100%)'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
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
            Choose Your Business Type
          </h1>
          <p style={{
            fontSize: '1.2em',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 40px 0',
            maxWidth: '600px',
            margin: '0 auto 40px auto',
            lineHeight: '1.6'
          }}>
            Configure the booking platform for your specific business needs. 
            Each type provides specialized features and workflows.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '30px',
          marginTop: '40px'
        }}>
          {businessTypes.map(business => (
            <div
              key={business.id}
              onClick={() => onBusinessSelect(business.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '30px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transform: 'translateY(0)',
                backdropFilter: 'blur(10px)'
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
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: business.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                fontSize: '2.5em'
              }}>
                {business.icon}
              </div>
              
              <h3 style={{
                fontSize: '1.5em',
                fontWeight: 'bold',
                color: '#333',
                margin: '0 0 15px 0'
              }}>
                {business.name}
              </h3>
              
              <p style={{
                color: '#666',
                fontSize: '1em',
                lineHeight: '1.5',
                margin: '0 0 20px 0'
              }}>
                {business.description}
              </p>
              
              <div style={{
                textAlign: 'left'
              }}>
                <h4 style={{
                  fontSize: '0.9em',
                  fontWeight: 'bold',
                  color: '#333',
                  margin: '0 0 10px 0'
                }}>
                  Key Features:
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {business.features.map((feature, index) => (
                    <li key={index} style={{
                      padding: '5px 0',
                      color: '#666',
                      fontSize: '0.85em',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#2EABE2',
                        marginRight: '10px'
                      }}></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div style={{
                marginTop: '25px',
                padding: '15px 25px',
                borderRadius: '25px',
                background: business.color,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1em',
                border: 'none',
                cursor: 'pointer'
              }}>
                Configure Platform
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '40px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.9em'
        }}>
          💡 Once selected, the entire platform will be configured for your business type
        </div>
      </div>
    </div>
  );
}

export default BusinessConfigSelector;