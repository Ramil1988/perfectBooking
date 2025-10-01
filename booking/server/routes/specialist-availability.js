const express = require('express');
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get specialist availability for a specific date range with booking filtering
router.get('/', authenticateToken, (req, res) => {
  const { specialist_id, business_type, start_date, end_date } = req.query;

  let query = 'SELECT * FROM specialist_availability WHERE 1=1';
  let params = [];

  if (specialist_id) {
    query += ' AND specialist_id = ?';
    params.push(specialist_id);
  }

  if (business_type) {
    query += ' AND business_type = ?';
    params.push(business_type);
  }

  if (start_date) {
    query += ' AND date >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND date <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY date ASC, start_time ASC';

  db.all(query, params, (err, availability) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    console.log(`Availability query: ${query}`);
    console.log(`Availability params: ${JSON.stringify(params)}`);
    console.log(`Availability results: ${JSON.stringify(availability)}`);

    // For each availability slot, generate available time slots and filter out booked ones
    const processedAvailability = [];
    let processedCount = 0;

    if (availability.length === 0) {
      return res.json({ availability: [] });
    }

    availability.forEach((slot, index) => {
      // Get bookings for this specialist on this date
      db.all(
        'SELECT appointment_time, duration FROM bookings WHERE staff_id = ? AND appointment_date = ? AND status = "confirmed"',
        [slot.specialist_id, slot.date],
        (err, bookings) => {
          if (err) {
            console.error('Error fetching bookings:', err);
            processedCount++;
            if (processedCount === availability.length) {
              res.json({ availability: processedAvailability });
            }
            return;
          }

          // Generate available time slots
          const timeSlots = [];
          const startTime = new Date(`1970-01-01T${slot.start_time}`);
          const endTime = new Date(`1970-01-01T${slot.end_time}`);

          // Generate hourly slots between start and end time
          for (let time = new Date(startTime); time < endTime; time.setHours(time.getHours() + 1)) {
            const timeSlot = time.toTimeString().slice(0, 5);
            const isBooked = bookings.some(booking => booking.appointment_time === timeSlot);

            if (!isBooked) {
              timeSlots.push(timeSlot);
            }
          }

          // Add processed slot with available times
          processedAvailability.push({
            ...slot,
            available_times: timeSlots
          });

          processedCount++;
          if (processedCount === availability.length) {
            res.json({ availability: processedAvailability });
          }
        }
      );
    });
  });
});

// Create specialist availability
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { specialist_id, business_type, date, start_time, end_time, is_available, notes } = req.body;
  
  if (!specialist_id || !business_type || !date || !start_time || !end_time) {
    return res.status(400).json({ message: 'Specialist, business type, date, start time, and end time are required' });
  }
  
  // Validate date is not in the past
  const today = new Date().toISOString().split('T')[0];
  if (date < today) {
    return res.status(400).json({ message: 'Cannot set availability for past dates' });
  }
  
  // Check for overlapping availability
  db.get(
    `SELECT COUNT(*) as count FROM specialist_availability 
     WHERE specialist_id = ? AND business_type = ? AND date = ? 
     AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))`,
    [specialist_id, business_type, date, start_time, start_time, end_time, end_time, start_time, end_time],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      
      if (result.count > 0) {
        return res.status(400).json({ message: 'Overlapping availability already exists' });
      }
      
      db.run(
        'INSERT INTO specialist_availability (specialist_id, business_type, date, start_time, end_time, is_available, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [specialist_id, business_type, date, start_time, end_time, is_available || 1, notes],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating availability' });
          }
          
          res.status(201).json({
            message: 'Availability created successfully',
            availability: {
              id: this.lastID,
              specialist_id,
              business_type,
              date,
              start_time,
              end_time,
              is_available: is_available || 1,
              notes
            }
          });
        }
      );
    }
  );
});

// Update specialist availability
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { date, start_time, end_time, is_available, notes } = req.body;
  
  if (!date || !start_time || !end_time) {
    return res.status(400).json({ message: 'Date, start time, and end time are required' });
  }
  
  // Validate date is not in the past
  const today = new Date().toISOString().split('T')[0];
  if (date < today) {
    return res.status(400).json({ message: 'Cannot set availability for past dates' });
  }
  
  db.run(
    'UPDATE specialist_availability SET date = ?, start_time = ?, end_time = ?, is_available = ?, notes = ? WHERE id = ?',
    [date, start_time, end_time, is_available !== undefined ? is_available : 1, notes, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating availability' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Availability not found' });
      }
      
      res.json({
        message: 'Availability updated successfully',
        availability: {
          id: parseInt(id),
          date,
          start_time,
          end_time,
          is_available: is_available !== undefined ? is_available : 1,
          notes
        }
      });
    }
  );
});

// Delete specialist availability
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM specialist_availability WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting availability' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Availability not found' });
    }
    
    res.json({ message: 'Availability deleted successfully' });
  });
});

// Get affected bookings when changing availability
router.get('/:id/affected-bookings', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  // First get the availability record
  db.get('SELECT * FROM specialist_availability WHERE id = ?', [id], (err, availability) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    
    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }
    
    // Find bookings that would be affected
    db.all(
      `SELECT b.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.staff_id = ? AND b.appointment_date = ? 
       AND b.appointment_time >= ? AND b.appointment_time < ? 
       AND b.status = 'confirmed'`,
      [availability.specialist_id, availability.date, availability.start_time, availability.end_time],
      (err, bookings) => {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }
        
        res.json({ 
          availability,
          affected_bookings: bookings 
        });
      }
    );
  });
});

module.exports = router;