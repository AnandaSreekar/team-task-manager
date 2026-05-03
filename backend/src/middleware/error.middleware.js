/**
 * @file error.middleware.js
 * @description Global Express error-handling middleware.
 *
 * Must be registered LAST in index.js (after all routes and the 404 handler)
 * because Express identifies error-handling middleware by its 4-argument
 * signature: (err, req, res, next).
 *
 * Responsibility:
 *   • Translate known error types (Prisma, JWT, validation) into meaningful
 *     HTTP status codes and messages.
 *   • Always return the standard response envelope:
 *       { success: false, message: string, stack?: string }
 *   • Include the stack trace ONLY in development so that production logs
 *     never leak internal details to API consumers.
 *
 * Adding new error mappings:
 *   Just add another `if/else if` block keyed on `err.code` or `err.name`.
 *   Keep the mapping table ordered from most-specific to least-specific.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Centralized Express error handler.
 *
 * @param {Error}                    err  - The error thrown or passed to next(err)
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next  - Must be declared even if unused
 *                                                 (4-arg signature is how Express
 *                                                 identifies error handlers)
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default values — overridden by specific error-type logic below.
  let statusCode = err.statusCode || err.status || 500;
  let message    = err.message    || 'An unexpected server error occurred.';

  // ── Prisma / Database errors ──────────────────────────────────────────────
  // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference

  if (err.code === 'P2002') {
    // Unique constraint violation (e.g., duplicate email)
    statusCode = 409;
    const field = err.meta?.target?.[0] || 'field';
    message = `A record with this ${field} already exists.`;

  } else if (err.code === 'P2025') {
    // Record not found (e.g., update/delete on a non-existent row)
    statusCode = 404;
    message = 'The requested record was not found.';

  } else if (err.code === 'P2003') {
    // Foreign-key constraint failure (relation does not exist)
    statusCode = 400;
    message = 'Invalid reference: the related record does not exist.';

  } else if (err.code === 'P2014') {
    // Required relation violation
    statusCode = 400;
    message = 'Invalid relation: a required related record is missing.';
  }

  // ── JWT / Authentication errors ───────────────────────────────────────────
  // These are thrown by jsonwebtoken's jwt.verify() inside auth.middleware.js.

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  if (err.name === 'NotBeforeError') {
    statusCode = 401;
    message = 'Token is not yet active. Please try again shortly.';
  }

  // ── Validation errors (express-validator passed through next(err)) ─────────
  // Normally validation short-circuits before reaching here, but this is a
  // safety net in case a validator error is forwarded via next().
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message || 'Validation failed.';
  }

  // ── SyntaxError (malformed JSON body) ─────────────────────────────────────
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body. Please check your request format.';
  }

  // ── Build the response envelope ───────────────────────────────────────────
  const response = {
    success: false,
    message,
    // Include the stack trace only in development to aid debugging.
    // In production, stack traces must never be returned to the client.
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  };

  // Log at error level — use a proper logger (Winston, Pino) in production.
  console.error(
    `[ERROR] ${new Date().toISOString()} ${req.method} ${req.originalUrl} → ${statusCode}: ${message}`,
    process.env.NODE_ENV === 'development' ? err : '',
  );

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
