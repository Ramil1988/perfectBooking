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

const stripePromise = loadStripe('pk_test_demo_key_for_development');

function PaymentForm() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (booking) {
      createPaymentIntent();
    }
  }, [booking]);

  const fetchBooking = async () => {
    try {
      const response = await axios.get(`/api/bookings/${bookingId}`);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Error fetching booking:', error);
      setError('Failed to load booking information. Please try again.');
    }
  };

  const createPaymentIntent = async () => {
    try {
      const response = await axios.post('/api/payments/create-payment-intent', {
        amount: booking.price,
        currency: 'usd',
        bookingId: booking.id,
        description: `Payment for ${booking.service_name} - ${booking.appointment_date}`
      });
      setClientSecret(response.data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setError('Failed to initialize payment. Please try again.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: booking.customer_name,
              email: booking.customer_email,
            },
          },
        }
      );

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed');
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

  if (!booking) {
    return <div>Loading booking information...</div>;
  }

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h2>Complete Your Booking Payment</h2>
      
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>
          Booking Details
        </h3>
        <p style={{ margin: '4px 0', fontSize: '14px' }}>
          <strong>Service:</strong> {booking.service_name}
        </p>
        <p style={{ margin: '4px 0', fontSize: '14px' }}>
          <strong>Date:</strong> {new Date(booking.appointment_date).toLocaleDateString()}
        </p>
        <p style={{ margin: '4px 0', fontSize: '14px' }}>
          <strong>Time:</strong> {booking.appointment_time}
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
          Total: ${booking.price}
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
            disabled={!stripe || isLoading || !clientSecret}
            style={{ flex: 1 }}
          >
            {isLoading ? 'Processing...' : `Pay $${booking.price}`}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>

      <div style={{ marginTop: '16px', fontSize: '14px', color: '#6c757d', textAlign: 'center' }}>
        <p>💳 Secure payment powered by Stripe</p>
        <p>Your card information is encrypted and secure</p>
      </div>
    </div>
  );
}

function BookingPayment() {
  return (
    <div style={{ padding: '40px 20px' }}>
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </div>
  );
}

export default BookingPayment;