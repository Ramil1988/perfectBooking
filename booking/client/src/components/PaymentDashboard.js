import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PaymentDashboard({ user }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const [subscriptionsRes, paymentsRes] = await Promise.all([
        axios.get('/api/payments/subscriptions'),
        axios.get('/api/payments/payments')
      ]);
      
      setSubscriptions(subscriptionsRes.data.subscriptions);
      setPayments(paymentsRes.data.payments);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (window.confirm('Are you sure you want to cancel this subscription? It will remain active until the end of the current billing period.')) {
      try {
        await axios.post(`/api/payments/cancel-subscription/${subscriptionId}`);
        alert('Subscription will be canceled at the end of the current period');
        fetchPaymentData();
      } catch (error) {
        console.error('Error canceling subscription:', error);
        alert('Error canceling subscription');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  if (loading) {
    return <div>Loading payment information...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>💳 Payment & Billing</h1>

      {/* Active Subscriptions */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h2>Active Subscriptions</h2>
        {subscriptions.length === 0 ? (
          <p>You don't have any active subscriptions.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Business Type</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Current Period</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td>
                      <strong>
                        {subscription.business_type.charAt(0).toUpperCase() + 
                         subscription.business_type.slice(1)}
                      </strong>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        subscription.status === 'active' ? 'status-active' : 'status-trial'
                      }`}>
                        {subscription.status}
                      </span>
                    </td>
                    <td>{formatAmount(subscription.amount)}/month</td>
                    <td>
                      {formatDate(subscription.current_period_start)} - {' '}
                      {formatDate(subscription.current_period_end)}
                    </td>
                    <td>
                      {subscription.status === 'active' && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleCancelSubscription(subscription.id)}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="card">
        <h2>Payment History</h2>
        {payments.length === 0 ? (
          <p>No payment history found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.created_at)}</td>
                    <td>
                      {payment.description || 
                       (payment.service_name ? 
                        `Booking: ${payment.service_name}` : 
                        'Platform Subscription')}
                    </td>
                    <td>
                      <span className={`status-badge ${
                        payment.payment_type === 'subscription' ? 'status-active' : 'status-trial'
                      }`}>
                        {payment.payment_type}
                      </span>
                    </td>
                    <td>{formatAmount(payment.amount, payment.currency)}</td>
                    <td>
                      <span className={`status-badge ${
                        payment.status === 'succeeded' ? 'status-active' : 
                        payment.status === 'failed' ? 'status-trial' : 'status-trial'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Billing Information */}
      <div className="card" style={{ marginTop: '30px' }}>
        <h3>💡 Billing Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <h4>💳 Payment Method</h4>
            <p>Your payment method is securely stored with Stripe. You can update it by contacting support.</p>
          </div>
          <div>
            <h4>📧 Billing Contact</h4>
            <p>Invoices are sent to: <strong>{user.email}</strong></p>
          </div>
          <div>
            <h4>🔒 Security</h4>
            <p>All payments are processed securely through Stripe. We never store your card details.</p>
          </div>
        </div>
      </div>

      {/* Support Information */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3>Need Help? 🤝</h3>
        <p>
          For billing questions or payment issues, contact our support team at{' '}
          <strong>support@bookingpro.com</strong>
        </p>
        <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
          We typically respond within 24 hours during business days.
        </p>
      </div>
    </div>
  );
}

export default PaymentDashboard;