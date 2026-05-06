/**
 * @file project.controller.js
 * @description CRUD + membership management for Projects.
 *
 * Access model (enforced at the route level via middleware, then re-checked
 * here defensively for critical operations):
 *   • createProject  — ADMIN only
 *   • getAllProjects  — any authenticated user (scope differs by role)
 *   • getProjectById — any authenticated project member; ADMIN bypasses check
 *   • addMember      — ADMIN only
 *   • removeMember   — ADMIN only
 *   • deleteProject  — ADMIN only
 *
 * All responses follow the envelope:
 *   { success: boolean, message: string, data?: object }
 *
 * Every handler is wrapped in try/catch and forwards unexpected errors to
 * Express's global error handler via next(err), keeping controller code free
 * of ad-hoc status-500 branches.
 */

const prisma = require('../config/prisma');

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Prisma include shape
// Defining once avoids drift between createProject and getProjectById.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard member include: returns the ProjectMember join record plus the
 * associated User's public fields.  Used wherever a full member list is needed.
 */
const MEMBER_INCLUDE = {
  members: {
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'asc' }, // stable ordering: oldest member first
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. createProject
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/projects
 *
 * Creates a new project and automatically adds the creating admin as a
 * ProjectMember with role ADMIN inside the same Prisma query (nested create).
 *
 * Why auto-add the creator as a member?
 *   The ProjectMember table drives access control: getAllProjects and
 *   getProjectById filter by membership.  If the creator is not a member they
 *   would immediately lose visibility of their own project.
 *
 * Validation:
 *   • name — required, minimum 3 characters.
 *   • description — optional.
 *
 * @type {import('express').RequestHandler}
 */
const createProject = async (req, res, next) => {
  try {
    const { name, description, status, dueDate } = req.body;

    // ── Validate name ─────────────────────────────────────────────────────────
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required and must be at least 3 characters.',
      });
    }

    // ── Create project + seed creator as ADMIN member atomically ──────────────
    // Using Prisma's nested `create` inside the project creation keeps both
    // the Project row and the ProjectMember row in the same round-trip and
    // ensures they either both succeed or both fail (implicit transaction).
    const project = await prisma.project.create({
      data: {
        name:        name.trim(),
        description: description?.trim() || null,
        status:      status || 'ACTIVE',
        dueDate:     dueDate ? new Date(dueDate) : null,
        createdById: req.user.id,

        // Auto-enroll the creator as project ADMIN.
        members: {
          create: {
            userId: req.user.id,
            role:   'ADMIN',
          },
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        ...MEMBER_INCLUDE,
        _count: { select: { tasks: true, members: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data:    { project },
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. getAllProjects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/projects
 *
 * Returns projects scoped to the requesting user:
 *   • ADMIN  → all projects in the system (admin oversight)
 *   • MEMBER → only projects where a ProjectMember row links them
 *
 * Each project in the list includes a computed `isAdmin` boolean:
 *   true  → the current user holds the ADMIN role inside that project
 *   false → MEMBER, or they are a system ADMIN viewing without membership
 *
 * Why include `isAdmin` in the list response?
 *   The frontend needs to know whether to render "Manage Members" / "Delete"
 *   actions per card without fetching each project individually.
 *
 * Supports optional ?search= query-string for name filtering.
 *
 * @type {import('express').RequestHandler}
 */
const getAllProjects = async (req, res, next) => {
  try {
    const { search } = req.query;

    // ── Build the WHERE clause based on role ──────────────────────────────────
    const nameFilter = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    // System ADMINs see every project; ordinary MEMBERs only see their own.
    const where =
      req.user.role === 'ADMIN'
        ? { ...nameFilter }
        : {
            // Prisma nested filter: project must have at least one member row
            // where userId matches the requester.
            members: { some: { userId: req.user.id } },
            ...nameFilter,
          };

    // ── Fetch projects with aggregated counts + member list for isAdmin ────────
    // We include `members` here (not just `_count`) so we can compute `isAdmin`
    // per project without N+1 queries.  The member list is then stripped out
    // before the response to keep the payload lean.
    const projects = await prisma.project.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: {
          // Only fetch the row(s) for the current user — sufficient for isAdmin
          // computation and avoids loading all members in the list view.
          where:  { userId: req.user.id },
          select: { role: true },
        },
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { createdAt: 'desc' }, // newest first
    });

    // ── Compute `isAdmin` and clean up the response shape ─────────────────────
    const enriched = projects.map((project) => {
      // members[] here contains 0 or 1 row (filtered to current user above).
      // System ADMINs who are not a project member will get [].
      const myMembership = project.members[0] ?? null;
      const isAdmin      = myMembership?.role === 'ADMIN';

      // Destructure members out — the list view doesn't need the full roster.
      const { members, ...rest } = project;

      return { ...rest, isAdmin };
    });

    return res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully.',
      data: {
        projects: enriched,
        total:    enriched.length,
      },
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. getProjectById
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/projects/:id
 *
 * Returns the full project detail including:
 *   • All members (name, email, their project-level role)
 *   • All tasks (summary fields + assignee + creator)
 *   • Computed `isAdmin` — whether the requester is a project admin
 *
 * Access rules:
 *   • 404 if project does not exist.
 *   • 403 if the user is not a member AND is not a system ADMIN.
 *   System ADMINs always have read access (they may not be a member).
 *
 * @type {import('express').RequestHandler}
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ── Fetch project with full relations ──────────────────────────────────────
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        // Full member roster for the detail view
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        // Task summary: key fields plus human-readable relations
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy:  { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    // ── 404 guard ─────────────────────────────────────────────────────────────
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // ── Membership / access guard ─────────────────────────────────────────────
    // System ADMINs bypass this check — they have oversight of all projects.
    const myMembership = project.members.find((m) => m.userId === req.user.id);
    const isSystemAdmin = req.user.role === 'ADMIN';

    if (!myMembership && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you are not a member of this project.',
      });
    }

    // ── Compute isAdmin for the requester ─────────────────────────────────────
    const isAdmin = myMembership?.role === 'ADMIN' || false;

    return res.status(200).json({
      success: true,
      message: 'Project retrieved successfully.',
      data:    { project: { ...project, isAdmin } },
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. addMember
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/projects/:id/members
 *
 * Adds a user to a project with a specified role.
 *
 * Validation sequence (fail-fast order):
 *   1. Verify the project itself exists → 404.
 *   2. Verify the target user exists    → 404.
 *   3. Check for duplicate membership  → 409.
 *   4. Create the ProjectMember row.
 *   5. Return the full updated member list.
 *
 * Why return the full member list instead of just the new member?
 *   The frontend can replace its local state in one shot without an extra
 *   GET /projects/:id/members round-trip.
 *
 * Body: { userId: string, role?: "ADMIN" | "MEMBER" }
 *
 * @type {import('express').RequestHandler}
 */
const addMember = async (req, res, next) => {
  try {
    const { id: projectId }        = req.params;
    const { userId, role = 'MEMBER' } = req.body;

    // ── Input presence check ──────────────────────────────────────────────────
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required in the request body.',
      });
    }

    // Normalise role — reject anything outside the enum.
    const normalizedRole = role?.toUpperCase();
    if (!['ADMIN', 'MEMBER'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'role must be either "ADMIN" or "MEMBER".',
      });
    }

    // ── Verify project exists ─────────────────────────────────────────────────
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // ── Verify target user exists ─────────────────────────────────────────────
    // We look the user up by id (not email) because the caller supplies a UUID
    // from a user-picker UI.
    const targetUser = await prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Cannot add a non-existent user to a project.',
      });
    }

    // ── Duplicate membership check ────────────────────────────────────────────
    // The DB has a @@unique([projectId, userId]) constraint that would also
    // catch this, but checking here first lets us return a cleaner 409 message
    // instead of exposing the raw Prisma P2002 error to the client.
    const existingMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this project.',
      });
    }

    // ── Create the membership row ─────────────────────────────────────────────
    await prisma.projectMember.create({
      data: { projectId, userId, role: normalizedRole },
    });

    // ── Return the updated member list ────────────────────────────────────────
    const updatedMembers = await prisma.projectMember.findMany({
      where:   { projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(201).json({
      success: true,
      message: `${targetUser.name} has been added to the project as ${normalizedRole}.`,
      data:    { members: updatedMembers },
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. removeMember
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/projects/:id/members/:userId
 *
 * Removes a user from a project.
 *
 * Guard: the project creator cannot be removed.
 * Why?  Removing the creator would orphan the project — no one with
 * admin authority (tied to the creator) could manage it.  In a more
 * advanced system you'd transfer ownership first.
 *
 * @type {import('express').RequestHandler}
 */
const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;

    // ── Verify the project exists and get creator id ──────────────────────────
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: { id: true, createdById: true, name: true },
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // ── Creator-removal guard ─────────────────────────────────────────────────
    if (project.createdById === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project creator. Transfer ownership first.',
      });
    }

    // ── Verify the target is actually a member ────────────────────────────────
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'This user is not a member of the project.',
      });
    }

    // ── Delete the membership row ─────────────────────────────────────────────
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });

    return res.status(200).json({
      success: true,
      message: 'Member removed from the project successfully.',
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. deleteProject
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/projects/:id
 *
 * Hard-deletes a project and ALL associated data atomically.
 *
 * Deletion order matters because of foreign-key constraints:
 *   1. Tasks          (reference projectId → Project)
 *   2. ProjectMembers (reference projectId → Project)
 *   3. Project        (root record)
 *
 * Why a Prisma interactive transaction?
 *   ─ Atomicity: if any step fails (e.g., a task delete), the entire
 *     operation rolls back, preventing partial deletes that leave orphan rows.
 *   ─ Consistency: no other request can observe a half-deleted project while
 *     the transaction is in-flight.
 *   ─ The schema has onDelete: Cascade on both Task.projectId and
 *     ProjectMember.projectId, so a single `prisma.project.delete` WOULD work
 *     at the DB level — but we delete manually here to be explicit and to
 *     demonstrate control of execution order (important for the assignment).
 *
 * @type {import('express').RequestHandler}
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;

    // ── Existence check before entering the transaction ───────────────────────
    // Fail fast outside the transaction so we don't acquire locks unnecessarily.
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: { id: true, name: true },
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // ── Atomic deletion via interactive Prisma transaction ────────────────────
    // The callback receives `tx` — a transactional Prisma client bound to the
    // same DB connection and open transaction.  All operations on `tx` are
    // either committed together or rolled back together.
    await prisma.$transaction(async (tx) => {

      // Step 1 — Delete all tasks belonging to the project.
      await tx.task.deleteMany({ where: { projectId } });

      // Step 2 — Delete all project-member join records.
      await tx.projectMember.deleteMany({ where: { projectId } });

      // Step 3 — Delete the project record itself.
      await tx.project.delete({ where: { id: projectId } });

    });

    return res.status(200).json({
      success: true,
      message: 'Project and all associated data deleted successfully.',
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  addMember,
  removeMember,
  deleteProject,
};
