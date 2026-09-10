const express = require('express');
const router = express.Router();
const { getActiveEvent, getEventById } = require('../services/eventService');
const { getScheduleByEventId } = require('../services/scheduleService');

/**
 * GET /api/events/active
 * Public endpoint returning the currently active summit event
 */
router.get('/active', async (req, res) => {
  try {
    const activeEvent = await getActiveEvent();

    if (!activeEvent) {
      return res.status(404).json({
        success: false,
        message: 'No active event is currently available.',
      });
    }

    // Expose only public fields
    return res.status(200).json({
      success: true,
      event: {
        id: activeEvent.id,
        name: activeEvent.name,
        year: activeEvent.year,
        event_date: activeEvent.event_date,
        start_time: activeEvent.start_time,
        end_time: activeEvent.end_time,
        venue: activeEvent.venue,
        description: activeEvent.description,
        image_url: activeEvent.image_url,
        registration_open: activeEvent.registration_open,
      },
    });
  } catch (err) {
    console.error('[Public Event API Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve active event information.',
    });
  }
});

/**
 * GET /api/events/active/schedule
 * Public endpoint returning the schedule sessions for the currently active summit event
 */
router.get('/active/schedule', async (req, res) => {
  try {
    const activeEvent = await getActiveEvent();

    if (!activeEvent) {
      return res.status(404).json({
        success: false,
        message: 'No active event is currently available.',
      });
    }

    const schedule = await getScheduleByEventId(activeEvent.id);

    return res.status(200).json({
      success: true,
      event: {
        id: activeEvent.id,
        name: activeEvent.name,
        year: activeEvent.year,
        event_date: activeEvent.event_date,
        start_time: activeEvent.start_time,
        end_time: activeEvent.end_time,
      },
      count: schedule.length,
      schedule,
    });
  } catch (err) {
    console.error('[Public Schedule API Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve active event schedule.',
    });
  }
});

/**
 * GET /api/events/:id/schedule
 * Public endpoint returning the schedule sessions for a specific event
 */
router.get('/:id/schedule', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (isNaN(eventId) || eventId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID.',
      });
    }

    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const schedule = await getScheduleByEventId(eventId);

    return res.status(200).json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        year: event.year,
      },
      count: schedule.length,
      schedule,
    });
  } catch (err) {
    console.error('[Public Event Schedule API Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event schedule.',
    });
  }
});

module.exports = router;
