import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import axios from 'axios';

// Initialize Stripe (you'll need to replace with your publishable key)
const stripePromise = loadStripe('pk_test_demo_key_for_development');

function SubscriptionForm() {
  const { businessType } = useParams();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    fetchPricing();
  }, [businessType]);

  const fetchPricing = async () => {
    try {
      const response = await axios.get('/api/super-admin/platform-config');
      const config = response.data.config.find(c => c.business_type === businessType);
      if (config) {
        setPricing(config);
      } else {
        // Fallback to default pricing if no config found
        setDefaultPricing();
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      // Fallback to default pricing if API call fails
      setDefaultPricing();
    }
  };

  const setDefaultPricing = () => {
    const defaultPricing = {
      business_type: businessType,
      monthly_price: 49,
      description: getBusinessDescription(businessType)
    };
    setPricing(defaultPricing);
  };

  const getBusinessDescription = (type) => {
    switch (type) {
      case 'massage':
        return 'Complete massage therapy practice management with therapist scheduling and client tracking';
      case 'dental':
        return 'Comprehensive dental clinic management with patient appointments and medical records';
      case 'beauty':
        return 'Professional beauty salon management with stylist booking and service tracking';
      default:
        return 'Professional booking management system for your business';
    }
  };

  const getBusinessName = (type) => {
    switch (type) {
      case 'massage':
        return 'Massage Therapy';
      case 'dental':
        return 'Dental Clinic';
      case 'beauty':
        return 'Beauty Salon';
      default:
        return 'Business';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      // Create payment method
      const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (methodError) {
        throw new Error(methodError.message);
      }

      // Create subscription
      const response = await axios.post('/api/payments/create-subscription', {
        businessType,
        paymentMethodId: paymentMethod.id
      });

      if (response.data.subscription) {
        navigate('/payments');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.message || error.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  if (!pricing) {
    return <div>Loading pricing information...</div>;
  }

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h2>Subscribe to {getBusinessName(businessType)} Platform</h2>
      
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#28a745' }}>
          ${pricing.monthly_price}/month
        </h3>
        <p style={{ margin: 0, color: '#6c757d' }}>
          {pricing.description}
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Card Details</label>
          <div style={{
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            type="submit"
            className="btn"
            disabled={!stripe || isLoading}
            style={{ flex: 1 }}
          >
            {isLoading ? 'Processing...' : `Subscribe for $${pricing.monthly_price}/month`}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/payments')}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>

      <div style={{ marginTop: '16px', fontSize: '14px', color: '#6c757d', textAlign: 'center' }}>
        <p>💳 Secure payment powered by Stripe</p>
        <p>You can cancel anytime from your account settings</p>
      </div>
    </div>
  );
}

function SubscriptionPayment() {
  return (
    <div style={{ padding: '40px 20px' }}>
      <Elements stripe={stripePromise}>
        <SubscriptionForm />
      </Elements>
    </div>
  );
}

export default SubscriptionPayment;