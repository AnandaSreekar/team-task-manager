/**
 * @file jwt.utils.js
 * @description Centralised JWT helpers.
 *
 * Keeping token generation in one place ensures that every part of the app
 * (register, login, token-refresh, tests) uses an identical payload shape
 * and the same secret / expiry configuration.  If we ever need to rotate the
 * secret or add a new claim (e.g. `jti` for revocation) we only touch this
 * file.
 */

const jwt = require('jsonwebtoken');

/**
 * Signs and returns a JWT for the given user.
 *
 * Payload structure:
 *   { userId, role, iat, exp }
 *
 * Including `role` directly in the payload lets downstream middleware
 * perform quick role checks WITHOUT an extra DB round-trip, while still
 * fetching the full user record for sensitive operations via `verifyToken`.
 *
 * @param {string} userId  - The UUID of the user (maps to User.id in Prisma)
 * @param {string} role    - The user's role ('ADMIN' | 'MEMBER')
 * @returns {string}        Signed JWT string
 */
const generateToken = (userId, role) => {
  if (!process.env.JWT_SECRET) {
    // Fail loudly in development; don't silently produce an insecure token.
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }

  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      // 'HS256' is the default algorithm – explicit for clarity in code reviews.
      algorithm: 'HS256',
    },
  );
};

/**
 * Verifies a raw JWT string and returns the decoded payload.
 * Throws a JsonWebTokenError or TokenExpiredError if invalid – callers
 * (e.g. verifyToken middleware) should catch and handle those.
 *
 * @param {string} token - Raw JWT string (without "Bearer " prefix)
 * @returns {object}      Decoded payload: { userId, role, iat, exp }
 */
const verifyTokenString = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
};

module.exports = { generateToken, verifyTokenString };
