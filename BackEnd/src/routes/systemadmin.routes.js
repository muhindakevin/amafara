const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  remindPassword,
  usersCount,
  agentsCount,
  branchesCount
} = require('../controllers/systemadmin.controller');

// System Admin routes - allow System Admin, Agent, and Group Admin for user creation
router.use(authenticate);

// Users management - GET and POST accessible by System Admin, Agent, and Group Admin
router.get('/users', authorize('System Admin', 'Agent', 'Group Admin'), listUsers);
router.post('/users', authorize('System Admin', 'Agent', 'Group Admin'), createUser);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/remind-password', remindPassword);

// Counts for dashboard
router.get('/users/count', usersCount);
router.get('/agents/count', agentsCount);
router.get('/branches/count', branchesCount);

module.exports = router;

