const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const distPath = path.join(__dirname, '../dist/labmin-app/browser');
console.log('Dist exists?', fs.existsSync(distPath));

app.use(express.static(distPath));

app.get(/^\/.*$/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
app.get('/api/test', async (req, res) => {
  try {
    res.json({ now: new Date() });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));