const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database');

// Middleware to check if user is super admin
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

// Get all users with their business access
router.get('/users', authenticateToken, requireSuperAdmin, (req, res) => {
  console.log('DEBUG: Super admin users endpoint called');
  const query = `
    SELECT 
      u.id, u.name, u.email, u.role, u.created_at,
      json_group_array(
        CASE WHEN uba.id IS NOT NULL THEN 
          json_object(
            'business_type', uba.business_type,
            'access_level', uba.access_level,
            'is_active', uba.is_active,
            'subscription_status', uba.subscription_status,
            'monthly_price', uba.monthly_price,
            'subscription_start_date', uba.subscription_start_date,
            'subscription_end_date', uba.subscription_end_date
          )
        END
      ) as business_access
    FROM users u
    LEFT JOIN user_business_access uba ON u.id = uba.user_id AND uba.is_active = 1
    WHERE u.role != 'superadmin'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    const users = rows.map(row => ({
      ...row,
      business_access: row.business_access ? (() => {
        try {
          const parsed = JSON.parse(row.business_access);
          return Array.isArray(parsed) ? parsed.filter(item => item !== null) : [];
        } catch (e) {
          console.error('Failed to parse business access JSON:', row.business_access);
          return [];
        }
      })() : []
    }));
    
    res.json({ users });
  });
});

// Get platform configuration
router.get('/platform-config', authenticateToken, requireSuperAdmin, (req, res) => {
  db.all('SELECT * FROM platform_config ORDER BY business_type', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    const config = rows.map(row => ({
      ...row,
      features: JSON.parse(row.features || '[]')
    }));
    
    res.json({ config });
  });
});

// Grant business access to a user
router.post('/grant-access', authenticateToken, requireSuperAdmin, (req, res) => {
  const { userId, businessType, subscriptionStatus = 'trial', monthlyPrice, subscriptionDuration = 30 } = req.body;
  
  if (!userId || !businessType) {
    return res.status(400).json({ message: 'User ID and business type are required' });
  }
  
  const startDate = new Date().toISOString();
  const endDate = new Date(Date.now() + subscriptionDuration * 24 * 60 * 60 * 1000).toISOString();
  
  const query = `
    INSERT OR REPLACE INTO user_business_access 
    (user_id, business_type, access_level, is_active, subscription_status, subscription_start_date, subscription_end_date, monthly_price)
    VALUES (?, ?, 'admin', 1, ?, ?, ?, ?)
  `;
  
  db.run(query, [userId, businessType, subscriptionStatus, startDate, endDate, monthlyPrice || 0], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    res.json({ 
      message: 'Business access granted successfully',
      accessId: this.lastID
    });
  });
});

// Revoke business access from a user
router.post('/revoke-access', authenticateToken, requireSuperAdmin, (req, res) => {
  const { userId, businessType } = req.body;
  
  if (!userId || !businessType) {
    return res.status(400).json({ message: 'User ID and business type are required' });
  }
  
  const query = 'UPDATE user_business_access SET is_active = 0 WHERE user_id = ? AND business_type = ?';
  
  db.run(query, [userId, businessType], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    res.json({ message: 'Business access revoked successfully' });
  });
});

// Update subscription status
router.post('/update-subscription', authenticateToken, requireSuperAdmin, (req, res) => {
  const { userId, businessType, subscriptionStatus, monthlyPrice, subscriptionDuration } = req.body;
  
  if (!userId || !businessType) {
    return res.status(400).json({ message: 'User ID and business type are required' });
  }
  
  let query = 'UPDATE user_business_access SET subscription_status = ?, updated_at = datetime("now")';
  let params = [subscriptionStatus, userId, businessType];
  
  if (monthlyPrice !== undefined) {
    query += ', monthly_price = ?';
    params.splice(1, 0, monthlyPrice);
  }
  
  if (subscriptionDuration && subscriptionStatus === 'active') {
    const newEndDate = new Date(Date.now() + subscriptionDuration * 24 * 60 * 60 * 1000).toISOString();
    query += ', subscription_end_date = ?';
    params.splice(-2, 0, newEndDate);
  }
  
  query += ' WHERE user_id = ? AND business_type = ?';
  
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    res.json({ message: 'Subscription updated successfully' });
  });
});

// Update platform pricing
router.post('/update-pricing', authenticateToken, requireSuperAdmin, (req, res) => {
  const { businessType, monthlyPrice, isAvailable, features, description } = req.body;
  
  if (!businessType) {
    return res.status(400).json({ message: 'Business type is required' });
  }
  
  const query = `
    UPDATE platform_config 
    SET monthly_price = ?, is_available = ?, features = ?, description = ?
    WHERE business_type = ?
  `;
  
  const featuresJson = JSON.stringify(features || []);
  
  db.run(query, [monthlyPrice, isAvailable, featuresJson, description, businessType], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    res.json({ message: 'Platform pricing updated successfully' });
  });
});

// Get analytics and metrics
router.get('/analytics', authenticateToken, requireSuperAdmin, (req, res) => {
  const queries = {
    totalUsers: 'SELECT COUNT(*) as count FROM users WHERE role != "superadmin"',
    activeSubscriptions: 'SELECT COUNT(*) as count FROM user_business_access WHERE is_active = 1 AND subscription_status = "active"',
    trialUsers: 'SELECT COUNT(*) as count FROM user_business_access WHERE subscription_status = "trial"',
    businessTypeStats: `
      SELECT 
        uba.business_type,
        COUNT(*) as total_users,
        COUNT(CASE WHEN uba.subscription_status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN uba.subscription_status = 'trial' THEN 1 END) as trial_users,
        AVG(uba.monthly_price) as avg_price,
        SUM(uba.monthly_price) as total_revenue
      FROM user_business_access uba
      WHERE uba.is_active = 1
      GROUP BY uba.business_type
    `,
    recentSignups: `
      SELECT u.name, u.email, u.created_at, u.role
      FROM users u
      WHERE u.role != 'superadmin'
      ORDER BY u.created_at DESC
      LIMIT 10
    `
  };
  
  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;
  
  Object.entries(queries).forEach(([key, query]) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        results[key] = { error: err.message };
      } else {
        results[key] = rows;
      }
      
      completed++;
      if (completed === total) {
        res.json(results);
      }
    });
  });
});

// Delete user
router.delete('/delete-user/:userId', authenticateToken, requireSuperAdmin, (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  // First, delete all user's business access
  db.run('DELETE FROM user_business_access WHERE user_id = ?', [userId], (err) => {
    if (err) {
      console.error('Error deleting user business access:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    // Then delete all user's bookings
    db.run('DELETE FROM bookings WHERE user_id = ?', [userId], (err) => {
      if (err) {
        console.error('Error deleting user bookings:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      // Finally, delete the user
      db.run('DELETE FROM users WHERE id = ? AND role != "superadmin"', [userId], function(err) {
        if (err) {
          console.error('Error deleting user:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(400).json({ message: 'User not found or cannot delete super admin' });
        }
        
        res.json({ message: 'User deleted successfully' });
      });
    });
  });
});

// Create new user (customer or admin)
router.post('/create-user', authenticateToken, requireSuperAdmin, (req, res) => {
  const { fullName, email, password, role, phone } = req.body;
  
  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  if (!['customer', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be customer or admin' });
  }
  
  // Check if user already exists
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Create new user
    const query = `
      INSERT INTO users (name, email, password, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(query, [fullName, email, hashedPassword, role, phone || null], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      res.json({ 
        message: `${role} user created successfully`,
        userId: this.lastID,
        user: {
          id: this.lastID,
          name: fullName,
          email: email,
          role: role,
          phone: phone
        }
      });
    });
  });
});

// Public endpoint to get platform pricing for landing page
router.get('/platform-pricing', (req, res) => {
  db.all('SELECT business_type, monthly_price, is_available, description FROM platform_config WHERE is_available = 1 ORDER BY business_type', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    res.json({ pricing: rows });
  });
});

module.exports = router;