const express = require('express');
const router = express.Router();
const {
  makeContribution,
  getMemberContributions,
  getAllContributions,
  approveContribution,
  rejectContribution
} = require('../controllers/contribution.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Member routes
router.post('/', authenticate, makeContribution);
router.get('/member', authenticate, getMemberContributions);

// Admin/Cashier routes
router.get('/', authenticate, authorize('Group Admin', 'Cashier', 'System Admin'), getAllContributions);
router.put('/:id/approve', authenticate, authorize('Group Admin', 'Cashier'), approveContribution);
router.put('/:id/reject', authenticate, authorize('Group Admin', 'Cashier'), rejectContribution);

module.exports = router;

