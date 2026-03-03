const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());

// API routes FIRST (before static/catch-all)
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

const distPath = path.join(__dirname, '../dist/labmin-app/browser');
console.log('Dist path:', distPath);
console.log('Dist exists?', fs.existsSync(distPath));

// List files in dist for debugging
if (fs.existsSync(distPath)) {
  console.log('Dist contents:', fs.readdirSync(distPath));
} else {
  console.log('WARNING: dist folder not found! Checking parent...');
  const parentDist = path.join(__dirname, '../dist');
  if (fs.existsSync(parentDist)) {
    console.log('Parent dist contents:', fs.readdirSync(parentDist));
  }
}

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