const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { uid, email } = req.authUser;

    let roleName = 'user';
    if (email.includes('admin')) roleName = 'admin';
    else if (email.includes('guest')) roleName = 'guest';

    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
    if (roleResult.rows.length === 0) {
      return res.status(500).json({ error: 'Role not found in database' });
    }
    const roleId = roleResult.rows[0].id;

    const username = email.split('@')[0];

    const result = await pool.query(
      `INSERT INTO users (firebase_uid, username, password, role_id)
       VALUES ($1, $2, '', $3)
       ON CONFLICT (firebase_uid)
       DO UPDATE SET username = EXCLUDED.username, role_id = EXCLUDED.role_id
       RETURNING id, username, role_id`,
      [uid, username, roleId]
    );

    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        role: roleName
      }
    });
  } catch (err) {
    console.error('Sync error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
