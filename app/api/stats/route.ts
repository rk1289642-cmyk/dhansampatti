import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/stats — insight counts for dashboard cards
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role === 'admin') {
    const [leads, cps, sanctioned, disbursed] = await Promise.all([
      sql`SELECT COUNT(*) AS count FROM leads`,
      sql`SELECT COUNT(*) AS count FROM users u JOIN roles r ON r.id = u.role_id WHERE r.role_name = 'channel_partner'`,
      sql`SELECT COUNT(*) AS count FROM leads l JOIN lead_statuses ls ON ls.id = l.status_id WHERE ls.lead_status = 'Sanction'`,
      sql`SELECT COUNT(*) AS count FROM leads l JOIN lead_statuses ls ON ls.id = l.status_id WHERE ls.lead_status = 'Disbursal'`,
    ]);

    return Response.json({
      totalLeads: Number(leads[0].count),
      totalCPs: Number(cps[0].count),
      totalSanctioned: Number(sanctioned[0].count),
      totalDisbursed: Number(disbursed[0].count),
    });
  } else {
    const [total, created, sanctioned, disbursed] = await Promise.all([
      sql`SELECT COUNT(*) AS count FROM leads WHERE cp_id = ${session.userId}`,
      sql`SELECT COUNT(*) AS count FROM leads l JOIN lead_statuses ls ON ls.id = l.status_id WHERE l.cp_id = ${session.userId} AND ls.lead_status = 'Lead Created'`,
      sql`SELECT COUNT(*) AS count FROM leads l JOIN lead_statuses ls ON ls.id = l.status_id WHERE l.cp_id = ${session.userId} AND ls.lead_status = 'Sanction'`,
      sql`SELECT COUNT(*) AS count FROM leads l JOIN lead_statuses ls ON ls.id = l.status_id WHERE l.cp_id = ${session.userId} AND ls.lead_status = 'Disbursal'`,
    ]);

    return Response.json({
      totalLeads: Number(total[0].count),
      totalCreated: Number(created[0].count),
      totalSanctioned: Number(sanctioned[0].count),
      totalDisbursed: Number(disbursed[0].count),
    });
  }
}
