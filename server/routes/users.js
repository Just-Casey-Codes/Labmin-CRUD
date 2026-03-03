const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role } = req.body;

    if (role) {
      const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
      if (roleResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      if (username) {
        await pool.query(
          'UPDATE users SET username = $1, role_id = $2 WHERE id = $3',
          [username, roleResult.rows[0].id, id]
        );
      } else {
        await pool.query(
          'UPDATE users SET role_id = $1 WHERE id = $2',
          [roleResult.rows[0].id, id]
        );
      }
    } else if (username) {
      await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, id]);
    }

    const result = await pool.query(
      `SELECT u.id, u.username, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
