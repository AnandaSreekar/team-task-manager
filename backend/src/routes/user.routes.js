/**
 * @file user.routes.js
 * @description Express router for /api/users
 */

const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');
const { getUsers, getUserById } = require('../controllers/user.controller');

// All routes require authentication
router.use(verifyToken);

router.get('/', getUsers);
router.get('/:id', getUserById);

module.exports = router;
