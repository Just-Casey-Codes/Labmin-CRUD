const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.password, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0 || result.rows[0].password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const roleName = username.toLowerCase().includes('admin') ? 'admin' : 'user';
    const roleResult = await pool.query("SELECT id FROM roles WHERE name = $1", [roleName]);
    const roleId = roleResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO users (username, password, role_id) VALUES ($1, $2, $3)
       RETURNING id, username`,
      [username, password, roleId]
    );

    const newUser = result.rows[0];
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: { id: newUser.id, username: newUser.username, role: roleName }
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
