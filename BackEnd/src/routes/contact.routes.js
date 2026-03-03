const express = require('express');
const router = express.Router();
const { sendContactMessage } = require('../controllers/contact.controller');

/**
 * @route   POST /api/contact/send
 * @desc    Send contact form message
 * @access  Public
 */
router.post('/send', sendContactMessage);

module.exports = router;
