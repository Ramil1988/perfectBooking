const express = require('express');
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { date, status } = req.query;
  console.log(`DEBUG: GET /api/bookings - date: ${date}, status: ${status}, user role: ${req.user.role}`);
  
  let query = `SELECT b.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
               s.name as therapist_name, s.specialty as therapist_specialty
               FROM bookings b 
               JOIN users u ON b.user_id = u.id
               LEFT JOIN specialists s ON CAST(b.staff_id AS INTEGER) = s.id`;
  let params = [];

  const conditions = [];
  
  if (req.user.role !== 'admin') {
    conditions.push('b.user_id = ?');
    params.push(req.user.userId);
  }
  
  if (date) {
    conditions.push('b.appointment_date = ?');
    params.push(date);
  }
  
  if (status) {
    conditions.push('b.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY b.appointment_date DESC, b.appointment_time DESC';

  db.all(query, params, (err, bookings) => {
    if (err) {
      console.error('DEBUG: Bookings query error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    console.log(`DEBUG: Found ${bookings.length} bookings`);
    console.log('DEBUG: Bookings data:', bookings.map(b => ({ id: b.id, date: b.appointment_date, time: b.appointment_time, business_type: b.business_type, staff_id: b.staff_id })));
    res.json({ bookings });
  });
});

router.post('/', authenticateToken, async (req, res) => {
  const { service_name, appointment_date, appointment_time, duration, notes, user_id, business_type, staff_id, resource_id, metadata } = req.body;

  console.log('Received booking request:', {
    service_name, appointment_date, appointment_time, duration, notes, user_id, business_type, staff_id, resource_id, metadata
  });

  if (!service_name || !appointment_date || !appointment_time) {
    return res.status(400).json({ message: 'Service name, date, and time are required' });
  }

  const targetUserId = req.user.role === 'admin' && user_id ? user_id : req.user.userId;
  const createdBy = req.user.role === 'admin' ? req.user.userId : null;
  
  const bookingDuration = duration || 60;
  const bookingStartTime = new Date(`1970-01-01T${appointment_time}`);
  const bookingEndTime = new Date(bookingStartTime.getTime() + (bookingDuration * 60 * 1000));
  const bookingEndTimeString = bookingEndTime.toTimeString().slice(0, 5);
  
  console.log(`DEBUG: Booking validation - Start: ${appointment_time}, Duration: ${bookingDuration}min, End: ${bookingEndTimeString}`);

  // First validate that the booking time is within specialist's available hours (if staff_id is provided)
  if (staff_id) {
    try {
      console.log(`DEBUG: Checking specialist availability for staff_id: ${staff_id}, date: ${appointment_date}`);
      
      // Check if specialist has availability for this date and time
      const availabilityQuery = `SELECT * FROM specialist_availability 
                                 WHERE specialist_id = ? AND date = ? AND is_available = 1
                                 AND start_time <= ? AND end_time >= ?`;
      const availabilityParams = [staff_id, appointment_date, appointment_time, bookingEndTimeString];
      
      console.log(`DEBUG: Availability query: ${availabilityQuery}`);
      console.log(`DEBUG: Availability params: ${JSON.stringify(availabilityParams)}`);
      
      const availabilityResult = await new Promise((resolve, reject) => {
        db.get(availabilityQuery, availabilityParams, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      console.log(`DEBUG: Availability result: ${JSON.stringify(availabilityResult)}`);
      
      if (!availabilityResult) {
        return res.status(400).json({ 
          message: `Specialist is not available for the selected time slot (${appointment_time} - ${bookingEndTimeString}). Please check their working hours.`
        });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      return res.status(500).json({ message: 'Error validating availability' });
    }
  }

  // Check for conflicts based on resource type and booking duration
  let conflictQuery;
  let conflictParams;
  
  if (resource_id) {
    // For resource-based bookings, check if the specific resource is booked with overlap detection
    conflictQuery = `SELECT COUNT(*) as count FROM bookings 
                     WHERE appointment_date = ? AND resource_id = ? AND status = "confirmed"
                     AND (
                       (appointment_time < ? AND TIME(appointment_time, '+' || duration || ' minutes') > ?)
                       OR (appointment_time >= ? AND appointment_time < ?)
                     )`;
    conflictParams = [appointment_date, resource_id, bookingEndTimeString, appointment_time, appointment_time, bookingEndTimeString];
  } else if (staff_id) {
    // For staff-based bookings (specialists), check if the specific staff is booked with overlap detection
    conflictQuery = `SELECT COUNT(*) as count FROM bookings 
                     WHERE appointment_date = ? AND staff_id = ? AND status = "confirmed"
                     AND (
                       (appointment_time < ? AND TIME(appointment_time, '+' || duration || ' minutes') > ?)
                       OR (appointment_time >= ? AND appointment_time < ?)
                     )`;
    conflictParams = [appointment_date, staff_id, bookingEndTimeString, appointment_time, appointment_time, bookingEndTimeString];
  } else {
    // Fallback to general time slot check with overlap detection
    conflictQuery = `SELECT COUNT(*) as count FROM bookings 
                     WHERE appointment_date = ? AND status = "confirmed"
                     AND (
                       (appointment_time < ? AND TIME(appointment_time, '+' || duration || ' minutes') > ?)
                       OR (appointment_time >= ? AND appointment_time < ?)
                     )`;
    conflictParams = [appointment_date, bookingEndTimeString, appointment_time, appointment_time, bookingEndTimeString];
  }

  db.get(conflictQuery, conflictParams, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (result.count > 0) {
      const resourceType = resource_id ? 'resource' : (staff_id ? 'staff member' : 'time slot');
      return res.status(400).json({ message: `This ${resourceType} is already booked for the selected time` });
    }

      db.run(
        'INSERT INTO bookings (user_id, service_name, appointment_date, appointment_time, duration, notes, created_by, business_type, staff_id, resource_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [targetUserId, service_name, appointment_date, appointment_time, duration || 60, notes, createdBy, business_type || 'general', staff_id || null, resource_id || null, metadata ? JSON.stringify(metadata) : null],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating booking' });
          }

          db.get(
            `SELECT b.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone 
             FROM bookings b 
             JOIN users u ON b.user_id = u.id 
             WHERE b.id = ?`,
            [this.lastID],
            (err, booking) => {
              if (err) {
                return res.status(500).json({ message: 'Error retrieving booking' });
              }

              res.status(201).json({
                message: 'Booking created successfully',
                booking
              });
            }
          );
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, notes, service_name, appointment_date, appointment_time, duration, business_type, staff_id, resource_id, metadata } = req.body;

  db.get('SELECT * FROM bookings WHERE id = ?', [id], (err, booking) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && booking.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check for time slot conflicts if date/time is being changed
    if ((appointment_date && appointment_date !== booking.appointment_date) || 
        (appointment_time && appointment_time !== booking.appointment_time)) {
      
      const checkDate = appointment_date || booking.appointment_date;
      const checkTime = appointment_time || booking.appointment_time;
      
      db.get(
        'SELECT COUNT(*) as count FROM bookings WHERE appointment_date = ? AND appointment_time = ? AND status = "confirmed" AND id != ?',
        [checkDate, checkTime, id],
        (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Server error' });
          }

          if (result.count > 0) {
            return res.status(400).json({ message: 'Time slot already booked' });
          }

          performUpdate();
        }
      );
    } else {
      performUpdate();
    }

    function performUpdate() {
      const updates = [];
      const params = [];

      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }

      if (notes !== undefined) {
        updates.push('notes = ?');
        params.push(notes);
      }

      if (service_name !== undefined) {
        updates.push('service_name = ?');
        params.push(service_name);
      }

      if (appointment_date !== undefined) {
        updates.push('appointment_date = ?');
        params.push(appointment_date);
      }

      if (appointment_time !== undefined) {
        updates.push('appointment_time = ?');
        params.push(appointment_time);
      }

      if (duration !== undefined) {
        updates.push('duration = ?');
        params.push(duration);
      }

      if (business_type !== undefined) {
        updates.push('business_type = ?');
        params.push(business_type);
      }

      if (staff_id !== undefined) {
        updates.push('staff_id = ?');
        params.push(staff_id);
      }

      if (resource_id !== undefined) {
        updates.push('resource_id = ?');
        params.push(resource_id);
      }

      if (metadata !== undefined) {
        updates.push('metadata = ?');
        params.push(metadata ? JSON.stringify(metadata) : null);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      params.push(id);

    db.run(
      `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error updating booking' });
        }

        db.get(
          `SELECT b.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone 
           FROM bookings b 
           JOIN users u ON b.user_id = u.id 
           WHERE b.id = ?`,
          [id],
          (err, updatedBooking) => {
            if (err) {
              return res.status(500).json({ message: 'Error retrieving updated booking' });
            }

            res.json({
              message: 'Booking updated successfully',
              booking: updatedBooking
            });
          }
        );
      }
    );
    }
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM bookings WHERE id = ?', [id], (err, booking) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && booking.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    db.run('DELETE FROM bookings WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error deleting booking' });
      }

      res.json({ message: 'Booking deleted successfully' });
    });
  });
});

router.get('/available-slots', (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  const dayOfWeek = new Date(date).getDay();
  const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

  db.get(
    'SELECT start_time, end_time FROM business_hours WHERE day_of_week = ? AND is_available = 1',
    [adjustedDayOfWeek],
    (err, businessHour) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (!businessHour) {
        return res.json({ availableSlots: [] });
      }

      db.all(
        'SELECT appointment_time FROM bookings WHERE appointment_date = ? AND status = "confirmed"',
        [date],
        (err, bookedSlots) => {
          if (err) {
            return res.status(500).json({ message: 'Server error' });
          }

          const bookedTimes = bookedSlots.map(slot => slot.appointment_time);
          const availableSlots = generateTimeSlots(businessHour.start_time, businessHour.end_time, bookedTimes);

          res.json({ availableSlots });
        }
      );
    }
  );
});

function generateTimeSlots(startTime, endTime, bookedTimes) {
  const slots = [];
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  
  for (let time = new Date(start); time < end; time.setHours(time.getHours() + 1)) {
    const timeString = time.toTimeString().slice(0, 5);
    if (!bookedTimes.includes(timeString)) {
      slots.push(timeString);
    }
  }
  
  return slots;
}

module.exports = router;