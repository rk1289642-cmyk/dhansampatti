import sql from '@/lib/db';

export async function GET() {
  const [loanTypes, leadStatuses] = await Promise.all([
    sql`SELECT id, loan_type FROM loan_types ORDER BY id`,
    sql`SELECT id, lead_status FROM lead_statuses ORDER BY id`,
  ]);
  return Response.json({ loanTypes, leadStatuses });
}
