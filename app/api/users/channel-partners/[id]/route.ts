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
  const {
    name, email, password, address, gender, cp_email, pan_card,
    mobile_no, dob, aadhar_no, bank_name, account_no,
    ifsc_code, office_address, pin_code,
  } = await request.json();

  if (!name || !email) {
    return Response.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  const commonFields = sql`
    name          = ${name},
    email         = ${email.toLowerCase().trim()},
    address       = ${address ?? null},
    gender        = ${gender ?? null},
    cp_email      = ${cp_email ?? null},
    pan_card      = ${pan_card ?? null},
    mobile_no     = ${mobile_no ?? null},
    dob           = ${dob ?? null},
    aadhar_no     = ${aadhar_no ?? null},
    bank_name     = ${bank_name ?? null},
    account_no    = ${account_no ?? null},
    ifsc_code     = ${ifsc_code ?? null},
    office_address= ${office_address ?? null},
    pin_code      = ${pin_code ?? null}
  `;

  const rows = password
    ? await sql`
        UPDATE users
        SET ${commonFields},
            password_hash = ${await bcrypt.hash(password, 12)}
        WHERE id = ${id}
        RETURNING id, name, email
      `
    : await sql`
        UPDATE users
        SET ${commonFields}
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
