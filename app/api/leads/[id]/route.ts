import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

// PATCH /api/leads/[id] — update a lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { full_name, phone, dob, status_id, loan_number, loan_type_id, cp_id } = body;

  if (!full_name || !phone || !status_id || !loan_type_id) {
    return Response.json(
      { error: 'full_name, phone, status_id and loan_type_id are required.' },
      { status: 400 }
    );
  }

  // Channel partners can only edit their own leads
  const ownershipCheck =
    session.role === 'channel_partner'
      ? await sql`SELECT id FROM leads WHERE id = ${id} AND cp_id = ${session.userId}`
      : await sql`SELECT id FROM leads WHERE id = ${id}`;

  if (!ownershipCheck.length) {
    return Response.json({ error: 'Lead not found or access denied.' }, { status: 404 });
  }

  const effectiveCpId =
    session.role === 'admin' ? (cp_id ?? session.userId) : session.userId;

  const rows = await sql`
    UPDATE leads
    SET full_name    = ${full_name},
        phone        = ${phone},
        dob          = ${dob ?? null},
        status_id    = ${status_id},
        loan_number  = ${loan_number ?? null},
        loan_type_id = ${loan_type_id},
        cp_id        = ${effectiveCpId}
    WHERE id = ${id}
    RETURNING *
  `;

  return Response.json(rows[0]);
}

// DELETE /api/leads/[id] — admin only (or CP deleting own lead)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Channel partners can only delete their own leads
  const ownershipCheck =
    session.role === 'channel_partner'
      ? await sql`SELECT id FROM leads WHERE id = ${id} AND cp_id = ${session.userId}`
      : await sql`SELECT id FROM leads WHERE id = ${id}`;

  if (!ownershipCheck.length) {
    return Response.json({ error: 'Lead not found or access denied.' }, { status: 404 });
  }

  await sql`DELETE FROM leads WHERE id = ${id}`;
  return Response.json({ success: true });
}
