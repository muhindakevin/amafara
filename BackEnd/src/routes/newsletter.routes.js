const express = require('express');
const router = express.Router();
const {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getNewsletterSubscriptions
} = require('../controllers/newsletter.controller');

// Public routes
router.post('/subscribe', subscribeNewsletter);
router.post('/unsubscribe', unsubscribeNewsletter);

// Admin routes (protected)
router.get('/subscriptions', getNewsletterSubscriptions);

module.exports = router;
