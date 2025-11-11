const express = require('express');
const router = express.Router();
const { sendOTPCode, verifyOTP, getCurrentUser, demoLogin, passwordLogin, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// OTP endpoints retained but not used by UI currently
router.post('/send-otp', sendOTPCode);
router.post('/verify-otp', verifyOTP);
router.post('/demo-login', demoLogin);
router.post('/login', passwordLogin);
router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);
router.get('/me', authenticate, getCurrentUser);

module.exports = router;

