import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/leads?search=&status_id=&loan_type_id=&cp_id=&page=1&per_page=20
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search      = searchParams.get('search')?.trim() ?? '';
  const statusId    = searchParams.get('status_id') ?? '';
  const loanTypeId  = searchParams.get('loan_type_id') ?? '';
  const cpIdFilter  = searchParams.get('cp_id') ?? '';
  const page        = Math.max(1, Number(searchParams.get('page') ?? 1));
  const perPage     = Math.min(100, Math.max(1, Number(searchParams.get('per_page') ?? 20)));
  const offset      = (page - 1) * perPage;

  // Build WHERE clauses (application-level isolation is the primary security layer)
  const scopeCondition =
    session.role === 'channel_partner' ? sql`l.cp_id = ${session.userId}` : sql`TRUE`;

  const searchCondition = search
    ? sql`(l.full_name ILIKE ${'%' + search + '%'} OR l.phone ILIKE ${'%' + search + '%'})`
    : sql`TRUE`;

  const statusCondition  = statusId   ? sql`l.status_id    = ${Number(statusId)}`   : sql`TRUE`;
  const loanCondition    = loanTypeId ? sql`l.loan_type_id = ${Number(loanTypeId)}` : sql`TRUE`;
  const cpCondition      =
    session.role === 'admin' && cpIdFilter
      ? sql`l.cp_id = ${cpIdFilter}`
      : sql`TRUE`;

  const [rows, countRows] = await Promise.all([
    sql`
      SELECT l.id, l.full_name, l.phone, l.dob, l.loan_number, l.created_at, l.updated_at,
             l.status_id, l.loan_type_id, l.cp_id,
             ls.lead_status, lt.loan_type, u.name AS cp_name
      FROM leads l
      JOIN lead_statuses ls ON ls.id = l.status_id
      JOIN loan_types    lt ON lt.id = l.loan_type_id
      JOIN users          u ON u.id  = l.cp_id
      WHERE ${scopeCondition}
        AND ${searchCondition}
        AND ${statusCondition}
        AND ${loanCondition}
        AND ${cpCondition}
      ORDER BY l.created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*) AS total
      FROM leads l
      WHERE ${scopeCondition}
        AND ${searchCondition}
        AND ${statusCondition}
        AND ${loanCondition}
        AND ${cpCondition}
    `,
  ]);

  const total = Number(countRows[0].total);

  return Response.json({
    leads: rows,
    pagination: {
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    },
  });
}

// POST /api/leads
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { full_name, phone, dob, status_id, loan_number, loan_type_id, cp_id } =
    await request.json();

  if (!full_name || !phone || !status_id || !loan_type_id) {
    return Response.json(
      { error: 'full_name, phone, status_id and loan_type_id are required.' },
      { status: 400 }
    );
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
