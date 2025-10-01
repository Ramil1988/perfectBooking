const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT id, name, email, role, phone, created_at FROM users WHERE role != "superadmin" ORDER BY created_at DESC', (err, users) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    res.json({ users });
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  if (req.user.role !== 'admin' && req.user.userId !== parseInt(id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  db.get('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  });
});

// Create new customer (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, email, password, phone, role = 'customer' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Email already exists' });
          }
          return res.status(500).json({ message: 'Error creating user' });
        }

        res.status(201).json({
          message: 'User created successfully',
          user: { id: this.lastID, name, email, role, phone }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    db.run(
      'UPDATE users SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?',
      [name, email, phone, role, id],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Email already exists' });
          }
          return res.status(500).json({ message: 'Error updating user' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({
          message: 'User updated successfully',
          user: { id: parseInt(id), name, email, phone, role }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (parseInt(id) === req.user.userId) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  db.run('DELETE FROM users WHERE id = ? AND role != "superadmin"', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting user' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found or cannot delete superadmin' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;