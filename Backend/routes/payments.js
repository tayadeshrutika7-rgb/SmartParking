// routes/payments.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all payments
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, r.plate_no, r.lot_id 
      FROM Payment p
      LEFT JOIN Reservation r ON p.res_id = r.res_id
      ORDER BY p.pay_date DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET payment by reservation ID
router.get('/reservation/:resId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Payment WHERE res_id = ?', [req.params.resId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new payment
router.post('/', async (req, res) => {
  try {
    const { res_id, amount, method, pay_date } = req.body;
    const [result] = await db.query(
      'INSERT INTO Payment (res_id, amount, method, pay_date) VALUES (?, ?, ?, ?)',
      [res_id, amount, method, pay_date || new Date()]
    );
    res.status(201).json({ 
      success: true, 
      message: 'Payment processed successfully',
      pay_id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;