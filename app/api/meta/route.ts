import sql from '@/lib/db';

export async function GET() {
  const [loanTypes, leadStatuses] = await Promise.all([
    sql`SELECT id, loan_type FROM loan_types ORDER BY id`,
    sql`SELECT id, lead_status, stage_order FROM lead_statuses ORDER BY stage_order`,
  ]);
  return Response.json({ loanTypes, leadStatuses });
}
