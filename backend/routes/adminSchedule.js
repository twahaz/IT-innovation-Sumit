const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');
const { getEventById } = require('../services/eventService');
const {
  getScheduleByEventId,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  reorderSchedule,
} = require('../services/scheduleService');

// Protect all admin schedule endpoints
router.use(verifyAdmin);

/**
 * Validates time format (HH:MM or HH:MM:SS)
 */
function isValidTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return false;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return regex.test(timeStr);
}

/**
 * Normalizes time string to HH:MM
 */
function normalizeTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

/**
 * GET /api/admin/events/:eventId/schedule
 * List all schedule sessions for an event
 */
router.get('/events/:eventId/schedule', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId) || eventId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid event ID.' });
    }

    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const schedule = await getScheduleByEventId(eventId);
    return res.status(200).json({
      success: true,
      count: schedule.length,
      schedule,
    });
  } catch (err) {
    console.error('[Admin Schedule API Error] Fetch schedule:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve schedule sessions.',
    });
  }
});

/**
 * PUT /api/admin/events/:eventId/schedule/reorder
 * Reorder sessions for an event
 * NOTE: Placed before /:sessionId to avoid route matching conflicts
 */
router.put('/events/:eventId/schedule/reorder', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId) || eventId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid event ID.' });
    }

    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const { sessionIds } = req.body;
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sessionIds must be a non-empty array of session IDs.',
      });
    }

    const parsedIds = sessionIds.map((id) => parseInt(id, 10));
    if (parsedIds.some((id) => isNaN(id) || id <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'All session IDs must be valid positive integers.',
      });
    }

    const updatedSchedule = await reorderSchedule(eventId, parsedIds);

    return res.status(200).json({
      success: true,
      message: 'Schedule reordered successfully.',
      schedule: updatedSchedule,
    });
  } catch (err) {
    console.error('[Admin Schedule API Error] Reorder schedule:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to reorder schedule sessions.',
    });
  }
});

/**
 * POST /api/admin/events/:eventId/schedule
 * Create a new schedule session for an event
 */
router.post('/events/:eventId/schedule', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId) || eventId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid event ID.' });
    }

    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const {
      title,
      description,
      speaker_name,
      session_type,
      start_time,
      end_time,
      sort_order,
    } = req.body;

    // Validation
    const errors = [];
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Session title is required.');
    } else if (title.trim().length > 200) {
      errors.push('Session title cannot exceed 200 characters.');
    }

    if (!start_time || !isValidTime(start_time)) {
      errors.push('Valid start time (HH:MM) is required.');
    }

    if (!end_time || !isValidTime(end_time)) {
      errors.push('Valid end time (HH:MM) is required.');
    }

    if (start_time && end_time && isValidTime(start_time) && isValidTime(end_time)) {
      const normStart = normalizeTime(start_time);
      const normEnd = normalizeTime(end_time);
      if (normEnd <= normStart) {
        errors.push('End time must be later than start time.');
      }
    }

    if (sort_order !== undefined && sort_order !== null) {
      const parsedOrder = parseInt(sort_order, 10);
      if (isNaN(parsedOrder) || parsedOrder < 0) {
        errors.push('Sort order must be a non-negative integer.');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
        errors,
      });
    }

    const newSession = await createSession(eventId, {
      title: title.trim(),
      description: description ? description.trim() : null,
      speaker_name: speaker_name ? speaker_name.trim() : null,
      session_type: session_type ? session_type.trim() : null,
      start_time: normalizeTime(start_time),
      end_time: normalizeTime(end_time),
      sort_order: sort_order !== undefined && sort_order !== null ? parseInt(sort_order, 10) : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Schedule session created successfully.',
      session: newSession,
    });
  } catch (err) {
    console.error('[Admin Schedule API Error] Create session:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create schedule session.',
    });
  }
});

/**
 * PUT /api/admin/events/:eventId/schedule/:sessionId
 * Update an existing schedule session
 */
router.put('/events/:eventId/schedule/:sessionId', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const sessionId = parseInt(req.params.sessionId, 10);

    if (isNaN(eventId) || eventId <= 0 || isNaN(sessionId) || sessionId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid event or session ID.' });
    }

    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const existingSession = await getSessionById(sessionId, eventId);
    if (!existingSession) {
      return res.status(404).json({
        success: false,
        message: 'Schedule session not found for this event.',
      });
    }

    const {
      title,
      description,
      speaker_name,
      session_type,
      start_time,
      end_time,
      sort_order,
    } = req.body;

    const errors = [];
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        errors.push('Session title cannot be empty.');
      } else if (title.trim().length > 200) {
        errors.push('Session title cannot exceed 200 characters.');
      }
    }

    const effStart = start_time !== undefined ? start_time : existingSession.start_time;
    const effEnd = end_time !== undefined ? end_time : existingSession.end_time;

    if (start_time !== undefined && !isValidTime(start_time)) {
      errors.push('Valid start time (HH:MM) is required.');
    }
    if (end_time !== undefined && !isValidTime(end_time)) {
      errors.push('Valid end time (HH:MM) is required.');
    }

    if (isValidTime(effStart) && isValidTime(effEnd)) {
      const normStart = normalizeTime(effStart);
      const normEnd = normalizeTime(effEnd);
      if (normEnd <= normStart) {
        errors.push('End time must be later than start time.');
      }
    }

    if (sort_order !== undefined && sort_order !== null) {
      const parsedOrder = parseInt(sort_order, 10);
      if (isNaN(parsedOrder) || parsedOrder < 0) {
        errors.push('Sort order must be a non-negative integer.');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
        errors,
      });
    }

    const updatedSession = await updateSession(sessionId, eventId, {
      title: title !== undefined ? title.trim() : undefined,
      description: description !== undefined ? (description ? description.trim() : null) : undefined,
      speaker_name: speaker_name !== undefined ? (speaker_name ? speaker_name.trim() : null) : undefined,
      session_type: session_type !== undefined ? (session_type ? session_type.trim() : null) : undefined,
      start_time: start_time !== undefined ? normalizeTime(start_time) : undefined,
      end_time: end_time !== undefined ? normalizeTime(end_time) : undefined,
      sort_order: sort_order !== undefined && sort_order !== null ? parseInt(sort_order, 10) : undefined,
    });

    return res.status(200).json({
      success: true,
      message: 'Schedule session updated successfully.',
      session: updatedSession,
    });
  } catch (err) {
    console.error('[Admin Schedule API Error] Update session:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update schedule session.',
    });
  }
});

/**
 * DELETE /api/admin/events/:eventId/schedule/:sessionId
 * Delete a schedule session
 */
router.delete('/events/:eventId/schedule/:sessionId', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const sessionId = parseInt(req.params.sessionId, 10);

    if (isNaN(eventId) || eventId <= 0 || isNaN(sessionId) || sessionId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid event or session ID.' });
    }

    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const existingSession = await getSessionById(sessionId, eventId);
    if (!existingSession) {
      return res.status(404).json({
        success: false,
        message: 'Schedule session not found for this event.',
      });
    }

    await deleteSession(sessionId, eventId);

    return res.status(200).json({
      success: true,
      message: 'Schedule session deleted successfully.',
    });
  } catch (err) {
    console.error('[Admin Schedule API Error] Delete session:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete schedule session.',
    });
  }
});

module.exports = router;
