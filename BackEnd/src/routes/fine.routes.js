const express = require('express');
const router = express.Router();
const {
  issueFine,
  getMemberFines,
  getAllFines,
  approveFine,
  payFine,
  waiveFine
} = require('../controllers/fine.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Member routes
router.get('/member', authenticate, getMemberFines);
router.put('/:id/pay', authenticate, payFine);

// Admin routes
router.post('/', authenticate, authorize('Group Admin', 'Cashier', 'System Admin'), issueFine);
router.get('/', authenticate, authorize('Group Admin', 'Cashier', 'System Admin'), getAllFines);
router.put('/:id/approve', authenticate, authorize('Group Admin'), approveFine);
router.put('/:id/waive', authenticate, authorize('Group Admin'), waiveFine);

module.exports = router;

