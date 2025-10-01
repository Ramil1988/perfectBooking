const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database');

// Get current user's business access permissions
router.get('/permissions', authenticateToken, (req, res) => {
  const userId = req.user.userId || req.user.id;
  console.log('Getting permissions for user ID:', userId);
  
  const query = `
    SELECT 
      uba.business_type,
      uba.access_level,
      uba.is_active,
      uba.subscription_status,
      uba.subscription_start_date,
      uba.subscription_end_date,
      uba.monthly_price,
      pc.features,
      pc.description
    FROM user_business_access uba
    LEFT JOIN platform_config pc ON uba.business_type = pc.business_type
    WHERE uba.user_id = ? AND uba.is_active = 1
  `;
  
  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error('Database error in permissions:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    console.log('Raw permissions rows for user', userId, ':', rows);
    
    const permissions = rows.map(row => ({
      ...row,
      features: JSON.parse(row.features || '[]'),
      isExpired: row.subscription_end_date && new Date(row.subscription_end_date) < new Date()
    }));
    
    console.log('Processed permissions:', permissions);
    
    res.json({ permissions });
  });
});

// Get available business types for purchase
router.get('/available-business-types', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT 
      pc.*,
      CASE WHEN uba.id IS NOT NULL THEN 1 ELSE 0 END as has_access
    FROM platform_config pc
    LEFT JOIN user_business_access uba ON pc.business_type = uba.business_type AND uba.user_id = ? AND uba.is_active = 1
    WHERE pc.is_available = 1
    ORDER BY pc.monthly_price
  `;
  
  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    const businessTypes = rows.map(row => ({
      ...row,
      features: JSON.parse(row.features || '[]'),
      has_access: Boolean(row.has_access)
    }));
    
    res.json({ businessTypes });
  });
});

module.exports = router;