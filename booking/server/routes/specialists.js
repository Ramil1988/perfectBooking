const express = require('express');
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all specialists for a business type
router.get('/', authenticateToken, (req, res) => {
  const { business_type } = req.query;
  
  let query = 'SELECT * FROM specialists WHERE is_active = 1';
  let params = [];
  
  if (business_type) {
    query += ' AND business_type = ?';
    params.push(business_type);
  }
  
  query += ' ORDER BY name ASC';
  
  db.all(query, params, (err, specialists) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    res.json({ specialists });
  });
});

// Get specialist by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM specialists WHERE id = ? AND is_active = 1', [id], (err, specialist) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (!specialist) {
      return res.status(404).json({ message: 'Specialist not found' });
    }

    res.json({ specialist });
  });
});

// Create new specialist (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, specialty, business_type, email, phone } = req.body;

  if (!name || !specialty || !business_type) {
    return res.status(400).json({ message: 'Name, specialty, and business type are required' });
  }

  db.run(
    'INSERT INTO specialists (name, specialty, business_type, email, phone) VALUES (?, ?, ?, ?, ?)',
    [name, specialty, business_type, email, phone],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating specialist' });
      }

      res.status(201).json({
        message: 'Specialist created successfully',
        specialist: { id: this.lastID, name, specialty, business_type, email, phone, is_active: 1 }
      });
    }
  );
});

// Update specialist (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, specialty, business_type, email, phone, is_active } = req.body;

  if (!name || !specialty || !business_type) {
    return res.status(400).json({ message: 'Name, specialty, and business type are required' });
  }

  db.run(
    'UPDATE specialists SET name = ?, specialty = ?, business_type = ?, email = ?, phone = ?, is_active = ? WHERE id = ?',
    [name, specialty, business_type, email, phone, is_active !== undefined ? is_active : 1, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating specialist' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Specialist not found' });
      }

      res.json({
        message: 'Specialist updated successfully',
        specialist: { id: parseInt(id), name, specialty, business_type, email, phone, is_active: is_active !== undefined ? is_active : 1 }
      });
    }
  );
});

// Delete specialist (Admin only) - Soft delete by setting is_active to false
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE specialists SET is_active = 0 WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting specialist' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Specialist not found' });
    }

    res.json({ message: 'Specialist deleted successfully' });
  });
});

// Get specialist availability for a specific date
router.get('/:id/availability', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ message: 'Date parameter is required' });
  }

  // Get specialist's availability from the database for the specific date
  db.get(
    'SELECT * FROM specialist_availability WHERE specialist_id = ? AND date = ? AND is_available = 1',
    [id, date],
    (err, availability) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (!availability) {
        return res.json({ availability: [] }); // No availability for this date
      }

      // Get all bookings for this specialist on the given date
      db.all(
        'SELECT appointment_time, duration FROM bookings WHERE staff_id = ? AND appointment_date = ? AND status = "confirmed"',
        [id, date],
        (err, bookings) => {
          if (err) {
            return res.status(500).json({ message: 'Server error' });
          }

          // Generate available slots based on specialist's actual working hours
          const slots = [];
          const startTime = new Date(`1970-01-01T${availability.start_time}`);
          const endTime = new Date(`1970-01-01T${availability.end_time}`);
          
          // Generate hourly slots between start and end time
          for (let time = new Date(startTime); time < endTime; time.setHours(time.getHours() + 1)) {
            const timeSlot = time.toTimeString().slice(0, 5);
            const isBooked = bookings.some(booking => booking.appointment_time === timeSlot);
            
            slots.push({
              time: timeSlot,
              available: !isBooked
            });
          }
          res.json({ availability: slots });
        }
      );
    }
  );
});

module.exports = router;