const express = require('express');
const router = express.Router();
const { createAnnouncement, getAnnouncements, sendAnnouncement } = require('../controllers/announcement.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getAnnouncements);
router.post('/', authenticate, authorize('Group Admin', 'Secretary', 'System Admin'), createAnnouncement);
router.put('/:id/send', authenticate, authorize('Group Admin', 'Secretary'), sendAnnouncement);

module.exports = router;

