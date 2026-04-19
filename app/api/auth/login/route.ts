import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const rows = await sql`
    SELECT u.id, u.name, u.email, u.password_hash, r.role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.email = ${email.toLowerCase().trim()}
    LIMIT 1
  `;

  const user = rows[0];
  if (!user) {
    return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const role = user.role_name === 'admin' ? 'admin' : 'channel_partner';
  const token = await signToken({ userId: user.id, role, name: user.name });
  await setSessionCookie(token);

  return Response.json({ role, name: user.name });
}
