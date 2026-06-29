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
  try {
    const body = await request.json();
    const {
      full_name, phone, dob, status_id, loan_number, loan_type_id, cp_id,
      loan_amount, bank_name, remark, login_date, sanction_date, disbursal_date, transaction_date,
      company, occupation, salary, turnover, location,
    } = body;

    const missingFields: string[] = [];
    if (!full_name)    missingFields.push('full_name');
    if (!phone)        missingFields.push('phone');
    if (!status_id)    missingFields.push('status_id');
    if (!loan_type_id) missingFields.push('loan_type_id');
    if (!loan_amount)  missingFields.push('loan_amount');
    if (!bank_name)    missingFields.push('bank_name');

    if (missingFields.length) {
      return Response.json(
        { error: `${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required.` },
        { status: 400 }
      );
    }

    if (Number.isNaN(Number(loan_amount)) || Number(loan_amount) <= 0) {
      return Response.json({ error: 'loan_amount must be a valid positive number.' }, { status: 400 });
    }

    const statusIdNum   = Number(status_id);
    const loanTypeIdNum = Number(loan_type_id);
    if (Number.isNaN(statusIdNum) || Number.isNaN(loanTypeIdNum)) {
      return Response.json({ error: 'status_id and loan_type_id must be valid numbers.' }, { status: 400 });
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
      session.role === 'admin' ? (cp_id || session.userId) : session.userId;

    // Check if optional 'remark' column exists (backward-compat with older DBs)
    const colCheck = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'remark' AND table_schema = 'public'
    `;
    const hasRemark = colCheck.length > 0;

    const rows = hasRemark
      ? await sql`
          UPDATE leads
          SET full_name       = ${full_name},
              phone           = ${phone},
              dob             = ${dob ?? null},
              status_id       = ${statusIdNum},
              loan_number     = ${loan_number ?? null},
              loan_type_id    = ${loanTypeIdNum},
              cp_id           = ${effectiveCpId},
              loan_amount     = ${loan_amount ?? null},
              bank_name       = ${bank_name ?? null},
              remark          = ${remark ?? null},
              login_date      = ${login_date ?? null},
              sanction_date   = ${sanction_date ?? null},
              disbursal_date  = ${disbursal_date ?? null},
              transaction_date= ${transaction_date ?? null},
              company         = ${company ?? null},
              occupation      = ${occupation ?? null},
              salary          = ${salary ?? null},
              turnover        = ${turnover ?? null},
              location        = ${location ?? null}
          WHERE id = ${id}
          RETURNING *
        `
      : await sql`
          UPDATE leads
          SET full_name       = ${full_name},
              phone           = ${phone},
              dob             = ${dob ?? null},
              status_id       = ${statusIdNum},
              loan_number     = ${loan_number ?? null},
              loan_type_id    = ${loanTypeIdNum},
              cp_id           = ${effectiveCpId},
              loan_amount     = ${loan_amount ?? null},
              bank_name       = ${bank_name ?? null},
              login_date      = ${login_date ?? null},
              sanction_date   = ${sanction_date ?? null},
              disbursal_date  = ${disbursal_date ?? null},
              transaction_date= ${transaction_date ?? null},
              company         = ${company ?? null},
              occupation      = ${occupation ?? null},
              salary          = ${salary ?? null},
              turnover        = ${turnover ?? null},
              location        = ${location ?? null}
          WHERE id = ${id}
          RETURNING *
        `;

    return Response.json(rows[0]);
  } catch (err: any) {
    console.error('API Error /api/leads/[id] PATCH:', err);
    if (err && (err.code === '23505' || String(err.message).includes('leads_phone_key'))) {
      return Response.json({ error: 'Phone number already exists.' }, { status: 409 });
    }
    return Response.json({ error: err?.message ?? 'Internal server error' }, { status: 500 });
  }
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
