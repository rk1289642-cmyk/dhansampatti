import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/users/channel-partners — admin only
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await sql`
    SELECT u.id, u.name, u.email, u.address, u.gender, u.cp_email, u.pan_card, u.created_at,
           COUNT(l.id)::text AS lead_count
    FROM users u
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN leads l ON l.cp_id = u.id
    WHERE r.role_name = 'channel_partner'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;

  return Response.json(rows);
}

// POST /api/users/channel-partners — admin only
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, email, password, address, gender, cp_email, pan_card } = await request.json();

  if (!name || !email || !password) {
    return Response.json({ error: 'Name, email and password are required.' }, { status: 400 });
  }

  const cpRoleRow = await sql`SELECT id FROM roles WHERE role_name = 'channel_partner' LIMIT 1`;
  const roleId = cpRoleRow[0]?.id;

  const hash = await bcrypt.hash(password, 12);

  const rows = await sql`
    INSERT INTO users (name, email, password_hash, address, gender, cp_email, pan_card, role_id)
    VALUES (${name}, ${email.toLowerCase().trim()}, ${hash}, ${address ?? null},
            ${gender ?? null}, ${cp_email ?? null}, ${pan_card ?? null}, ${roleId})
    RETURNING id, name, email
  `;

  return Response.json(rows[0], { status: 201 });
}
