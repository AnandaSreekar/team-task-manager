/**
 * @file auth.routes.js
 * @description Express router for all /api/auth/* endpoints.
 *
 * Route summary:
 *   POST   /api/auth/register   — create account (public)
 *   POST   /api/auth/login      — authenticate and receive JWT (public)
 *   GET    /api/auth/me         — get own profile (protected: verifyToken)
 *   PATCH  /api/auth/change-password — update own password (protected: verifyToken)
 *
 * Middleware execution order per route (left → right):
 *   1. Validation chain (express-validator rules + validate middleware)
 *   2. verifyToken  (on protected routes only)
 *   3. Controller handler
 *
 * No role guard is applied here — all authenticated users can access their
 * own profile and change their own password.  Role-specific gates live in
 * the other route files (users, projects, tasks).
 */

const express = require('express');
const router  = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');

const {
  registerValidation,
  loginValidation,
  register,
  login,
  getMe,
  changePassword,
} = require('../controllers/auth.controller');

// ─── Public routes ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Returns: { success, message, data: { token, user } }
 *
 * Validation chain runs first and returns 400 on failure.
 * If email ends with "@admin.com" the user is auto-assigned ADMIN role.
 */
router.post('/register', registerValidation, register);

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { success, message, data: { token, user } }
 *
 * Both "user not found" and "wrong password" return 401 with the same
 * message to prevent account-enumeration attacks.
 */
router.post('/login', loginValidation, login);

// ─── Protected routes (require valid JWT) ─────────────────────────────────────

/**
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 * Returns: { success, message, data: { user } }
 *
 * verifyToken validates the JWT and attaches the user record to req.user.
 * getMe performs a fresh DB fetch to return the latest profile state.
 */
router.get('/me', verifyToken, getMe);

/**
 * PATCH /api/auth/change-password
 * Headers: Authorization: Bearer <token>
 * Body: { currentPassword, newPassword }
 * Returns: { success, message }
 */
router.patch('/change-password', verifyToken, changePassword);

module.exports = router;
