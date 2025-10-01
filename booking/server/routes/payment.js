const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_demo_key_for_development');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Create payment intent for booking
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'usd', bookingId, description } = req.body;
    const userId = req.user.userId || req.user.id;

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: userId.toString(),
        bookingId: bookingId?.toString() || '',
        type: 'booking'
      },
      description: description || 'Booking Payment'
    });

    // Save payment record to database
    db.run(
      `INSERT INTO payments (user_id, booking_id, stripe_payment_intent_id, amount, currency, status, payment_type, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, bookingId, paymentIntent.id, amount, currency, 'pending', 'booking', description],
      function(err) {
        if (err) {
          console.error('Error saving payment record:', err);
        }
      }
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Error creating payment intent' });
  }
});

// Create subscription for SaaS users
router.post('/create-subscription', authenticateToken, async (req, res) => {
  try {
    const { businessType, paymentMethodId } = req.body;
    const userId = req.user.userId || req.user.id;

    // Get pricing for business type
    db.get(
      'SELECT monthly_price FROM platform_config WHERE business_type = ?',
      [businessType],
      async (err, config) => {
        if (err || !config) {
          return res.status(400).json({ message: 'Invalid business type' });
        }

        try {
          // Create or get Stripe customer
          let customer;
          const existingCustomer = await stripe.customers.list({
            email: req.user.email,
            limit: 1
          });

          if (existingCustomer.data.length > 0) {
            customer = existingCustomer.data[0];
          } else {
            customer = await stripe.customers.create({
              email: req.user.email,
              metadata: { userId: userId.toString() }
            });
          }

          // Attach payment method to customer
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id
          });

          // Set as default payment method
          await stripe.customers.update(customer.id, {
            invoice_settings: {
              default_payment_method: paymentMethodId
            }
          });

          // Create subscription
          const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `${businessType.charAt(0).toUpperCase() + businessType.slice(1)} Platform Access`
                },
                unit_amount: Math.round(config.monthly_price * 100),
                recurring: {
                  interval: 'month'
                }
              }
            }],
            metadata: {
              userId: userId.toString(),
              businessType
            }
          });

          // Save subscription to database
          db.run(
            `INSERT INTO subscriptions (user_id, business_type, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end, amount) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              businessType,
              subscription.id,
              customer.id,
              subscription.status,
              new Date(subscription.current_period_start * 1000).toISOString(),
              new Date(subscription.current_period_end * 1000).toISOString(),
              config.monthly_price
            ]
          );

          // Update user business access to paid
          db.run(
            `UPDATE user_business_access SET subscription_status = 'active' WHERE user_id = ? AND business_type = ?`,
            [userId, businessType]
          );

          res.json({
            subscription: {
              id: subscription.id,
              status: subscription.status,
              current_period_end: subscription.current_period_end
            }
          });
        } catch (stripeError) {
          console.error('Stripe error:', stripeError);
          res.status(500).json({ message: 'Error creating subscription' });
        }
      }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Error creating subscription' });
  }
});

// Get user's subscriptions
router.get('/subscriptions', authenticateToken, (req, res) => {
  const userId = req.user.userId || req.user.id;

  db.all(
    `SELECT s.*, pc.business_type as business_name FROM subscriptions s 
     LEFT JOIN platform_config pc ON s.business_type = pc.business_type 
     WHERE s.user_id = ? ORDER BY s.created_at DESC`,
    [userId],
    (err, subscriptions) => {
      if (err) {
        console.error('Error fetching subscriptions:', err);
        return res.status(500).json({ message: 'Error fetching subscriptions' });
      }
      res.json({ subscriptions });
    }
  );
});

// Get payment history
router.get('/payments', authenticateToken, (req, res) => {
  const userId = req.user.userId || req.user.id;

  db.all(
    `SELECT p.*, b.service_name, b.appointment_date FROM payments p 
     LEFT JOIN bookings b ON p.booking_id = b.id 
     WHERE p.user_id = ? ORDER BY p.created_at DESC`,
    [userId],
    (err, payments) => {
      if (err) {
        console.error('Error fetching payments:', err);
        return res.status(500).json({ message: 'Error fetching payments' });
      }
      res.json({ payments });
    }
  );
});

// Cancel subscription
router.post('/cancel-subscription/:subscriptionId', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.userId || req.user.id;

    // Verify user owns this subscription
    db.get(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, userId],
      async (err, subscription) => {
        if (err || !subscription) {
          return res.status(404).json({ message: 'Subscription not found' });
        }

        try {
          // Cancel subscription in Stripe
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true
          });

          // Update database
          db.run(
            'UPDATE subscriptions SET status = ? WHERE id = ?',
            ['canceled', subscriptionId]
          );

          res.json({ message: 'Subscription will be canceled at the end of the current period' });
        } catch (stripeError) {
          console.error('Stripe cancellation error:', stripeError);
          res.status(500).json({ message: 'Error canceling subscription' });
        }
      }
    );
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: 'Error canceling subscription' });
  }
});

module.exports = router;