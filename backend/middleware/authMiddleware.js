const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_it_innovation_summit_2026';

/**
 * Authentication middleware to verify admin JWT from HTTP-only cookie or Authorization header.
 */
function verifyAdmin(req, res, next) {
  let token = null;

  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  // 2. Check Authorization Bearer header
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Administrator authentication required.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Session invalid or expired. Please sign in again.',
      error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
    });
  }
}

module.exports = { verifyAdmin, JWT_SECRET };
