const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyAdmin } = require('../middleware/authMiddleware');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../services/eventService');

// Protect all admin event endpoints
router.use(verifyAdmin);

/**
 * Validates date string (YYYY-MM-DD)
 */
function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Validates time string (HH:MM or HH:MM:SS)
 */
function isValidTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return false;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return regex.test(timeStr);
}

/**
 * GET /api/admin/events
 * Returns list of all summit events with attendee counts
 */
router.get('/events', async (req, res) => {
  try {
    const events = await getAllEvents();
    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (err) {
    console.error('[Admin Events API Error] Failed to fetch events:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve events.',
    });
  }
});

/**
 * GET /api/admin/events/:id
 * Returns detail for a specific event
 */
router.get('/events/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID.',
      });
    }

    const event = await getEventById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (err) {
    console.error('[Admin Events API Error] Failed to fetch event:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event details.',
    });
  }
});

/**
 * POST /api/admin/events
 * Creates a new summit event
 */
router.post('/events', async (req, res) => {
  try {
    const {
      name,
      year,
      event_date,
      start_time,
      end_time,
      venue,
      description,
      image_url,
      registration_open,
      is_active,
    } = req.body || {};

    const errors = [];

    // Name validation
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      errors.push('Event name is required.');
    } else if (trimmedName.length > 200) {
      errors.push('Event name cannot exceed 200 characters.');
    }

    // Year validation
    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      errors.push('Valid event year between 2000 and 2100 is required.');
    }

    // Date validation
    if (!isValidDate(event_date)) {
      errors.push('Valid event date in YYYY-MM-DD format is required.');
    }

    // Time validation
    if (!isValidTime(start_time)) {
      errors.push('Valid start time in HH:MM format is required.');
    }
    if (!isValidTime(end_time)) {
      errors.push('Valid end time in HH:MM format is required.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    // Check year uniqueness
    const existingYear = await pool.query('SELECT id FROM events WHERE year = $1 LIMIT 1;', [parsedYear]);
    if (existingYear.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `An event for year ${parsedYear} already exists.`,
      });
    }

    const newEvent = await createEvent({
      name: trimmedName,
      year: parsedYear,
      event_date,
      start_time,
      end_time,
      venue: typeof venue === 'string' ? venue.trim() : null,
      description: typeof description === 'string' ? description.trim() : null,
      image_url: typeof image_url === 'string' ? image_url.trim() : null,
      registration_open: registration_open !== false,
      is_active: !!is_active,
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event: newEvent,
    });
  } catch (err) {
    console.error('[Admin Events API Error] Failed to create event:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

/**
 * PUT /api/admin/events/:id
 * Updates an existing summit event
 */
router.put('/events/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID.',
      });
    }

    const existing = await getEventById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const body = req.body || {};
    const updateData = {};
    const errors = [];

    if (body.name !== undefined) {
      const trimmedName = typeof body.name === 'string' ? body.name.trim() : '';
      if (!trimmedName) {
        errors.push('Event name cannot be empty.');
      } else if (trimmedName.length > 200) {
        errors.push('Event name cannot exceed 200 characters.');
      } else {
        updateData.name = trimmedName;
      }
    }

    if (body.year !== undefined) {
      const parsedYear = parseInt(body.year, 10);
      if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
        errors.push('Valid event year between 2000 and 2100 is required.');
      } else {
        // Check year uniqueness against other events
        const yearConflict = await pool.query(
          'SELECT id FROM events WHERE year = $1 AND id != $2 LIMIT 1;',
          [parsedYear, id]
        );
        if (yearConflict.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: `An event for year ${parsedYear} already exists.`,
          });
        }
        updateData.year = parsedYear;
      }
    }

    if (body.event_date !== undefined) {
      if (!isValidDate(body.event_date)) {
        errors.push('Valid event date in YYYY-MM-DD format is required.');
      } else {
        updateData.event_date = body.event_date;
      }
    }

    if (body.start_time !== undefined) {
      if (!isValidTime(body.start_time)) {
        errors.push('Valid start time in HH:MM format is required.');
      } else {
        updateData.start_time = body.start_time;
      }
    }

    if (body.end_time !== undefined) {
      if (!isValidTime(body.end_time)) {
        errors.push('Valid end time in HH:MM format is required.');
      } else {
        updateData.end_time = body.end_time;
      }
    }

    if (body.venue !== undefined) {
      updateData.venue = typeof body.venue === 'string' ? body.venue.trim() : null;
    }

    if (body.description !== undefined) {
      updateData.description = typeof body.description === 'string' ? body.description.trim() : null;
    }

    if (body.image_url !== undefined) {
      updateData.image_url = typeof body.image_url === 'string' ? body.image_url.trim() : null;
    }

    if (body.registration_open !== undefined) {
      updateData.registration_open = Boolean(body.registration_open);
    }

    if (body.is_active !== undefined) {
      updateData.is_active = Boolean(body.is_active);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    const updated = await updateEvent(id, updateData);

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event: updated,
    });
  } catch (err) {
    console.error('[Admin Events API Error] Failed to update event:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update event.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

/**
 * DELETE /api/admin/events/:id
 * Deletes an event if it has no associated registrations and is not active
 */
router.delete('/events/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID.',
      });
    }

    const existing = await getEventById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    try {
      await deleteEvent(id);
      return res.status(200).json({
        success: true,
        message: 'Event deleted successfully.',
      });
    } catch (actionErr) {
      if (actionErr.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: actionErr.message,
        });
      }
      throw actionErr;
    }
  } catch (err) {
    console.error('[Admin Events API Error] Failed to delete event:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event.',
    });
  }
});

module.exports = router;
