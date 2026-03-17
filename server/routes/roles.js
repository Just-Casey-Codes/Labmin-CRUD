const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM roles ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Get roles error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
