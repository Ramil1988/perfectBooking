const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_demo_key_for_development');
const router = express.Router();
const db = require('../database');

// Stripe webhook endpoint
router.post('/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Check if we've already processed this event
  db.get(
    'SELECT id FROM stripe_webhooks WHERE stripe_event_id = ?',
    [event.id],
    (err, existingEvent) => {
      if (existingEvent) {
        console.log('Event already processed:', event.id);
        return res.status(200).json({received: true});
      }

      // Log the webhook event
      db.run(
        'INSERT INTO stripe_webhooks (stripe_event_id, event_type, data) VALUES (?, ?, ?)',
        [event.id, event.type, JSON.stringify(event.data)],
        function(insertErr) {
          if (insertErr) {
            console.error('Error logging webhook:', insertErr);
          }
        }
      );

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          handlePaymentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          handlePaymentFailed(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          handleSubscriptionPaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          handleSubscriptionPaymentFailed(event.data.object);
          break;

        case 'customer.subscription.created':
          handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          handleSubscriptionDeleted(event.data.object);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Mark event as processed
      db.run(
        'UPDATE stripe_webhooks SET processed = 1 WHERE stripe_event_id = ?',
        [event.id]
      );

      res.status(200).json({received: true});
    }
  );
});

function handlePaymentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  // Update payment status in database
  db.run(
    'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_payment_intent_id = ?',
    ['succeeded', paymentIntent.id],
    function(err) {
      if (err) {
        console.error('Error updating payment status:', err);
        return;
      }

      // If this was a booking payment, update booking status
      if (paymentIntent.metadata.bookingId) {
        db.run(
          'UPDATE bookings SET payment_status = ? WHERE id = ?',
          ['paid', paymentIntent.metadata.bookingId]
        );
      }
    }
  );
}

function handlePaymentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  db.run(
    'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_payment_intent_id = ?',
    ['failed', paymentIntent.id],
    function(err) {
      if (err) {
        console.error('Error updating payment status:', err);
        return;
      }

      // If this was a booking payment, update booking status
      if (paymentIntent.metadata.bookingId) {
        db.run(
          'UPDATE bookings SET payment_status = ? WHERE id = ?',
          ['failed', paymentIntent.metadata.bookingId]
        );
      }
    }
  );
}

function handleSubscriptionPaymentSucceeded(invoice) {
  console.log('Subscription payment succeeded:', invoice.id);
  
  if (invoice.subscription) {
    // Update subscription status to active
    db.run(
      'UPDATE subscriptions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = ?',
      ['active', invoice.subscription]
    );

    // Create payment record for the subscription payment
    db.get(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
      [invoice.subscription],
      (err, subscription) => {
        if (!err && subscription) {
          db.run(
            `INSERT INTO payments (user_id, subscription_id, stripe_charge_id, amount, currency, status, payment_type, description) 
             VALUES (?, (SELECT id FROM subscriptions WHERE stripe_subscription_id = ?), ?, ?, ?, ?, ?, ?)`,
            [
              subscription.user_id,
              invoice.subscription,
              invoice.charge,
              invoice.amount_paid / 100, // Convert from cents
              invoice.currency,
              'succeeded',
              'subscription',
              'Monthly subscription payment'
            ]
          );
        }
      }
    );
  }
}

function handleSubscriptionPaymentFailed(invoice) {
  console.log('Subscription payment failed:', invoice.id);
  
  if (invoice.subscription) {
    // Update subscription status to past_due
    db.run(
      'UPDATE subscriptions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = ?',
      ['past_due', invoice.subscription]
    );
  }
}

function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  // Update subscription record with latest info
  db.run(
    `UPDATE subscriptions SET 
     status = ?, 
     current_period_start = ?, 
     current_period_end = ?, 
     updated_at = CURRENT_TIMESTAMP 
     WHERE stripe_subscription_id = ?`,
    [
      subscription.status,
      new Date(subscription.current_period_start * 1000).toISOString(),
      new Date(subscription.current_period_end * 1000).toISOString(),
      subscription.id
    ]
  );
}

function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  db.run(
    `UPDATE subscriptions SET 
     status = ?, 
     current_period_start = ?, 
     current_period_end = ?, 
     updated_at = CURRENT_TIMESTAMP 
     WHERE stripe_subscription_id = ?`,
    [
      subscription.status,
      new Date(subscription.current_period_start * 1000).toISOString(),
      new Date(subscription.current_period_end * 1000).toISOString(),
      subscription.id
    ]
  );
}

function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  // Update subscription status to canceled
  db.run(
    'UPDATE subscriptions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = ?',
    ['canceled', subscription.id]
  );

  // Update user business access to expired
  db.run(
    'UPDATE user_business_access SET subscription_status = ? WHERE user_id = (SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?)',
    ['expired', subscription.id]
  );
}

module.exports = router;