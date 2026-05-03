/**
 * @file index.js
 * @description Express application entry point.
 *
 * Startup order matters:
 *   1. Load env vars (dotenv) — must be first so all other modules see them.
 *   2. Register global middleware (CORS, body parsers).
 *   3. Mount route handlers.
 *   4. Register the 404 catch-all.
 *   5. Register the global error handler LAST — Express identifies it by its
 *      4-argument signature (err, req, res, next) and only invokes it when
 *      next(err) is called or a synchronous throw escapes a route handler.
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const { PrismaClient } = require('@prisma/client');

// ── Route modules ─────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth.routes');
const userRoutes    = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes    = require('./routes/task.routes');

// ── Middleware modules ────────────────────────────────────────────────────────
const { errorHandler } = require('./middleware/error.middleware');
const { notFound }     = require('./middleware/notFound.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// Initialise
// ─────────────────────────────────────────────────────────────────────────────
const app    = express();
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Global middleware
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CORS — restrict origins in production via FRONTEND_URL env variable.
 * credentials: true is required for cookies / Authorization headers in
 * cross-origin requests.
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Parse JSON bodies (limit prevents memory-exhaustion attacks).
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies (HTML forms, x-www-form-urlencoded).
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/health
 *
 * Lightweight liveness + readiness probe.  Load balancers, Docker HEALTHCHECK,
 * and uptime monitors can call this endpoint.
 *
 * Returns the standard response envelope so tooling can parse it uniformly:
 *   { success: true,  message, data: { status, database, version, timestamp } }
 *   { success: false, message, data: { status, database } }
 */
app.get('/api/health', async (req, res) => {
  try {
    // A minimal query that proves the DB connection is alive.
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      message: 'Team Task Manager API is healthy.',
      data: {
        status:    'OK',
        database:  'connected',
        version:   '1.0.0',
        timestamp: new Date().toISOString(),
        env:       process.env.NODE_ENV || 'development',
      },
    });

  } catch (dbError) {
    // Service is up but DB is unreachable — 503 Service Unavailable.
    return res.status(503).json({
      success: false,
      message: 'Database connection failed.',
      data: {
        status:    'ERROR',
        database:  'disconnected',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────────────────────

app.use('/api/auth',     authRoutes);     // POST /register, POST /login, GET /me
app.use('/api/users',    userRoutes);     // CRUD for users (admin-gated)
app.use('/api/projects', projectRoutes);  // CRUD for projects + member management
app.use('/api/tasks',    taskRoutes);     // CRUD for tasks + stats

// ─────────────────────────────────────────────────────────────────────────────
// 404 & Error handlers  — MUST be registered after all routes
// ─────────────────────────────────────────────────────────────────────────────

// Catch requests to undefined routes and forward a structured 404 error.
app.use(notFound);

/**
 * Global error handler.
 * Placed LAST so it receives errors forwarded from any route via next(err).
 * Handles: Prisma errors, JWT errors, validation errors, SyntaxErrors.
 * Always returns: { success: false, message, stack? (dev only) }
 */
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────────────────────────────────────
// On SIGTERM / SIGINT: close the HTTP server (stop accepting new connections),
// then disconnect Prisma (flushes the connection pool), then exit cleanly.
// This prevents requests in-flight from being abruptly dropped.

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  await prisma.$disconnect();
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

