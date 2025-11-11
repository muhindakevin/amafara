const express = require('express');
const router = express.Router();
const { getGroups, getGroupById, createGroup, updateGroup, getGroupStats, getMyGroupData } = require('../controllers/group.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getGroups);
// IMPORTANT: More specific routes must come before parameterized routes
router.get('/my-group/data', authenticate, getMyGroupData);
router.get('/:id/stats', authenticate, getGroupStats);
router.get('/:id', authenticate, getGroupById);
router.post('/', authenticate, authorize('Agent', 'System Admin'), createGroup);
router.put('/:id', authenticate, authorize('Agent', 'System Admin'), updateGroup);

module.exports = router;

