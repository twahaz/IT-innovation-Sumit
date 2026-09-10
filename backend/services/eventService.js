const { pool } = require('../db');

/**
 * Service to manage Summit Events and active event resolution
 */

/**
 * Retrieves the currently active event
 * @returns {Promise<Object|null>} The active event record or null
 */
async function getActiveEvent() {
  const query = `
    SELECT 
      id,
      name,
      year,
      TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date,
      start_time,
      end_time,
      venue,
      description,
      image_url,
      registration_open,
      is_active,
      created_at,
      updated_at
    FROM events
    WHERE is_active = TRUE
    LIMIT 1;
  `;
  const result = await pool.query(query);
  return result.rows[0] || null;
}

/**
 * Retrieves an event by its ID, including total registrations count
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
async function getEventById(id) {
  const query = `
    SELECT 
      e.id,
      e.name,
      e.year,
      TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
      e.start_time,
      e.end_time,
      e.venue,
      e.description,
      e.image_url,
      e.registration_open,
      e.is_active,
      e.created_at,
      e.updated_at,
      COUNT(r.id)::int AS registration_count
    FROM events e
    LEFT JOIN registrations r ON e.id = r.event_id
    WHERE e.id = $1
    GROUP BY e.id;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Retrieves all events ordered by year descending with attendee registration counts
 * @returns {Promise<Array>}
 */
async function getAllEvents() {
  const query = `
    SELECT 
      e.id,
      e.name,
      e.year,
      TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
      e.start_time,
      e.end_time,
      e.venue,
      e.description,
      e.image_url,
      e.registration_open,
      e.is_active,
      e.created_at,
      e.updated_at,
      COUNT(r.id)::int AS registration_count
    FROM events e
    LEFT JOIN registrations r ON e.id = r.event_id
    GROUP BY e.id
    ORDER BY e.year DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Creates a new event
 * @param {Object} eventData 
 * @returns {Promise<Object>}
 */
async function createEvent(eventData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If this new event is marked as active, deactivate existing active events first
    if (eventData.is_active) {
      await client.query('UPDATE events SET is_active = FALSE WHERE is_active = TRUE;');
    }

    const insertQuery = `
      INSERT INTO events (
        name,
        year,
        event_date,
        start_time,
        end_time,
        venue,
        description,
        image_url,
        registration_open,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id,
        name,
        year,
        TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date,
        start_time,
        end_time,
        venue,
        description,
        image_url,
        registration_open,
        is_active,
        created_at,
        updated_at;
    `;

    const values = [
      eventData.name,
      eventData.year,
      eventData.event_date,
      eventData.start_time,
      eventData.end_time,
      eventData.venue || null,
      eventData.description || null,
      eventData.image_url || null,
      eventData.registration_open !== false,
      !!eventData.is_active,
    ];

    const result = await client.query(insertQuery, values);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Updates an existing event
 * @param {number} id 
 * @param {Object} updateData 
 * @returns {Promise<Object>}
 */
async function updateEvent(id, updateData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If making this event active, deactivate all other active events first
    if (updateData.is_active === true) {
      await client.query('UPDATE events SET is_active = FALSE WHERE is_active = TRUE AND id != $1;', [id]);
    }

    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      'name', 'year', 'event_date', 'start_time', 'end_time',
      'venue', 'description', 'image_url', 'registration_open', 'is_active'
    ];

    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(updateData[key]);
        idx++;
      }
    }

    if (fields.length === 0) {
      const current = await getEventById(id);
      await client.query('COMMIT');
      return current;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE events
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING 
        id,
        name,
        year,
        TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date,
        start_time,
        end_time,
        venue,
        description,
        image_url,
        registration_open,
        is_active,
        created_at,
        updated_at;
    `;

    const result = await client.query(updateQuery, values);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Deletes an event by ID if it has no associated registrations and is not active
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
async function deleteEvent(id) {
  const eventRes = await pool.query('SELECT is_active FROM events WHERE id = $1;', [id]);
  if (eventRes.rows.length === 0) {
    return false;
  }

  if (eventRes.rows[0].is_active) {
    const error = new Error('Cannot delete the active event. Please activate another event first.');
    error.statusCode = 400;
    throw error;
  }

  // Check if any registrations are associated with this event
  const regCountRes = await pool.query(
    'SELECT COUNT(*)::int AS count FROM registrations WHERE event_id = $1;',
    [id]
  );

  const regCount = regCountRes.rows[0]?.count || 0;
  if (regCount > 0) {
    const error = new Error('Cannot delete an event that has registrations.');
    error.statusCode = 400;
    throw error;
  }

  const deleteRes = await pool.query('DELETE FROM events WHERE id = $1 RETURNING id;', [id]);
  return deleteRes.rows.length > 0;
}

module.exports = {
  getActiveEvent,
  getEventById,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
