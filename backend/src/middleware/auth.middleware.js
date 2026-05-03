/**
 * @file auth.middleware.js
 * @description Authentication & authorisation middleware.
 *
 * Two exports:
 *  1. verifyToken   – validates the JWT and hydrates req.user from the DB.
 *  2. requireRole   – factory that returns a middleware enforcing one or more
 *                     allowed roles (RBAC guard).
 *
 * Design notes:
 *  • We always re-fetch the user from the DB inside verifyToken instead of
 *    trusting the JWT payload alone.  This guarantees that a deleted or
 *    suspended account is rejected even if the token has not yet expired.
 *  • requireRole is a higher-order function (middleware factory) so it can
 *    protect different routes with different role sets:
 *        router.delete('/:id', verifyToken, requireRole('ADMIN'), handler);
 *        router.get('/',       verifyToken, requireRole('ADMIN','MEMBER'), handler);
 */

const prisma = require('../config/prisma');
const { verifyTokenString } = require('../utils/jwt.utils');

// ─────────────────────────────────────────────────────────────────────────────
// 1. verifyToken
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Express middleware – extracts and verifies the Bearer JWT.
 *
 * Happy path:
 *   Authorization: Bearer <token>
 *   → decoded payload contains { userId }
 *   → user fetched from DB and attached to req.user
 *   → next() called
 *
 * Error cases handled:
 *   • Missing / malformed Authorization header → 401
 *   • JWT verification failure (bad secret, tampered) → 401 via error handler
 *   • Token expired → 401 via error handler (TokenExpiredError)
 *   • User no longer exists in DB → 401
 *
 * @type {import('express').RequestHandler}
 */
const verifyToken = async (req, res, next) => {
  try {
    // ── Step 1: Extract the token from the Authorization header ──────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Return immediately — no point calling next(err) for a missing header.
      return res.status(401).json({
        success: false,
        message: 'Access denied: no token provided. Please log in.',
      });
    }

    // The header is "Bearer <token>"; split on space and take index 1.
    const token = authHeader.split(' ')[1];

    // ── Step 2: Cryptographically verify the token ───────────────────────────
    // verifyTokenString throws JsonWebTokenError or TokenExpiredError on
    // failure — those bubble up to next(err) and the global error handler
    // maps them to 401 responses with helpful messages.
    const decoded = verifyTokenString(token);

    // ── Step 3: Confirm the user still exists in the database ────────────────
    // Tokens are not revoked on logout in this implementation (stateless JWT),
    // but we still protect against deleted accounts by doing a DB lookup.
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: the account associated with this token no longer exists.',
      });
    }

    // ── Step 4: Attach user to the request for downstream handlers ───────────
    req.user = user;
    next();

  } catch (err) {
    // Propagate JWT errors (JsonWebTokenError, TokenExpiredError, etc.)
    // to the global error handler which maps them to 401 responses.
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. requireRole  (middleware factory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware factory for Role-Based Access Control (RBAC).
 *
 * Usage examples:
 *   router.delete('/users/:id', verifyToken, requireRole('ADMIN'), deleteUser);
 *   router.get('/reports',      verifyToken, requireRole('ADMIN', 'MEMBER'), getReports);
 *
 * MUST be placed after verifyToken so that req.user is already populated.
 *
 * @param {...string} roles - One or more allowed role strings (e.g. 'ADMIN', 'MEMBER').
 * @returns {import('express').RequestHandler}
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // ── Guard: verifyToken must have run first ────────────────────────────────
    if (!req.user) {
      // This is a programming error (wrong middleware order), not a user error.
      return res.status(401).json({
        success: false,
        message: 'Access denied: authentication required before role check.',
      });
    }

    // ── Check membership in allowed roles ─────────────────────────────────────
    // roles is the rest-parameter array captured in the factory closure.
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions.',
        // Surface the required roles in development to ease debugging.
        ...(process.env.NODE_ENV === 'development' && {
          detail: `Required roles: [${roles.join(', ')}]. Your role: ${req.user.role}.`,
        }),
      });
    }

    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy alias – keeps existing routes that import { authenticate } working.
// New code should use verifyToken.
// ─────────────────────────────────────────────────────────────────────────────
const authenticate = verifyToken;

// requireAdmin is kept for backward compatibility with existing route files.
const requireAdmin = requireRole('ADMIN');

module.exports = { verifyToken, requireRole, authenticate, requireAdmin };
