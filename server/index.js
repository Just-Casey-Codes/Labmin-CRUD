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
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Serve Angular build
const distPath = path.join(__dirname, '../dist/labmin-app/browser');
console.log('Dist exists?', fs.existsSync(distPath));

app.use(express.static(distPath));

// Angular catch-all LAST (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));