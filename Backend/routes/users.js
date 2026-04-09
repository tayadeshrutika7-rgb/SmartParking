// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// GET all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, name, phone, email, role FROM User');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, name, phone, email, role FROM User WHERE user_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, role } = req.body;
    const [result] = await db.query(
      'INSERT INTO User (name, phone, email, role) VALUES (?, ?, ?, ?)',
      [name, phone, email, role || 'driver']
    );
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      user_id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, role } = req.body;
    await db.query(
      'UPDATE User SET name = ?, phone = ?, email = ?, role = ? WHERE user_id = ?',
      [name, phone, email, role, req.params.id]
    );
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM User WHERE user_id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;