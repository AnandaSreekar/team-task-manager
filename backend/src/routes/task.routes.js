/**
 * @file task.routes.js
 * @description Express router for /api/tasks
 */

const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboard,
} = require('../controllers/task.controller');

// All routes require authentication
router.use(verifyToken);

// Dashboard MUST be before /:id to avoid matching 'dashboard' as an ID
router.get('/dashboard', getDashboard);

router.post('/', createTask);
router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
