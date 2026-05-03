/**
 * @file auth.controller.js
 * @description Authentication controller: register, login, getMe, changePassword.
 *
 * All responses follow the envelope format:
 *   { success: boolean, message: string, data?: object }
 *
 * Validation is handled by express-validator chains defined below and run
 * through the shared `validate` middleware before the controller body fires.
 * This keeps controllers free of manual field-checking boilerplate.
 *
 * Security decisions explained inline:
 *  • bcrypt salt rounds = 12  → ~250 ms on modern hardware; balances
 *    brute-force resistance vs. latency (OWASP recommends ≥ 10).
 *  • JWT payload contains userId + role – see jwt.utils.js for rationale.
 *  • Identical "Invalid credentials" message for both "user not found" and
 *    "wrong password" to prevent user-enumeration attacks.
 *  • @admin.com auto-role rule: intentional back-door for the hiring demo;
 *    in production this would come from an invite / provisioning flow.
 */

const bcrypt    = require('bcryptjs');
const { body }  = require('express-validator');
const prisma    = require('../config/prisma');
const { validate }       = require('../middleware/validate.middleware');
const { generateToken }  = require('../utils/jwt.utils');

// ─────────────────────────────────────────────────────────────────────────────
// Validation rule chains
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validation rules for POST /api/auth/register.
 * The last element is the `validate` middleware that short-circuits the
 * request with a 400 if any rule failed.
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(), // lower-cases, removes dots in Gmail, etc.

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),

  // Run accumulated validation results and short-circuit on failure.
  validate,
];

/**
 * Validation rules for POST /api/auth/login.
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),

  validate,
];

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strips the password field from a Prisma User record before sending it to
 * the client.  We use destructuring so the omission is explicit and auditable.
 *
 * @param {object} user - Raw user record from Prisma (includes password hash)
 * @returns {object}      User record without the password field
 */
const sanitizeUser = (user) => {
  const { password, ...safeUser } = user; // eslint-disable-line no-unused-vars
  return safeUser;
};

/**
 * Determines the role to assign to a new registrant.
 *
 * Rule: emails ending with "@admin.com" are auto-promoted to ADMIN.
 * This is intentional for the hiring demo so reviewers can test admin flows
 * without manual DB edits.  In a real product, role assignment would be
 * driven by an invitation system or a separate admin provisioning endpoint.
 *
 * @param {string} email - The validated, normalised email address
 * @returns {'ADMIN' | 'MEMBER'}
 */
const resolveRole = (email) => {
  return email.endsWith('@admin.com') ? 'ADMIN' : 'MEMBER';
};

// ─────────────────────────────────────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 *
 * Creates a new user account.
 *
 * Flow:
 *   1. Validation middleware has already confirmed name/email/password shape.
 *   2. Check for duplicate email → 409.
 *   3. Determine role (auto-ADMIN for @admin.com, otherwise MEMBER).
 *   4. Hash the password with bcrypt (salt rounds = 12).
 *   5. Persist to DB.
 *   6. Generate JWT containing userId + role.
 *   7. Return 201 with sanitized user + token.
 *
 * @type {import('express').RequestHandler}
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ── Step 1: Duplicate email check ─────────────────────────────────────────
    // We do this before hashing to fail fast — no point doing expensive crypto
    // work if the email is already taken.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please use a different email or log in.',
      });
    }

    // ── Step 2: Auto-assign role based on email domain ────────────────────────
    const role = resolveRole(email);

    // ── Step 3: Hash the password ─────────────────────────────────────────────
    // Salt rounds = 12: each additional round doubles the computation time,
    // making brute-force attacks exponentially more expensive.
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Step 4: Persist the new user ──────────────────────────────────────────
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });

    // ── Step 5: Issue JWT ─────────────────────────────────────────────────────
    const token = generateToken(user.id, user.role);

    // ── Step 6: Respond ───────────────────────────────────────────────────────
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });

  } catch (err) {
    // Delegate to the global error handler (handles Prisma P2002 unique
    // constraint violations as a safety net, JWT errors, etc.)
    next(err);
  }
};

/**
 * POST /api/auth/login
 *
 * Authenticates an existing user and returns a fresh JWT.
 *
 * Flow:
 *   1. Validation middleware has already confirmed email/password are present.
 *   2. Look up user by email.
 *   3. Compare provided password against stored bcrypt hash.
 *   4. Both step 2 and 3 failures return the same 401 message to prevent
 *      user-enumeration (attacker cannot tell whether email exists).
 *   5. Generate JWT and return 200 with sanitized user + token.
 *
 * @type {import('express').RequestHandler}
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Step 1: Find user ─────────────────────────────────────────────────────
    // findUnique returns null when not found — never throws for missing rows.
    const user = await prisma.user.findUnique({ where: { email } });

    // ── Step 2: Validate credentials (unified error message) ─────────────────
    // We deliberately avoid distinguishing "wrong email" from "wrong password"
    // to prevent account enumeration attacks (see OWASP Authentication Cheat Sheet).
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    // ── Step 3: Issue JWT ─────────────────────────────────────────────────────
    const token = generateToken(user.id, user.role);

    // ── Step 4: Respond ───────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 *
 * This is a protected route — `verifyToken` must run first and populate
 * req.user.  We still perform a fresh DB fetch rather than returning
 * req.user directly so that:
 *   a) The response always reflects the current DB state (e.g. name change).
 *   b) We can include extra fields (createdAt, _count) not stored in req.user.
 *
 * @type {import('express').RequestHandler}
 */
const getMe = async (req, res, next) => {
  try {
    // req.user.id is set by verifyToken middleware.
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        createdAt: true,
        updatedAt: true,
        // Aggregate counts for the dashboard summary — avoids a second round-trip.
        _count: {
          select: {
            tasksAssigned:   true,
            projectsCreated: true,
            projectMembers:  true,
          },
        },
      },
    });

    // This should theoretically never be null because verifyToken already
    // validated existence, but we guard defensively.
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
      data: { user },
    });

  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/change-password
 *
 * Allows an authenticated user to update their own password.
 *
 * Flow:
 *   1. Fetch the full user record (including password hash) from DB.
 *   2. Verify the provided currentPassword against the stored hash.
 *   3. Hash the newPassword.
 *   4. Persist the new hash.
 *   5. Return 200.  The client should discard the old token (though it
 *      remains technically valid until expiry — a token blacklist or short
 *      expiry mitigates this in production).
 *
 * @type {import('express').RequestHandler}
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Basic presence check (full validation could be added via express-validator)
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both currentPassword and newPassword are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    // Fetch full record — we need the password hash field that req.user omits.
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data:  { password: newHashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.',
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  // Validation chains (used directly in route definitions)
  registerValidation,
  loginValidation,
  // Controller handlers
  register,
  login,
  getMe,
  changePassword,
};
