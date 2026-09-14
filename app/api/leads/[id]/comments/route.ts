import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/leads/[id]/comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const ownershipCheck =
      session.role === 'channel_partner'
        ? await sql`SELECT id FROM leads WHERE id = ${id} AND cp_id = ${session.userId}`
        : await sql`SELECT id FROM leads WHERE id = ${id}`;

    if (!ownershipCheck.length) {
      return Response.json({ error: 'Lead not found or access denied.' }, { status: 404 });
    }

    const rows = await sql`
      SELECT c.*,
             u.name AS user_name,
             ns.lead_status AS new_status_name
      FROM lead_comments c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN lead_statuses ns ON ns.id = c.new_status_id
      WHERE c.lead_id = ${id}
      ORDER BY c.created_at DESC
    `;

    return Response.json({ comments: rows });
  } catch (err: any) {
    console.error('API Error /api/leads/[id]/comments GET:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/leads/[id]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const { comment_text, status_id } = await request.json();

    if (!comment_text && !status_id) {
      return Response.json({ error: 'Comment text or status ID is required.' }, { status: 400 });
    }

    // Begin transaction
    const leadRows = session.role === 'channel_partner'
      ? await sql`SELECT id, status_id FROM leads WHERE id = ${id} AND cp_id = ${session.userId}`
      : await sql`SELECT id, status_id FROM leads WHERE id = ${id}`;

    if (!leadRows.length) {
      return Response.json({ error: 'Lead not found or access denied.' }, { status: 404 });
    }

    const oldStatusId = leadRows[0].status_id;
    const newStatusId = status_id ? Number(status_id) : oldStatusId;
    const statusChanged = oldStatusId !== newStatusId;

    if (!comment_text && !statusChanged) {
       return Response.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    const commentRows = await sql`
      INSERT INTO lead_comments (lead_id, user_id, comment_text, new_status_id)
      VALUES (${id}, ${session.userId}, ${comment_text || ''}, ${statusChanged ? newStatusId : null})
      RETURNING *
    `;

    if (statusChanged) {
      await sql`
        UPDATE leads
        SET status_id = ${newStatusId}
        WHERE id = ${id}
      `;
    }

    // Fetch full data for the newly created comment
    const newCommentId = commentRows[0].id;
    const fullComment = await sql`
      SELECT c.*,
             u.name AS user_name,
             ns.lead_status AS new_status_name
      FROM lead_comments c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN lead_statuses ns ON ns.id = c.new_status_id
      WHERE c.id = ${newCommentId}
    `;

    return Response.json(fullComment[0], { status: 201 });
  } catch (err: any) {
    console.error('API Error /api/leads/[id]/comments POST:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
