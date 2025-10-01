import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('beauty');
  const [dynamicPricing, setDynamicPricing] = useState({});

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await axios.get('/api/super-admin/platform-pricing');
      const pricingMap = {};
      response.data.pricing.forEach(item => {
        pricingMap[item.business_type] = {
          price: `$${item.monthly_price}`,
          description: item.description
        };
      });
      setDynamicPricing(pricingMap);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      // Fallback to default pricing if API fails
    }
  };

  const businessTypes = [
    {
      id: 'massage',
      name: 'Massage Therapy',
      icon: '💆‍♀️',
      price: '$29.99',
      description: 'Professional appointment scheduling for massage therapy',
      features: ['Appointment Booking', 'Staff Scheduling', 'Client Management', 'Payment Processing']
    },
    {
      id: 'dental',
      name: 'Dental Practice',
      icon: '🦷',
      price: '$29.99',
      description: 'Professional appointment scheduling for dental practices',
      features: ['Appointment Scheduling', 'Patient Management', 'Staff Scheduling', 'Payment Processing']
    },
    {
      id: 'beauty',
      name: 'Beauty Salon',
      icon: '💄',
      price: '$19.99',
      description: 'Professional appointment scheduling for beauty salons',
      features: ['Appointment Booking', 'Stylist Scheduling', 'Client Management', 'Payment Processing']
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Spa Owner",
      business: "Serenity Wellness Spa",
      quote: "AppointSync transformed our business operations. We've seen a 40% increase in bookings and our staff loves how easy it is to manage schedules.",
      rating: 5
    },
    {
      name: "Dr. Michael Chen",
      role: "Dentist",
      business: "Chen Family Dentistry",
      quote: "The patient management features are incredible. Everything from appointments to treatment history is organized perfectly.",
      rating: 5
    },
    {
      name: "Isabella Martinez",
      role: "Salon Manager",
      business: "Bella Beauty Studio",
      quote: "Our clients love the online booking system and we've reduced no-shows by 60%. The ROI was immediate.",
      rating: 5
    }
  ];

  const features = [
    {
      icon: '📅',
      title: 'Smart Scheduling',
      description: 'AI-powered appointment scheduling that prevents double bookings and optimizes your calendar'
    },
    {
      icon: '👥',
      title: 'Client Management',
      description: 'Comprehensive client profiles with history, preferences, and automated follow-ups'
    },
    {
      icon: '💳',
      title: 'Payment Processing',
      description: 'Secure payment processing with multiple payment methods and automatic billing'
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Real-time insights into your business performance with detailed reports and metrics'
    },
    {
      icon: '📱',
      title: 'Mobile Optimized',
      description: 'Works perfectly on all devices - desktop, tablet, and mobile for on-the-go management'
    },
    {
      icon: '🔒',
      title: 'Enterprise Security',
      description: 'Bank-level security with encrypted data storage and HIPAA compliance available'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      {/* Navigation */}
      <nav style={{
        padding: '20px 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.8em' }}>🚀</span>
          <h1 style={{ margin: 0, fontSize: '1.5em', fontWeight: 'bold' }}>AppointSync</h1>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#features" style={{ color: 'white', textDecoration: 'none' }}>Features</a>
          <a href="#pricing" style={{ color: 'white', textDecoration: 'none' }}>Pricing</a>
          <a href="#testimonials" style={{ color: 'white', textDecoration: 'none' }}>Reviews</a>
          <Link 
            to="/login" 
            style={{ 
              padding: '10px 20px', 
              background: 'rgba(255, 255, 255, 0.2)', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '25px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        padding: '120px 5% 80px 5%', 
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{ 
          fontSize: '3.5em', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          lineHeight: '1.2'
        }}>
          Transform Your Business with Professional Booking Management
        </h1>
        <p style={{ 
          fontSize: '1.3em', 
          marginBottom: '40px', 
          opacity: 0.9,
          maxWidth: '800px',
          margin: '0 auto 40px auto',
          lineHeight: '1.6'
        }}>
          The all-in-one platform for massage therapists, dental practices, and beauty salons. 
          Streamline appointments, manage clients, and grow your business with our powerful SaaS solution.
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
          <Link 
            to="/register"
            style={{ 
              padding: '15px 30px', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '30px',
              fontSize: '1.1em',
              fontWeight: 'bold',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
            }}
          >
            Start Free Trial
          </Link>
          <button 
            onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
            style={{ 
              padding: '15px 30px', 
              background: 'rgba(255, 255, 255, 0.2)', 
              color: 'white', 
              border: '2px solid rgba(255, 255, 255, 0.3)', 
              borderRadius: '30px',
              fontSize: '1.1em',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Watch Demo
          </button>
        </div>

        {/* Trust Indicators */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '40px', 
          alignItems: 'center',
          flexWrap: 'wrap',
          opacity: 0.8
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold' }}>99.9%</div>
            <div style={{ fontSize: '0.9em' }}>Uptime</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold' }}>24/7</div>
            <div style={{ fontSize: '0.9em' }}>Support</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ 
        padding: '80px 5%', 
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5em', 
            textAlign: 'center', 
            marginBottom: '60px',
            fontWeight: 'bold'
          }}>
            Everything You Need to Run Your Business
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '40px' 
          }}>
            {features.map((feature, index) => (
              <div 
                key={index}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  padding: '30px', 
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{ fontSize: '3em', marginBottom: '20px' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.3em', marginBottom: '15px', fontWeight: 'bold' }}>
                  {feature.title}
                </h3>
                <p style={{ opacity: 0.9, lineHeight: '1.6' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '80px 5%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5em', 
            textAlign: 'center', 
            marginBottom: '60px',
            fontWeight: 'bold'
          }}>
            Choose Your Business Solution
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '30px' 
          }}>
            {businessTypes.map((business) => (
              <div 
                key={business.id}
                style={{ 
                  background: selectedPlan === business.id ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedPlan === business.id ? '#1e293b' : 'white',
                  padding: '40px 30px', 
                  borderRadius: '20px',
                  border: selectedPlan === business.id ? '3px solid #10b981' : '1px solid rgba(255, 255, 255, 0.2)',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => setSelectedPlan(business.id)}
                onMouseEnter={(e) => {
                  if (selectedPlan !== business.id) {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPlan !== business.id) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                
                <div style={{ fontSize: '4em', marginBottom: '20px' }}>{business.icon}</div>
                <h3 style={{ fontSize: '1.5em', marginBottom: '10px', fontWeight: 'bold' }}>
                  {business.name}
                </h3>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '10px' }}>
                  {dynamicPricing[business.id]?.price || business.price}
                  <span style={{ fontSize: '0.4em', opacity: 0.8 }}>/month</span>
                </div>
                <p style={{ marginBottom: '30px', opacity: 0.8 }}>
                  {dynamicPricing[business.id]?.description || business.description}
                </p>
                
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  marginBottom: '30px',
                  textAlign: 'left'
                }}>
                  {business.features.map((feature, index) => (
                    <li key={index} style={{ 
                      marginBottom: '10px', 
                      display: 'flex', 
                      alignItems: 'center',
                      opacity: 0.9
                    }}>
                      <span style={{ 
                        color: '#10b981', 
                        marginRight: '10px', 
                        fontWeight: 'bold' 
                      }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link 
                  to="/register"
                  style={{ 
                    display: 'inline-block',
                    padding: '12px 30px', 
                    background: selectedPlan === business.id ? '#10b981' : 'rgba(255, 255, 255, 0.2)', 
                    color: selectedPlan === business.id ? 'white' : (selectedPlan === business.id ? '#1e293b' : 'white'),
                    textDecoration: 'none', 
                    borderRadius: '25px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    border: selectedPlan === business.id ? 'none' : '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            marginTop: '40px',
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <p style={{ fontSize: '1.1em', marginBottom: '15px' }}>
              🎉 <strong>Special Launch Offer:</strong> 30-day free trial • No credit card required • Cancel anytime
            </p>
            <p style={{ opacity: 0.8 }}>
              All plans include unlimited users, 24/7 support, and automatic backups
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" style={{ 
        padding: '80px 5%', 
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '2.5em', 
            marginBottom: '60px',
            fontWeight: 'bold'
          }}>
            Trusted by Business Owners Worldwide
          </h2>
          
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            color: '#1e293b',
            padding: '50px', 
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ marginBottom: '30px' }}>
              {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                <span key={i} style={{ fontSize: '1.5em', color: '#fbbf24' }}>⭐</span>
              ))}
            </div>
            
            <blockquote style={{ 
              fontSize: '1.3em', 
              fontStyle: 'italic', 
              marginBottom: '30px',
              lineHeight: '1.6'
            }}>
              "{testimonials[activeTestimonial].quote}"
            </blockquote>
            
            <div>
              <strong style={{ fontSize: '1.1em' }}>{testimonials[activeTestimonial].name}</strong>
              <div style={{ opacity: 0.7 }}>
                {testimonials[activeTestimonial].role} at {testimonials[activeTestimonial].business}
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '10px', 
            marginTop: '30px' 
          }}>
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  border: 'none',
                  background: activeTestimonial === index ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" style={{ padding: '80px 5%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '2.5em', 
            marginBottom: '30px',
            fontWeight: 'bold'
          }}>
            See AppointSync In Action
          </h2>
          <p style={{ 
            fontSize: '1.2em', 
            marginBottom: '40px',
            opacity: 0.9
          }}>
            Experience the power of our platform with live demo accounts
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '30px',
            marginTop: '40px',
            maxWidth: '1000px',
            margin: '40px auto 0'
          }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '30px', 
              borderRadius: '15px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ marginBottom: '15px', fontSize: '1.3em' }}>Super Admin Dashboard</h3>
              <p style={{ marginBottom: '15px', opacity: 0.9, fontSize: '0.95em' }}>
                Manage all business types, users, and platform settings
              </p>
              <div style={{ marginBottom: '15px', fontSize: '0.85em', opacity: 0.8 }}>
                <div>Email: superadmin@platform.com</div>
                <div>Password: superadmin123</div>
              </div>
              <Link 
                to="/login"
                style={{ 
                  display: 'inline-block',
                  padding: '10px 20px', 
                  background: '#10b981', 
                  color: 'white', 
                  textDecoration: 'none', 
                  borderRadius: '20px',
                  fontSize: '0.9em',
                  fontWeight: 'bold'
                }}
              >
                Try Super Admin
              </Link>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '30px', 
              borderRadius: '15px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ marginBottom: '15px', fontSize: '1.3em' }}>Business Admin Panel</h3>
              <p style={{ marginBottom: '15px', opacity: 0.9, fontSize: '0.95em' }}>
                Experience the business management interface
              </p>
              <div style={{ marginBottom: '15px', fontSize: '0.85em', opacity: 0.8 }}>
                <div>Email: admin@business.com</div>
                <div>Password: admin123</div>
              </div>
              <Link 
                to="/login"
                style={{ 
                  display: 'inline-block',
                  padding: '10px 20px', 
                  background: '#3b82f6', 
                  color: 'white', 
                  textDecoration: 'none', 
                  borderRadius: '20px',
                  fontSize: '0.9em',
                  fontWeight: 'bold'
                }}
              >
                Try Business Admin
              </Link>
            </div>

            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '30px', 
              borderRadius: '15px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ marginBottom: '15px', fontSize: '1.3em' }}>Customer Portal</h3>
              <p style={{ marginBottom: '15px', opacity: 0.9, fontSize: '0.95em' }}>
                Book appointments and manage your bookings
              </p>
              <div style={{ marginBottom: '15px', fontSize: '0.85em', opacity: 0.8 }}>
                <div>Email: customer.massage@demo.com</div>
                <div>Password: customer123</div>
              </div>
              <Link 
                to="/login"
                style={{ 
                  display: 'inline-block',
                  padding: '10px 20px', 
                  background: '#8b5cf6', 
                  color: 'white', 
                  textDecoration: 'none', 
                  borderRadius: '20px',
                  fontSize: '0.9em',
                  fontWeight: 'bold'
                }}
              >
                Try Customer Portal
              </Link>
            </div>


          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: '80px 5%', 
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5em', 
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>
            Ready to Transform Your Business?
          </h2>
          <p style={{ 
            fontSize: '1.2em', 
            marginBottom: '40px',
            opacity: 0.9
          }}>
            Join thousands of satisfied business owners who have streamlined their operations with AppointSync
          </p>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/register"
              style={{ 
                padding: '15px 30px', 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '30px',
                fontSize: '1.1em',
                fontWeight: 'bold',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Start Your Free Trial Today
            </Link>
          </div>
          
          <p style={{ 
            marginTop: '20px', 
            fontSize: '0.9em', 
            opacity: 0.8 
          }}>
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '40px 5%', 
        background: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.5em' }}>🚀</span>
            <h3 style={{ margin: 0 }}>AppointSync</h3>
          </div>
          <p style={{ opacity: 0.8, marginBottom: '20px' }}>
            The complete booking management solution for modern businesses
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '30px', 
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}>
            <a href="#features" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Pricing</a>
            <Link to="/login" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Sign Up</Link>
          </div>
          <p style={{ opacity: 0.6, fontSize: '0.9em' }}>
            © 2025 AppointSync. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;