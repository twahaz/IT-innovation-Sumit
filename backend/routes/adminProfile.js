const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { pool } = require('../db');
const { verifyAdmin } = require('../middleware/authMiddleware');
const { handleProfileUpload, UPLOAD_DIR } = require('../middleware/uploadMiddleware');

// Protect all profile endpoints with admin authentication
router.use(verifyAdmin);

/**
 * Safely removes an image file from the uploads directory
 */
function removeStoredFile(relativeOrAbsoluteUrl) {
  if (!relativeOrAbsoluteUrl || typeof relativeOrAbsoluteUrl !== 'string') return;
  try {
    const filename = path.basename(relativeOrAbsoluteUrl);
    const filePath = path.join(UPLOAD_DIR, filename);

    // Prevent directory traversal: verify filePath is strictly inside UPLOAD_DIR
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(UPLOAD_DIR);

    if (resolvedPath.startsWith(resolvedUploadDir) && fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      console.log(`[Admin Profile] Removed old avatar file: ${filename}`);
    }
  } catch (err) {
    console.warn(`[Admin Profile] Could not remove file ${relativeOrAbsoluteUrl}:`, err.message);
  }
}

/**
 * GET /api/admin/profile
 * Returns profile for the currently authenticated admin
 */
router.get('/profile', async (req, res) => {
  try {
    const adminId = req.admin.id;
    const query = `
      SELECT id, full_name, email, role, profile_image_url, created_at, updated_at
      FROM admins
      WHERE id = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [adminId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Administrator profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      admin: result.rows[0],
    });
  } catch (err) {
    console.error('[Admin Profile Error] GET /profile:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrator profile.',
    });
  }
});

/**
 * PUT /api/admin/profile
 * Updates basic profile details (full_name)
 */
router.put('/profile', async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { full_name } = req.body || {};

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required and cannot be empty.',
      });
    }

    const trimmedName = full_name.trim();
    if (trimmedName.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Full name cannot exceed 150 characters.',
      });
    }

    const query = `
      UPDATE admins
      SET full_name = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, full_name, email, role, profile_image_url, created_at, updated_at;
    `;
    const result = await pool.query(query, [trimmedName, adminId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Administrator profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      admin: result.rows[0],
    });
  } catch (err) {
    console.error('[Admin Profile Error] PUT /profile:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update administrator profile.',
    });
  }
});

/**
 * POST /api/admin/profile/avatar
 * Uploads a new profile picture and saves relative reference to database
 */
router.post('/profile/avatar', handleProfileUpload, async (req, res) => {
  try {
    const adminId = req.admin.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file to upload.',
      });
    }

    // Relative storage URL
    const newAvatarUrl = `/uploads/profile/${req.file.filename}`;

    // Get old avatar to clean up after successful database update
    const currentRes = await pool.query('SELECT profile_image_url FROM admins WHERE id = $1', [adminId]);
    const oldAvatarUrl = currentRes.rows[0]?.profile_image_url;

    // Update database
    const updateQuery = `
      UPDATE admins
      SET profile_image_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, full_name, email, role, profile_image_url, created_at, updated_at;
    `;
    const updateRes = await pool.query(updateQuery, [newAvatarUrl, adminId]);

    if (updateRes.rows.length === 0) {
      // Remove just-uploaded file if admin was not found
      removeStoredFile(newAvatarUrl);
      return res.status(404).json({
        success: false,
        message: 'Administrator profile not found.',
      });
    }

    // Safely remove previous avatar file from disk
    if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
      removeStoredFile(oldAvatarUrl);
    }

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully.',
      profile_image_url: newAvatarUrl,
      admin: updateRes.rows[0],
    });
  } catch (err) {
    console.error('[Admin Profile Error] POST /profile/avatar:', err.message);
    // Cleanup the uploaded file if database query errored
    if (req.file) {
      removeStoredFile(`/uploads/profile/${req.file.filename}`);
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile picture.',
    });
  }
});

/**
 * DELETE /api/admin/profile/avatar
 * Removes the admin profile picture and deletes file from disk
 */
router.delete('/profile/avatar', async (req, res) => {
  try {
    const adminId = req.admin.id;

    // Get current avatar url
    const currentRes = await pool.query('SELECT profile_image_url FROM admins WHERE id = $1', [adminId]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Administrator profile not found.',
      });
    }

    const oldAvatarUrl = currentRes.rows[0]?.profile_image_url;

    // Set profile_image_url to NULL in database
    const updateQuery = `
      UPDATE admins
      SET profile_image_url = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, full_name, email, role, profile_image_url, created_at, updated_at;
    `;
    const updateRes = await pool.query(updateQuery, [adminId]);

    // Remove file from disk
    if (oldAvatarUrl) {
      removeStoredFile(oldAvatarUrl);
    }

    return res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully.',
      admin: updateRes.rows[0],
    });
  } catch (err) {
    console.error('[Admin Profile Error] DELETE /profile/avatar:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove profile picture.',
    });
  }
});

module.exports = router;
