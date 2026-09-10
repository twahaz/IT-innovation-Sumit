const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { sendRegistrationConfirmation } = require('../services/emailService');
const { getActiveEvent } = require('../services/eventService');

// Basic email format regex: non-empty before @, domain name, dot, and TLD
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates registration request body
 */
function validateRegistrationPayload(body) {
  const errors = [];

  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
  const normalizedEmail = rawEmail.toLowerCase();
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const institution = typeof body.institution === 'string' ? body.institution.trim() : null;

  if (!fullName) {
    errors.push('Full name is required.');
  } else if (fullName.length > 150) {
    errors.push('Full name cannot exceed 150 characters.');
  }

  if (!rawEmail) {
    errors.push('Email is required.');
  } else if (rawEmail.length > 150) {
    errors.push('Email cannot exceed 150 characters.');
  } else if (!EMAIL_REGEX.test(rawEmail)) {
    errors.push('Email format is invalid.');
  }

  if (!phone) {
    errors.push('Phone number is required.');
  } else if (phone.length > 30) {
    errors.push('Phone number cannot exceed 30 characters.');
  }

  if (institution && institution.length > 150) {
    errors.push('Institution cannot exceed 150 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      fullName,
      email: normalizedEmail,
      phone,
      institution: institution || null,
    },
  };
}

/**
 * POST /api/registrations
 * Register an attendee for the currently active summit event
 */
router.post('/', async (req, res) => {
  try {
    const { isValid, errors, data } = validateRegistrationPayload(req.body || {});

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Resolve currently active summit event
    const activeEvent = await getActiveEvent();
    if (!activeEvent) {
      return res.status(400).json({
        success: false,
        message: 'No active event is currently available for registration.',
      });
    }

    // Check if registration is open for this event
    if (!activeEvent.registration_open) {
      return res.status(400).json({
        success: false,
        message: `Registration for ${activeEvent.name} is currently closed.`,
      });
    }

    // Check whether email already exists for THIS active event
    const existingCheckQuery = `
      SELECT id FROM registrations
      WHERE event_id = $1 AND LOWER(email) = LOWER($2)
      LIMIT 1;
    `;
    const existingResult = await pool.query(existingCheckQuery, [activeEvent.id, data.email]);

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `This email is already registered for ${activeEvent.name}.`,
      });
    }

    // Parameterized insertion with event_id and normalized email
    const insertQuery = `
      INSERT INTO registrations (event_id, full_name, email, phone, institution)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, event_id, full_name, email, phone, institution, registered_at;
    `;
    const values = [activeEvent.id, data.fullName, data.email, data.phone, data.institution];

    let result;
    try {
      result = await pool.query(insertQuery, values);
    } catch (insertErr) {
      // Catch race-condition PostgreSQL unique constraint violation (code 23505)
      if (insertErr.code === '23505') {
        return res.status(409).json({
          success: false,
          message: `This email is already registered for ${activeEvent.name}.`,
        });
      }
      throw insertErr;
    }

    const createdRegistration = result.rows[0];

    // Trigger confirmation email dispatch with dynamic event details
    let emailSent = false;
    try {
      const emailResult = await sendRegistrationConfirmation(createdRegistration, activeEvent);
      emailSent = !!emailResult?.success;
    } catch (emailErr) {
      console.error('[Registration] Unexpected error in email dispatch:', emailErr.message);
      emailSent = false;
    }

    if (emailSent) {
      try {
        await pool.query('UPDATE registrations SET email_sent = TRUE WHERE id = $1', [createdRegistration.id]);
      } catch (updateErr) {
        console.warn('[Registration] Could not update email_sent flag:', updateErr.message);
      }
    }
    createdRegistration.email_sent = emailSent;
    createdRegistration.event_name = activeEvent.name;
    createdRegistration.event_year = activeEvent.year;

    return res.status(201).json({
      success: true,
      message: emailSent
        ? 'Registration successful'
        : "Registration successful, but we couldn't send the confirmation email. Please keep your Registration ID for reference.",
      email_sent: emailSent,
      data: createdRegistration,
    });
  } catch (err) {
    console.error('[Registration Error] Failed to process registration:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing registration',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

/**
 * GET /api/registrations
 * Development / testing endpoint to fetch all registrations (newest first)
 */
router.get('/', async (req, res) => {
  try {
    const selectQuery = `
      SELECT 
        r.id, 
        r.event_id, 
        e.name AS event_name, 
        e.year AS event_year,
        r.full_name, 
        r.email, 
        r.phone, 
        r.institution, 
        r.registered_at,
        r.email_sent
      FROM registrations r
      LEFT JOIN events e ON r.event_id = e.id
      ORDER BY r.registered_at DESC, r.id DESC;
    `;

    const result = await pool.query(selectQuery);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error('[Registration Error] Failed to fetch registrations:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching registrations',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

module.exports = router;
