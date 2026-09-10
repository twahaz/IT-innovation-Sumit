const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Protect all admin registration endpoints
router.use(verifyAdmin);

/**
 * GET /api/admin/dashboard/stats
 * Provides overview metrics and recent registrations for dashboard
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const eventId = req.query.event_id && req.query.event_id !== 'all'
      ? parseInt(req.query.event_id, 10)
      : null;
    const hasEventFilter = eventId && !isNaN(eventId);

    const statsWhere = hasEventFilter ? 'WHERE event_id = $1' : '';
    const recentWhere = hasEventFilter ? 'WHERE r.event_id = $1' : '';
    const queryParams = hasEventFilter ? [eventId] : [];

    const statsQuery = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(CASE WHEN registered_at >= CURRENT_DATE THEN 1 END)::int AS today,
        COUNT(CASE WHEN registered_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END)::int AS this_week,
        COUNT(CASE WHEN registered_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)::int AS this_month,
        COUNT(CASE WHEN email_sent = TRUE THEN 1 END)::int AS email_sent_count,
        COUNT(CASE WHEN email_sent = FALSE THEN 1 END)::int AS email_failed_count
      FROM registrations
      ${statsWhere};
    `;

    const recentQuery = `
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
      ${recentWhere}
      ORDER BY r.registered_at DESC, r.id DESC
      LIMIT 6;
    `;

    const [statsResult, recentResult] = await Promise.all([
      pool.query(statsQuery, queryParams),
      pool.query(recentQuery, queryParams),
    ]);

    const stats = statsResult.rows[0] || {
      total: 0,
      today: 0,
      this_week: 0,
      this_month: 0,
      email_sent_count: 0,
      email_failed_count: 0,
    };

    return res.status(200).json({
      success: true,
      stats: {
        total: stats.total,
        today: stats.today,
        this_week: stats.this_week,
        this_month: stats.this_month,
        email_sent: stats.email_sent_count,
        email_failed: stats.email_failed_count,
      },
      recent: recentResult.rows,
    });
  } catch (err) {
    console.error('[Admin API Error] Failed to fetch stats:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard statistics.',
    });
  }
});

/**
 * GET /api/admin/registrations
 * Paginated, searchable, filterable list of registrations
 */
router.get('/registrations', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const { search, institution, email_status, start_date, end_date, event_id } = req.query;

    const whereClauses = [];
    const queryParams = [];
    let paramIndex = 1;

    // Filter by event_id if provided
    if (event_id && event_id !== 'all') {
      const parsedEventId = parseInt(event_id, 10);
      if (!isNaN(parsedEventId)) {
        whereClauses.push(`r.event_id = $${paramIndex}`);
        queryParams.push(parsedEventId);
        paramIndex++;
      }
    }

    // Search full_name, email, phone, institution
    if (search && search.trim()) {
      whereClauses.push(`(
        r.full_name ILIKE $${paramIndex} OR
        r.email ILIKE $${paramIndex} OR
        r.phone ILIKE $${paramIndex} OR
        r.institution ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Filter by institution
    if (institution && institution.trim()) {
      whereClauses.push(`r.institution ILIKE $${paramIndex}`);
      queryParams.push(`%${institution.trim()}%`);
      paramIndex++;
    }

    // Filter by email delivery status
    if (email_status === 'sent') {
      whereClauses.push(`r.email_sent = TRUE`);
    } else if (email_status === 'failed') {
      whereClauses.push(`r.email_sent = FALSE`);
    }

    // Filter by registration date
    if (start_date && start_date.trim()) {
      whereClauses.push(`r.registered_at >= $${paramIndex}`);
      queryParams.push(start_date.trim());
      paramIndex++;
    }
    if (end_date && end_date.trim()) {
      whereClauses.push(`r.registered_at <= $${paramIndex}`);
      queryParams.push(`${end_date.trim()} 23:59:59`);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const listQuery = `
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
        r.email_sent,
        COUNT(*) OVER() AS total_count
      FROM registrations r
      LEFT JOIN events e ON r.event_id = e.id
      ${whereSql}
      ORDER BY r.registered_at DESC, r.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    queryParams.push(limit, offset);

    const result = await pool.query(listQuery, queryParams);

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Remove total_count column from each row
    const data = result.rows.map(row => {
      const { total_count, ...cleanRow } = row;
      return cleanRow;
    });

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    console.error('[Admin API Error] Failed to fetch registrations:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load registrations.',
    });
  }
});

/**
 * GET /api/admin/registrations/export
 * Downloads registrations data as CSV, optionally filtered by event_id
 */
router.get('/registrations/export', async (req, res) => {
  try {
    const eventId = req.query.event_id && req.query.event_id !== 'all'
      ? parseInt(req.query.event_id, 10)
      : null;
    const hasFilter = eventId && !isNaN(eventId);

    const query = `
      SELECT 
        r.id, 
        COALESCE(e.name, 'IT Innovation Summit') AS event_name,
        COALESCE(e.year::text, '2026') AS event_year,
        r.full_name, 
        r.email, 
        r.phone, 
        r.institution, 
        r.registered_at, 
        r.email_sent
      FROM registrations r
      LEFT JOIN events e ON r.event_id = e.id
      ${hasFilter ? 'WHERE r.event_id = $1' : ''}
      ORDER BY r.registered_at DESC, r.id DESC;
    `;

    const result = await pool.query(query, hasFilter ? [eventId] : []);

    const headers = ['Registration ID', 'Event Name', 'Event Year', 'Full Name', 'Email', 'Phone', 'Institution', 'Registered At', 'Email Status'];
    
    function escapeCsvField(val) {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }

    const rows = result.rows.map(r => [
      escapeCsvField(r.id),
      escapeCsvField(r.event_name),
      escapeCsvField(r.event_year),
      escapeCsvField(r.full_name),
      escapeCsvField(r.email),
      escapeCsvField(r.phone),
      escapeCsvField(r.institution || 'N/A'),
      escapeCsvField(r.registered_at ? new Date(r.registered_at).toISOString() : ''),
      escapeCsvField(r.email_sent ? 'Sent' : 'Failed'),
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="summit-registrations-${dateStr}.csv"`);

    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[Admin API Error] Export failed:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate CSV export.',
    });
  }
});

/**
 * GET /api/admin/registrations/:id
 * Fetches single registration detail with event information
 */
router.get('/registrations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid registration ID.' });
    }

    const query = `
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
      WHERE r.id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('[Admin API Error] Failed to fetch registration:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registration details.',
    });
  }
});

/**
 * DELETE /api/admin/registrations/:id
 * Deletes registration record with admin authentication
 */
router.delete('/registrations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid registration ID.' });
    }

    const deleteQuery = `
      DELETE FROM registrations
      WHERE id = $1
      RETURNING id, full_name, email;
    `;
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or already deleted.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Registration deleted successfully.',
      deleted: result.rows[0],
    });
  } catch (err) {
    console.error('[Admin API Error] Failed to delete registration:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete registration.',
    });
  }
});

/**
 * GET /api/admin/analytics
 * Provides timeline, institution breakdown, and delivery stats, optionally filtered by event_id
 */
router.get('/analytics', async (req, res) => {
  try {
    const eventId = req.query.event_id && req.query.event_id !== 'all'
      ? parseInt(req.query.event_id, 10)
      : null;
    const hasFilter = eventId && !isNaN(eventId);
    const whereSql = hasFilter ? 'WHERE event_id = $1' : '';
    const params = hasFilter ? [eventId] : [];

    const timelineQuery = `
      SELECT
        TO_CHAR(registered_at, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count
      FROM registrations
      ${whereSql}
      GROUP BY date
      ORDER BY date ASC
      LIMIT 30;
    `;

    const institutionQuery = `
      SELECT
        COALESCE(NULLIF(TRIM(institution), ''), 'Independent / Individual') AS institution,
        COUNT(*)::int AS count
      FROM registrations
      ${whereSql}
      GROUP BY institution
      ORDER BY count DESC
      LIMIT 8;
    `;

    const statsQuery = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(CASE WHEN registered_at >= CURRENT_DATE THEN 1 END)::int AS today,
        COUNT(CASE WHEN registered_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END)::int AS this_week,
        COUNT(CASE WHEN registered_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)::int AS this_month,
        COUNT(CASE WHEN email_sent = TRUE THEN 1 END)::int AS email_sent,
        COUNT(CASE WHEN email_sent = FALSE THEN 1 END)::int AS email_failed
      FROM registrations
      ${whereSql};
    `;

    const [timelineRes, instRes, statsRes] = await Promise.all([
      pool.query(timelineQuery, params),
      pool.query(institutionQuery, params),
      pool.query(statsQuery, params),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        summary: statsRes.rows[0] || {},
        timeline: timelineRes.rows,
        institutions: instRes.rows,
      },
    });
  } catch (err) {
    console.error('[Admin API Error] Failed to load analytics:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load registration analytics.',
    });
  }
});

module.exports = router;
