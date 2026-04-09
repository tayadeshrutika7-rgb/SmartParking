// routes/reservations.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, checkAdmin } = require('./auth');

// ============ ADMIN ROUTES (must come first) ============

// GET all reservations with user details (admin dashboard)
router.get('/admin/details', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.res_id,
        r.plate_no,
        r.start_time,
        r.end_time,
        r.price,
        r.status,
        u.name as user_name,
        u.user_id,
        pl.location,
        v.vehicle_type
      FROM Reservation r
      LEFT JOIN Vehicle v ON r.plate_no = v.plate_no
      LEFT JOIN User u ON v.owner_id = u.user_id
      LEFT JOIN ParkingLot pl ON r.lot_id = pl.lot_id
      ORDER BY r.start_time DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET user-wise reservation summary (admin dashboard)
router.get('/admin/user-summary', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.user_id,
        u.name,
        COUNT(r.res_id) as total_reservations,
        SUM(CASE WHEN r.status = 'active' THEN 1 ELSE 0 END) as active_reservations,
        SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_reservations
      FROM User u
      LEFT JOIN Vehicle v ON u.user_id = v.owner_id
      LEFT JOIN Reservation r ON v.plate_no = r.plate_no
      WHERE u.role = 'driver'
      GROUP BY u.user_id, u.name
      ORDER BY u.name
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ REGULAR ROUTES ============

// GET all reservations
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, v.vehicle_type, pl.location 
      FROM Reservation r
      LEFT JOIN Vehicle v ON r.plate_no = v.plate_no
      LEFT JOIN ParkingLot pl ON r.lot_id = pl.lot_id
      ORDER BY r.start_time DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET reservations by vehicle
router.get('/vehicle/:plateNo', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, pl.location 
      FROM Reservation r
      LEFT JOIN ParkingLot pl ON r.lot_id = pl.lot_id
      WHERE r.plate_no = ?
      ORDER BY r.start_time DESC
    `, [req.params.plateNo]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET user's total spent on all reservations (completed + active)
router.get('/user/:userId/total-spent', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT COALESCE(SUM(r.price), 0) as total_spent
      FROM Reservation r
      LEFT JOIN Vehicle v ON r.plate_no = v.plate_no
      WHERE v.owner_id = ?
      AND r.status IN ('active', 'completed')
    `, [req.params.userId]);
    
    const totalSpent = rows.length > 0 ? parseFloat(rows[0].total_spent) : 0;
    res.json({ success: true, data: { total_spent: totalSpent } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new reservation
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { plate_no, lot_id, start_time, end_time, price } = req.body;
    
    // Check if parking lot has available spots
    const [lot] = await connection.query('SELECT available_spots FROM ParkingLot WHERE lot_id = ?', [lot_id]);
    
    if (lot[0].available_spots <= 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'No available spots' });
    }
    
    // Create reservation
    const [result] = await connection.query(
      'INSERT INTO Reservation (plate_no, lot_id, start_time, end_time, price) VALUES (?, ?, ?, ?, ?)',
      [plate_no, lot_id, start_time, end_time, price]
    );
    
    // Update available spots
    await connection.query(
      'UPDATE ParkingLot SET available_spots = available_spots - 1 WHERE lot_id = ?',
      [lot_id]
    );
    
    await connection.commit();
    res.status(201).json({ 
      success: true, 
      message: 'Reservation created successfully',
      res_id: result.insertId 
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// DELETE reservation (and free up parking spot) - ADMIN ONLY
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Get reservation details
    const [reservation] = await connection.query('SELECT lot_id FROM Reservation WHERE res_id = ?', [req.params.id]);
    
    if (reservation.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // Delete reservation
    await connection.query('DELETE FROM Reservation WHERE res_id = ?', [req.params.id]);
    
    // Update available spots
    await connection.query(
      'UPDATE ParkingLot SET available_spots = available_spots + 1 WHERE lot_id = ?',
      [reservation[0].lot_id]
    );
    
    await connection.commit();
    res.json({ success: true, message: 'Reservation cancelled successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;