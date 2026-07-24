'use strict';

const bcrypt = require('bcryptjs');
const { pool, initDB } = require('../db');

async function main() {
  const email = String(process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('PROVISION_ADMIN_EMAIL and a password of at least 12 characters are required');
  }
  await initDB();
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (email, password, full_name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password, full_name = EXCLUDED.full_name, role = 'admin'`,
    [email, hash, 'Runtime Administrator']
  );
  await pool.end();
}

main().catch((error) => {
  console.error(`Runtime database initialization failed: ${error.message}`);
  process.exitCode = 1;
});
