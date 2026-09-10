const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure destination upload directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'profile');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed image formats
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const adminId = req.admin?.id || 'admin';
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
    const randomHex = crypto.randomBytes(4).toString('hex');
    const filename = `admin-${adminId}-${Date.now()}-${randomHex}${safeExt}`;
    cb(null, filename);
  },
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(mime) || !ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error('Please upload a JPG, PNG, or WEBP image.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  cb(null, true);
};

// 5 MB maximum file size limit
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
  fileFilter,
});

/**
 * Express middleware wrapper to handle multer errors gracefully
 */
function handleProfileUpload(req, res, next) {
  const singleUpload = upload.single('avatar');

  singleUpload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Profile image must be smaller than 5 MB.',
        });
      }
      if (err.code === 'INVALID_FILE_TYPE' || err.message?.includes('Please upload a JPG')) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a JPG, PNG, or WEBP image.',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to process uploaded file.',
      });
    }
    next();
  });
}

module.exports = {
  handleProfileUpload,
  UPLOAD_DIR,
};
