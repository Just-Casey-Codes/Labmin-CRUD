const pool = require('./db');

async function migrate() {
  if (!pool) {
    console.error('DATABASE_URL is not set. Cannot run migrations.');
    process.exit(1);
  }

  try {
    console.log('Running migrations...');

    // Create roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      );
    `);
    console.log('✓ roles table created');

    // Seed default roles
    await pool.query(`
      INSERT INTO roles (name)
      VALUES ('admin'), ('user'), ('guest')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✓ roles seeded (admin, user, guest)');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role_id INT NOT NULL REFERENCES roles(id) DEFAULT 2,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ users table created');

    // Seed default admin user (role_id 1 = admin)
    const existing = await pool.query(`SELECT id FROM users WHERE username = 'admin'`);
    if (existing.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (username, password, role_id)
        VALUES ('admin', 'admin123', 1);
      `);
      console.log('✓ default admin user created (admin / admin123)');
    } else {
      console.log('✓ admin user already exists, skipping seed');
    }

    console.log('\nMigration complete!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
