// routes/parkingLots.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all parking lots
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ParkingLot');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single parking lot by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ParkingLot WHERE lot_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new parking lot (admin only)
router.post('/', async (req, res) => {
  try {
    const { location, total_spots, available_spots, hourly_rate } = req.body;
    const [result] = await db.query(
      'INSERT INTO ParkingLot (location, total_spots, available_spots, hourly_rate) VALUES (?, ?, ?, ?)',
      [location, total_spots, available_spots, hourly_rate]
    );
    res.status(201).json({ 
      success: true, 
      message: 'Parking lot created successfully',
      lot_id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update parking lot
router.put('/:id', async (req, res) => {
  try {
    const { location, total_spots, available_spots, hourly_rate } = req.body;
    await db.query(
      'UPDATE ParkingLot SET location = ?, total_spots = ?, available_spots = ?, hourly_rate = ? WHERE lot_id = ?',
      [location, total_spots, available_spots, hourly_rate, req.params.id]
    );
    res.json({ success: true, message: 'Parking lot updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE parking lot
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM ParkingLot WHERE lot_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Parking lot deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;