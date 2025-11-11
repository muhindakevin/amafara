const express = require('express');
const router = express.Router();
const {
  requestLoan,
  getMemberLoans,
  getLoanRequests,
  approveLoan,
  rejectLoan,
  getLoanById,
  makeLoanPayment
} = require('../controllers/loan.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Member routes
router.post('/request', authenticate, requestLoan);
router.get('/member', authenticate, getMemberLoans);
router.get('/:id', authenticate, getLoanById);
router.post('/:id/pay', authenticate, makeLoanPayment);

// Admin routes
router.get('/requests', authenticate, authorize('Group Admin', 'System Admin', 'Cashier'), getLoanRequests);
router.put('/:id/approve', authenticate, authorize('Group Admin', 'System Admin'), approveLoan);
router.put('/:id/reject', authenticate, authorize('Group Admin', 'System Admin'), rejectLoan);

module.exports = router;

