import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, email, password, address, gender, cp_email, pan_card } = await request.json();

  if (!name || !email) {
    return Response.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  try {
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await sql`
        UPDATE users 
        SET name = ${name}, email = ${email.toLowerCase().trim()}, password_hash = ${hash}, 
            address = ${address ?? null}, gender = ${gender ?? null}, cp_email = ${cp_email ?? null}, 
            pan_card = ${pan_card ?? null}
        WHERE id = ${session.userId}
      `;
    } else {
      await sql`
        UPDATE users 
        SET name = ${name}, email = ${email.toLowerCase().trim()}, 
            address = ${address ?? null}, gender = ${gender ?? null}, cp_email = ${cp_email ?? null}, 
            pan_card = ${pan_card ?? null}
        WHERE id = ${session.userId}
      `;
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
