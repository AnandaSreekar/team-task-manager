/**
 * @file project.routes.js
 * @description Express router for all /api/projects/* endpoints.
 *
 * Middleware chain applied to every route:
 *   verifyToken → (optional) requireRole → controller
 *
 * verifyToken  — validates the JWT, hydrates req.user from DB.
 * requireRole  — RBAC guard; returns 403 if the user's role is not in the
 *                allowed set.  Applied only to write/admin operations.
 *
 * Route table:
 * ┌──────────────────────────────────────────┬────────────────┬──────────────────────┐
 * │ Route                                    │ Role required  │ Controller           │
 * ├──────────────────────────────────────────┼────────────────┼──────────────────────┤
 * │ POST   /api/projects                     │ ADMIN          │ createProject        │
 * │ GET    /api/projects                     │ any auth user  │ getAllProjects        │
 * │ GET    /api/projects/:id                 │ member / ADMIN │ getProjectById       │
 * │ POST   /api/projects/:id/members         │ ADMIN          │ addMember            │
 * │ DELETE /api/projects/:id/members/:userId │ ADMIN          │ removeMember         │
 * │ DELETE /api/projects/:id                 │ ADMIN          │ deleteProject        │
 * └──────────────────────────────────────────┴────────────────┴──────────────────────┘
 *
 * Note on route ordering:
 *   The /:id/members routes must be declared before /:id so that Express does
 *   not accidentally match "/members" as the :id segment.
 */

const express = require('express');
const router  = express.Router();

const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const {
  createProject,
  getAllProjects,
  getProjectById,
  addMember,
  removeMember,
  deleteProject,
} = require('../controllers/project.controller');

// ── Apply verifyToken to every route in this router ───────────────────────────
// router.use() registers middleware for all routes defined after this line.
// Any unauthenticated request to /api/projects/** will receive 401.
router.use(verifyToken);

// ── Collection routes ─────────────────────────────────────────────────────────

/**
 * POST /api/projects
 * Create a new project. ADMIN only.
 * Body: { name: string, description?: string }
 */
router.post('/', requireRole('ADMIN'), createProject);

/**
 * GET /api/projects
 * List projects visible to the current user.
 * ADMINs see all; MEMBERs see only their enrolled projects.
 * Query: ?search=string
 */
router.get('/', getAllProjects);

// ── Member sub-resource routes (declared before /:id to avoid ambiguity) ──────

/**
 * POST /api/projects/:id/members
 * Add a user to a project. ADMIN only.
 * Body: { userId: string, role?: "ADMIN" | "MEMBER" }
 */
router.post('/:id/members', requireRole('ADMIN'), addMember);

/**
 * DELETE /api/projects/:id/members/:userId
 * Remove a user from a project. ADMIN only.
 * Cannot remove the project creator.
 */
router.delete('/:id/members/:userId', requireRole('ADMIN'), removeMember);

// ── Individual project routes ─────────────────────────────────────────────────

/**
 * GET /api/projects/:id
 * Fetch a single project with full members + tasks.
 * Accessible to project members and system ADMINs.
 */
router.get('/:id', getProjectById);

/**
 * DELETE /api/projects/:id
 * Hard-delete a project + all tasks + all members atomically.
 * ADMIN only. Returns 404 if project does not exist.
 */
router.delete('/:id', requireRole('ADMIN'), deleteProject);

module.exports = router;
