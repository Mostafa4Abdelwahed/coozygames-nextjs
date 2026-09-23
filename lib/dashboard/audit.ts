import { pool } from '@/lib/db'

/** Record an admin mutation in audit_log. Called after every successful write. */
export async function logAudit(
  actorId: string | null,
  action: string,
  targetType: string | null,
  targetId: string | null,
  meta: Record<string, unknown> = {},
): Promise<void> {
  await pool.query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, meta) VALUES ($1, $2, $3, $4, $5)`,
    [actorId, action, targetType, targetId, JSON.stringify(meta)],
  )
}