const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'SuperSecretKey';
const COOKIE_NAME = 'auth_token';

/**
 * Middleware to verify JWT token from HttpOnly cookie
 * Falls back to Authorization header for backwards compatibility
 */
function authenticateToken(req, res, next) {
  // Try to get token from cookie first (preferred method)
  let token = req.cookies?.[COOKIE_NAME];

  // Fallback to Authorization header for backwards compatibility
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user; // Attach user info to request
    next();
  });
}

/**
 * Optional authentication - doesn't fail if no token
 * Tries cookie first, then Authorization header
 */
function optionalAuth(req, res, next) {
  // Try to get token from cookie first
  let token = req.cookies?.[COOKIE_NAME];

  // Fallback to Authorization header
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
}

/**
 * Generate JWT token for user
 */
function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Set auth cookie in response
 */
function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,      // Prevents JavaScript access (XSS protection)
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax',     // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  });
}

/**
 * Clear auth cookie
 */
function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    path: '/',
  });
}

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  COOKIE_NAME,
};
