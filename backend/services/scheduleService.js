const { pool } = require('../db');

/**
 * Retrieves all schedule sessions for a specific event
 * Ordered by sort_order ASC, start_time ASC
 */
async function getScheduleByEventId(eventId) {
  const query = `
    SELECT
      id,
      event_id,
      title,
      description,
      speaker_name,
      session_type,
      TO_CHAR(start_time, 'HH24:MI') AS start_time,
      TO_CHAR(end_time, 'HH24:MI') AS end_time,
      sort_order,
      created_at,
      updated_at
    FROM event_schedule
    WHERE event_id = $1
    ORDER BY sort_order ASC, start_time ASC;
  `;
  const res = await pool.query(query, [eventId]);
  return res.rows;
}

/**
 * Retrieves a single schedule session by ID and optional eventId
 */
async function getSessionById(sessionId, eventId = null) {
  let query = `
    SELECT
      id,
      event_id,
      title,
      description,
      speaker_name,
      session_type,
      TO_CHAR(start_time, 'HH24:MI') AS start_time,
      TO_CHAR(end_time, 'HH24:MI') AS end_time,
      sort_order,
      created_at,
      updated_at
    FROM event_schedule
    WHERE id = $1
  `;
  const params = [sessionId];

  if (eventId) {
    query += ` AND event_id = $2`;
    params.push(eventId);
  }

  const res = await pool.query(query, params);
  return res.rows[0] || null;
}

/**
 * Creates a new schedule session for an event
 */
async function createSession(eventId, data) {
  const {
    title,
    description = null,
    speaker_name = null,
    session_type = null,
    start_time,
    end_time,
    sort_order,
  } = data;

  let assignedSortOrder = sort_order;
  if (assignedSortOrder === undefined || assignedSortOrder === null) {
    const maxRes = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM event_schedule WHERE event_id = $1;',
      [eventId]
    );
    assignedSortOrder = parseInt(maxRes.rows[0].next_order, 10);
  }

  const query = `
    INSERT INTO event_schedule (
      event_id,
      title,
      description,
      speaker_name,
      session_type,
      start_time,
      end_time,
      sort_order
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      id,
      event_id,
      title,
      description,
      speaker_name,
      session_type,
      TO_CHAR(start_time, 'HH24:MI') AS start_time,
      TO_CHAR(end_time, 'HH24:MI') AS end_time,
      sort_order,
      created_at,
      updated_at;
  `;

  const values = [
    eventId,
    title.trim(),
    description ? description.trim() : null,
    speaker_name ? speaker_name.trim() : null,
    session_type ? session_type.trim() : null,
    start_time,
    end_time,
    assignedSortOrder,
  ];

  const res = await pool.query(query, values);
  return res.rows[0];
}

/**
 * Updates an existing schedule session
 */
async function updateSession(sessionId, eventId, data) {
  const {
    title,
    description,
    speaker_name,
    session_type,
    start_time,
    end_time,
    sort_order,
  } = data;

  const updates = [];
  const values = [sessionId, eventId];
  let paramIdx = 3;

  if (title !== undefined) {
    updates.push(`title = $${paramIdx++}`);
    values.push(title.trim());
  }
  if (description !== undefined) {
    updates.push(`description = $${paramIdx++}`);
    values.push(description ? description.trim() : null);
  }
  if (speaker_name !== undefined) {
    updates.push(`speaker_name = $${paramIdx++}`);
    values.push(speaker_name ? speaker_name.trim() : null);
  }
  if (session_type !== undefined) {
    updates.push(`session_type = $${paramIdx++}`);
    values.push(session_type ? session_type.trim() : null);
  }
  if (start_time !== undefined) {
    updates.push(`start_time = $${paramIdx++}`);
    values.push(start_time);
  }
  if (end_time !== undefined) {
    updates.push(`end_time = $${paramIdx++}`);
    values.push(end_time);
  }
  if (sort_order !== undefined) {
    updates.push(`sort_order = $${paramIdx++}`);
    values.push(parseInt(sort_order, 10));
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE event_schedule
    SET ${updates.join(', ')}
    WHERE id = $1 AND event_id = $2
    RETURNING
      id,
      event_id,
      title,
      description,
      speaker_name,
      session_type,
      TO_CHAR(start_time, 'HH24:MI') AS start_time,
      TO_CHAR(end_time, 'HH24:MI') AS end_time,
      sort_order,
      created_at,
      updated_at;
  `;

  const res = await pool.query(query, values);
  return res.rows[0] || null;
}

/**
 * Deletes a schedule session scoped to an event
 */
async function deleteSession(sessionId, eventId) {
  const query = `
    DELETE FROM event_schedule
    WHERE id = $1 AND event_id = $2
    RETURNING id, event_id, title;
  `;
  const res = await pool.query(query, [sessionId, eventId]);
  return res.rows[0] || null;
}

/**
 * Reorders sessions for an event given an array of session IDs in desired order
 */
async function reorderSchedule(eventId, sessionIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // First check that all session IDs belong to this event
    const checkQuery = `
      SELECT id FROM event_schedule
      WHERE event_id = $1 AND id = ANY($2::int[]);
    `;
    const checkRes = await client.query(checkQuery, [eventId, sessionIds]);
    if (checkRes.rows.length !== sessionIds.length) {
      throw new Error('One or more session IDs do not belong to this event.');
    }

    // Update each session's sort_order sequentially
    for (let i = 0; i < sessionIds.length; i++) {
      const sessionId = sessionIds[i];
      const newOrder = i + 1;
      await client.query(
        `UPDATE event_schedule SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND event_id = $3`,
        [newOrder, sessionId, eventId]
      );
    }

    await client.query('COMMIT');

    // Return the updated ordered list
    return await getScheduleByEventId(eventId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getScheduleByEventId,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  reorderSchedule,
};
