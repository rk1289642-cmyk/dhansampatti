// Seed script — creates the default admin user
// Usage: node scripts/seed-admin.mjs
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const DATABASE_URL =
  'postgresql://neondb_owner:npg_jvLMo7fYk5PJ@ep-winter-leaf-anlgz2gp-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(DATABASE_URL);

const ADMIN = {
  name: 'Super Admin',
  email: 'admin@dhansampatti.in',
  password: 'Admin@1234',
};

async function seed() {
  const hash = await bcrypt.hash(ADMIN.password, 12);

  const roleRows = await sql.query(`SELECT id FROM roles WHERE role_name = 'admin' LIMIT 1`);
  const roleId = roleRows[0]?.id;
  if (!roleId) throw new Error('admin role not found — run migrate first');

  await sql.query(
    `INSERT INTO users (name, email, password_hash, role_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [ADMIN.name, ADMIN.email, hash, roleId],
  );

  console.log(`\n✅  Admin seeded:\n    Email:    ${ADMIN.email}\n    Password: ${ADMIN.password}\n`);
  console.log('⚠️   Change this password immediately after first login!\n');
}

seed().catch(e => { console.error(e.message); process.exit(1); });
