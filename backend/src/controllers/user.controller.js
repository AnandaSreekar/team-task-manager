/**
 * @file user.controller.js
 * @description Controller for User management endpoints.
 */

const prisma = require('../config/prisma');

/**
 * GET /api/users
 * Return all users from DB. 
 * Only return: id, name, email, role.
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Users fetched',
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Return single user by id param.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User fetched',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
};
