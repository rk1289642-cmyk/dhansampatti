import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

// PATCH /api/users/channel-partners/[id] — admin only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { name, email, password, address, gender, cp_email, pan_card } = await request.json();

  if (!name || !email) {
    return Response.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  // Only update password_hash if a new password was provided
  const rows = password
    ? await sql`
        UPDATE users
        SET name          = ${name},
            email         = ${email.toLowerCase().trim()},
            password_hash = ${await bcrypt.hash(password, 12)},
            address       = ${address ?? null},
            gender        = ${gender ?? null},
            cp_email      = ${cp_email ?? null},
            pan_card      = ${pan_card ?? null}
        WHERE id = ${id}
        RETURNING id, name, email
      `
    : await sql`
        UPDATE users
        SET name     = ${name},
            email    = ${email.toLowerCase().trim()},
            address  = ${address ?? null},
            gender   = ${gender ?? null},
            cp_email = ${cp_email ?? null},
            pan_card = ${pan_card ?? null}
        WHERE id = ${id}
        RETURNING id, name, email
      `;

  if (!rows.length) {
    return Response.json({ error: 'Channel partner not found.' }, { status: 404 });
  }

  return Response.json(rows[0]);
}

// DELETE /api/users/channel-partners/[id] — admin only
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  // Prevent deletion if the CP has active leads
  const leadCheck = await sql`SELECT COUNT(*) AS count FROM leads WHERE cp_id = ${id}`;
  if (Number(leadCheck[0].count) > 0) {
    return Response.json(
      { error: 'Cannot delete: this partner has active leads. Reassign or delete leads first.' },
      { status: 409 }
    );
  }

  const rows = await sql`DELETE FROM users WHERE id = ${id} RETURNING id`;
  if (!rows.length) {
    return Response.json({ error: 'Channel partner not found.' }, { status: 404 });
  }

  return Response.json({ success: true });
}
