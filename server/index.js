const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());

// API routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const rolesRoutes = require('./routes/roles');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);

// Keep /api/test for quick health checks
app.get('/api/test', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Serve Angular static files
const distPath = path.join(__dirname, '../dist/labmin-app/browser');
app.use(express.static(distPath));

app.get('/{*path}', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found. Build may have failed.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));