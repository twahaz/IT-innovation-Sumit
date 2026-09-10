const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { verifyAdmin, JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * POST /api/admin/login
 * Authenticates admin credentials and returns a secure session
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const query = `
      SELECT id, full_name, email, password_hash, role, profile_image_url
      FROM admins
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const result = await pool.query(query, [normalizedEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(String(password), admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const payload = {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role || 'admin',
      profile_image_url: admin.profile_image_url || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    // Set secure HTTP-only cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        profile_image_url: admin.profile_image_url || null,
      },
    });
  } catch (err) {
    console.error('[Admin Auth Error] Login failed:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
});

/**
 * POST /api/admin/logout
 * Clears the admin session
 */
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/**
 * GET /api/admin/me
 * Returns current authenticated admin user with fresh database details
 */
router.get('/me', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, profile_image_url, created_at, updated_at FROM admins WHERE id = $1 LIMIT 1;',
      [req.admin.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Administrator account not found.',
      });
    }

    return res.status(200).json({
      success: true,
      admin: result.rows[0],
    });
  } catch (err) {
    console.error('[Admin Auth Error] /me failed:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrator profile.',
    });
  }
});

module.exports = router;
