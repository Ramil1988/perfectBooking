const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Get all services for a business type
router.get('/', (req, res) => {
  const { business_type } = req.query;
  
  let query = 'SELECT * FROM services WHERE is_active = 1';
  let params = [];
  
  if (business_type) {
    query += ' AND business_type = ?';
    params.push(business_type);
  }
  
  query += ' ORDER BY name';
  
  db.all(query, params, (err, services) => {
    if (err) {
      console.error('Error fetching services:', err);
      return res.status(500).json({ message: 'Error fetching services' });
    }
    res.json({ services });
  });
});

// Get single service
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM services WHERE id = ?', [id], (err, service) => {
    if (err) {
      console.error('Error fetching service:', err);
      return res.status(500).json({ message: 'Error fetching service' });
    }
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json({ service });
  });
});

// Create new service (admin only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  const { name, business_type, description, price, duration } = req.body;
  
  if (!name || !business_type) {
    return res.status(400).json({ message: 'Name and business type are required' });
  }
  
  const query = `
    INSERT INTO services (name, business_type, description, price, duration)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [name, business_type, description, price, duration || 60], function(err) {
    if (err) {
      console.error('Error creating service:', err);
      return res.status(500).json({ message: 'Error creating service' });
    }
    
    res.status(201).json({ 
      message: 'Service created successfully',
      service: { id: this.lastID, name, business_type, description, price, duration }
    });
  });
});

// Update service (admin only)
router.put('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  const { id } = req.params;
  const { name, business_type, description, price, duration, is_active } = req.body;
  
  if (!name || !business_type) {
    return res.status(400).json({ message: 'Name and business type are required' });
  }
  
  const query = `
    UPDATE services 
    SET name = ?, business_type = ?, description = ?, price = ?, duration = ?, is_active = ?
    WHERE id = ?
  `;
  
  db.run(query, [name, business_type, description, price, duration, is_active !== undefined ? is_active : 1, id], function(err) {
    if (err) {
      console.error('Error updating service:', err);
      return res.status(500).json({ message: 'Error updating service' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Fetch the updated service to return it
    db.get('SELECT * FROM services WHERE id = ?', [id], (err, updatedService) => {
      if (err) {
        console.error('Error fetching updated service:', err);
        return res.status(500).json({ message: 'Error fetching updated service' });
      }
      
      res.json({ 
        message: 'Service updated successfully',
        service: updatedService
      });
    });
  });
});

// Delete service (admin only) - soft delete
router.delete('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  const { id } = req.params;
  
  db.run('UPDATE services SET is_active = 0 WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting service:', err);
      return res.status(500).json({ message: 'Error deleting service' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json({ message: 'Service deleted successfully' });
  });
});

module.exports = router;