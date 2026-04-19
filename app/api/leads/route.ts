import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/leads
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const rows =
    session.role === 'admin'
      ? await sql`
          SELECT l.*, ls.lead_status, lt.loan_type, u.name AS cp_name
          FROM leads l
          JOIN lead_statuses ls ON ls.id = l.status_id
          JOIN loan_types lt ON lt.id = l.loan_type_id
          JOIN users u ON u.id = l.cp_id
          ORDER BY l.created_at DESC
        `
      : await sql`
          SELECT l.*, ls.lead_status, lt.loan_type, u.name AS cp_name
          FROM leads l
          JOIN lead_statuses ls ON ls.id = l.status_id
          JOIN loan_types lt ON lt.id = l.loan_type_id
          JOIN users u ON u.id = l.cp_id
          WHERE l.cp_id = ${session.userId}
          ORDER BY l.created_at DESC
        `;

  return Response.json(rows);
}

// POST /api/leads
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { full_name, phone, dob, status_id, loan_number, loan_type_id, cp_id } =
    await request.json();

  if (!full_name || !phone || !status_id || !loan_type_id) {
    return Response.json({ error: 'full_name, phone, status_id and loan_type_id are required.' }, { status: 400 });
  }

  // Channel partners can only add leads under themselves
  const effectiveCpId = session.role === 'admin' ? (cp_id ?? session.userId) : session.userId;

  const rows = await sql`
    INSERT INTO leads (full_name, phone, dob, status_id, loan_number, loan_type_id, cp_id, created_by)
    VALUES (${full_name}, ${phone}, ${dob ?? null}, ${status_id}, ${loan_number ?? null},
            ${loan_type_id}, ${effectiveCpId}, ${session.userId})
    RETURNING *
  `;

  return Response.json(rows[0], { status: 201 });
}
