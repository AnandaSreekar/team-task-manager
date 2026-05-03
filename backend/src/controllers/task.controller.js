/**
 * @file task.controller.js
 * @description Controller for Task management and Dashboard API.
 */

const prisma = require('../config/prisma');

// Helper to compute overdue and days until due
const addComputedFields = (task) => {
  const now = new Date();
  const isOverdue = !!(
    task.dueDate &&
    new Date(task.dueDate) < now &&
    task.status !== 'DONE'
  );

  let daysUntilDue = null;
  if (task.dueDate) {
    const diffTime = new Date(task.dueDate).getTime() - now.getTime();
    daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return { ...task, isOverdue, daysUntilDue };
};

/**
 * POST /api/tasks
 * Create a new task. Only project ADMIN can create tasks.
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assignedToId } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ success: false, message: 'Title and projectId are required.' });
    }

    if (dueDate && new Date(dueDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'dueDate must be a future date.' });
    }

    // Check project membership and role
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } }
    });

    const isSystemAdmin = req.user.role === 'ADMIN';
    const isProjectAdmin = membership?.role === 'ADMIN';

    if (!isProjectAdmin && !isSystemAdmin) {
      return res.status(403).json({ success: false, message: 'Only project admins can create tasks.' });
    }

    // If assigning to someone, verify they are in the project
    if (assignedToId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assignedToId } }
      });
      if (!assigneeMembership) {
        return res.status(400).json({ success: false, message: 'Assignee must be a member of the project.' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assignedToId: assignedToId || null,
        createdById: req.user.id,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      }
    });

    res.status(201).json({ success: true, message: 'Task created successfully.', data: { task: addComputedFields(task) } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tasks
 * Get tasks for a specific project.
 */
const getAllTasks = async (req, res, next) => {
  try {
    const { projectId, status, priority, assignedToId } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId query parameter is required.' });
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } }
    });

    if (!membership && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this project.' });
    }

    const where = {
      projectId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assignedToId && { assignedToId }),
    };

    let tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      }
    });

    tasks = tasks.map(addComputedFields);

    // Sort: overdue tasks first, then by dueDate ascending
    tasks.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    });

    res.status(200).json({ success: true, message: 'Tasks retrieved.', data: { tasks } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tasks/:id
 * Get task by id
 */
const getTaskById = async (req, res, next) => {
  try {
    // Note: getDashboard route must be defined before /:id in routes
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
    });

    if (!membership && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, message: 'Task retrieved.', data: { task: addComputedFields(task) } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/tasks/:id
 * Update a task. ADMIN can update anything. MEMBER can only update status if assigned.
 */
const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, assignedToId } = req.body;
    const taskId = req.params.id;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
    });

    const isSystemAdmin = req.user.role === 'ADMIN';
    const isProjectAdmin = membership?.role === 'ADMIN';
    const isAdmin = isSystemAdmin || isProjectAdmin;

    if (!isAdmin) {
      // MEMBER can only update status if they are assigned to the task
      if (task.assignedToId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only update tasks assigned to you.' });
      }
      
      const updates = {};
      if (status) updates.status = status;
      
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updates,
        include: {
          project: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        }
      });
      return res.status(200).json({ success: true, message: 'Task updated.', data: { task: addComputedFields(updatedTask) } });
    }

    // ADMIN updates
    if (assignedToId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: assignedToId } }
      });
      if (!assigneeMembership) {
        return res.status(400).json({ success: false, message: 'Assignee must be a project member.' });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      }
    });

    res.status(200).json({ success: true, message: 'Task updated.', data: { task: addComputedFields(updatedTask) } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/tasks/:id
 * Delete a task (ADMIN only)
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
    });

    if (membership?.role !== 'ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only project admins can delete tasks.' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tasks/dashboard
 * SPECIAL ENDPOINT: Returns comprehensive stats for the logged-in user
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all projects user is a member of
    const projectMemberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    });
    
    const projectIds = projectMemberships.map(pm => pm.projectId);

    if (projectIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Dashboard loaded.',
        data: {
          totalProjects: 0,
          totalTasks: 0,
          tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
          tasksByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0 },
          overdueTasks: [],
          myAssignedTasks: [],
          recentActivity: []
        }
      });
    }

    const tasksCondition = { projectId: { in: projectIds } };

    const totalProjects = projectIds.length;
    const totalTasks = await prisma.task.count({ where: tasksCondition });

    const statusGroups = await prisma.task.groupBy({
      by: ['status'],
      where: tasksCondition,
      _count: { id: true }
    });
    const tasksByStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    statusGroups.forEach(g => { tasksByStatus[g.status] = g._count.id; });

    const priorityGroups = await prisma.task.groupBy({
      by: ['priority'],
      where: tasksCondition,
      _count: { id: true }
    });
    const tasksByPriority = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    priorityGroups.forEach(g => { tasksByPriority[g.priority] = g._count.id; });

    const now = new Date();
    
    // Fetch all tasks that might be overdue
    const allTasks = await prisma.task.findMany({
      where: {
        ...tasksCondition,
        status: { not: 'DONE' },
        dueDate: { not: null, lt: now }
      },
      include: { project: { select: { name: true } } }
    });
    const overdueTasks = allTasks.map(addComputedFields).filter(t => t.isOverdue);

    // My assigned tasks
    const myAssignedTasksRaw = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: { not: 'DONE' }
      },
      include: { project: { select: { name: true } } }
    });
    const myAssignedTasks = myAssignedTasksRaw.map(addComputedFields);

    // Recent activity
    const recentActivityRaw = await prisma.task.findMany({
      where: tasksCondition,
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { project: { select: { name: true } } }
    });
    const recentActivity = recentActivityRaw.map(addComputedFields);

    res.status(200).json({
      success: true,
      message: 'Dashboard stats loaded.',
      data: {
        totalProjects,
        totalTasks,
        tasksByStatus,
        tasksByPriority,
        overdueTasks,
        myAssignedTasks,
        recentActivity
      }
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboard,
};
