// routes/vehicles.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all vehicles
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT v.*, u.name as owner_name 
      FROM Vehicle v 
      LEFT JOIN User u ON v.owner_id = u.user_id
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET vehicles by owner
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Vehicle WHERE owner_id = ?', [req.params.ownerId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new vehicle
router.post('/', async (req, res) => {
  try {
    const { plate_no, owner_id, vehicle_type } = req.body;
    await db.query(
      'INSERT INTO Vehicle (plate_no, owner_id, vehicle_type) VALUES (?, ?, ?)',
      [plate_no, owner_id, vehicle_type]
    );
    res.status(201).json({ 
      success: true, 
      message: 'Vehicle registered successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE vehicle
router.delete('/:plateNo', async (req, res) => {
  try {
    await db.query('DELETE FROM Vehicle WHERE plate_no = ?', [req.params.plateNo]);
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;