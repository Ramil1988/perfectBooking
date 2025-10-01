const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = require('./database');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const specialistRoutes = require('./routes/specialists');
const specialistAvailabilityRoutes = require('./routes/specialist-availability');
const servicesRoutes = require('./routes/services');
const superAdminRoutes = require('./routes/super-admin');
const userAccessRoutes = require('./routes/user-access');
const paymentRoutes = require('./routes/payment');
const webhooksRoutes = require('./routes/webhooks');

// Webhooks need raw body parsing, so add this before express.json()
app.use('/api/webhooks', webhooksRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/specialists', specialistRoutes);
app.use('/api/specialist-availability', specialistAvailabilityRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/user-access', userAccessRoutes);
app.use('/api/payments', paymentRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.get('/api/health', (req, res) => {
  res.json({ message: 'Booking Platform API is running!' });
});

// Get available companies with active subscriptions for customers to book with
app.get('/api/available-companies', (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.name as user_name,
        u.email as user_email,
        uba.business_type,
        uba.subscription_status,
        uba.monthly_price
      FROM users u
      JOIN user_business_access uba ON u.id = uba.user_id
      WHERE u.role = 'admin' 
      AND uba.subscription_status IN ('active', 'trial')
      AND uba.is_active = 1
      ORDER BY uba.subscription_status DESC, u.name ASC
    `;
    
    // Use db.all instead of db.prepare for sqlite3
    db.all(query, [], (err, companies) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch companies',
          companies: []
        });
        return;
      }
      
      res.json({
        success: true,
        companies: companies || []
      });
    });
  } catch (error) {
    console.error('Error fetching available companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      companies: []
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});