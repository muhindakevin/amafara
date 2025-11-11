const express = require('express');
const router = express.Router();
const { createMeeting, getMeetings, updateMeeting } = require('../controllers/meeting.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getMeetings);
router.post('/', authenticate, authorize('Group Admin', 'Secretary'), createMeeting);
router.put('/:id', authenticate, authorize('Group Admin', 'Secretary'), updateMeeting);

module.exports = router;

