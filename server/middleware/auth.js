const admin = require('firebase-admin');
const pool = require('../db');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    let role = 'user';
    if (pool) {
      const result = await pool.query(
        `SELECT r.name as role
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.firebase_uid = $1`,
        [decoded.uid]
      );
      if (result.rows.length > 0) {
        role = result.rows[0].role;
      } else {
        const email = decoded.email || '';
        if (email.includes('admin')) role = 'admin';
        else if (email.includes('guest')) role = 'guest';
      }
    }

    req.authUser = { uid: decoded.uid, email: decoded.email, role };
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function verifyAdmin(req, res, next) {
  if (req.authUser?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin access required' });
  }
  next();
}

module.exports = { verifyToken, verifyAdmin };
