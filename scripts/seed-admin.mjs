import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

// Seed script — creates the default admin user

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL env variable is not set.");
}

const sql = neon(DATABASE_URL);

const ADMIN = {
    name: "Super Admin",
    email: "admin@dhansampatti.in",
    password: "Admin@1234",
};

async function seed() {
    const hash = await bcrypt.hash(ADMIN.password, 12);

    const roleRows = await sql.query(
        `SELECT id FROM roles WHERE role_name = 'admin' LIMIT 1`
    );

    const roleId = roleRows[0]?.id;

    if (!roleId) {
        throw new Error("admin role not found — run migrate first");
    }

    await sql.query(
        `INSERT INTO users (name, email, password_hash, role_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [ADMIN.name, ADMIN.email, hash, roleId]
    );

    console.log(`✅ Admin seeded: ${ADMIN.email}`);
}

seed().catch((e) => {
    console.error(e);
    process.exit(1);
});