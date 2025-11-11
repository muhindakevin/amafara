const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Agent-specific routes - extend as needed
router.get('/dashboard', authenticate, authorize('Agent'), (req, res) => {
  res.json({ success: true, message: 'Agent dashboard - implement in agent.controller.js' });
});

module.exports = router;

