const express = require('express');
const router = express.Router();
const { createContent, getContent, getContentById } = require('../controllers/learngrow.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getContent);
router.get('/:id', authenticate, getContentById);
router.post('/', authenticate, authorize('Secretary', 'System Admin'), createContent);

module.exports = router;

