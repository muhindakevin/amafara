const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { generateOTP, generateOTPExpiry, isOTPExpired } = require('../utils/otpGenerator');
const { sendOTP, sendRegistrationConfirmation } = require('../notifications/smsService');
const { sendWelcomeEmail, sendOtpEmail } = require('../notifications/emailService');
const { logAction } = require('../utils/auditLogger');
/**
 * Forgot Password (simulation)
 * POST /api/auth/forgot
 */
const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ success: false, message: 'Email or phone is required' });
    const where = identifier.includes('@') ? { email: identifier } : { phone: identifier };
    const user = await User.findOne({ where });
    if (!user) return res.status(200).json({ success: true, message: 'If the account exists, a reset link/code has been sent.' });
    logAction(user.id, 'FORGOT_PASSWORD_REQUEST', 'User', user.id, {}, req);
    return res.json({ success: true, message: 'If the account exists, a reset link/code has been sent.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to process request', error: error.message });
  }
};

/**
 * Reset Password (simulation)
 * POST /api/auth/reset
 */
const resetPassword = async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;
    if (!identifier || !newPassword) return res.status(400).json({ success: false, message: 'Identifier and new password required' });
    const where = identifier.includes('@') ? { email: identifier } : { phone: identifier };
    const user = await User.findOne({ where });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    logAction(user.id, 'PASSWORD_RESET', 'User', user.id, {}, req);
    return res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
};
/**
 * Email/Phone + Password Login
 * POST /api/auth/login
 */
const passwordLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password required' });
    }

    // Accept email or phone
    const where = identifier.includes('@') ? { email: identifier } : { phone: identifier };
    const user = await User.findOne({ where });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Only approved (active) users may proceed to OTP
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is awaiting approval from your Group Admin.' });
    }

    // Generate and send OTP, do not issue JWT yet
    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES) || 10);
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Log OTP in non-production for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP for ${user.email || user.phone}: ${otp}`);
    }

    // Send response immediately, don't wait for notifications
    res.json({
      success: true,
      message: 'OTP sent. Please verify to continue.',
      data: {
        otpRequired: true,
        contact: user.phone || user.email,
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      }
    });

    // Send notifications in background (non-blocking)
    setImmediate(async () => {
      try {
        if (user.phone) await sendOTP(user.phone, otp);
      } catch (smsErr) {
        console.warn('OTP SMS send failed:', smsErr?.message || smsErr);
      }
      try {
        if (user.email) await sendOtpEmail(user.email, user.name, otp);
      } catch (emailErr) {
        console.warn('OTP email send failed:', emailErr?.message || emailErr);
      }
    });

    // Log action in background (non-blocking)
    setImmediate(() => {
      logAction(user.id, 'LOGIN_PASSWORD_OTP_SENT', 'User', user.id, {}, req).catch(err => {
        console.error('Failed to log audit action:', err);
      });
    });
  } catch (error) {
    console.error('Password login error:', error);
    res.status(500).json({ success: false, message: 'Failed to login', error: error.message });
  }
};


/**
 * Send OTP to phone number
 * POST /api/auth/send-otp
 */
const sendOTPCode = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Format phone number (ensure +250 prefix)
    const formattedPhone = phone.startsWith('+') ? phone : `+250${phone.replace(/^0/, '')}`;

    // Find or create user
    let user = await User.findOne({ where: { phone: formattedPhone } });

    if (!user) {
      // For demo purposes, create user if not exists
      // In production, this should be registration flow
      user = await User.create({
        phone: formattedPhone,
        name: 'User',
        role: 'Member',
        status: 'pending'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES) || 10);

    // Save OTP to user
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Log OTP in non-production for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP for ${user.email || user.phone}: ${otp}`);
    }

    // Send OTP via SMS
    try {
      await sendOTP(formattedPhone, otp);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      // Continue even if SMS fails (for development)
    }

    logAction(user.id, 'OTP_REQUESTED', 'User', user.id, { phone: formattedPhone }, req);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: formattedPhone,
        expiry: otpExpiry,
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

/**
 * Verify OTP and login
 * POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp, identifier } = req.body;

    if ((!phone && !identifier) || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Identifier/phone and OTP are required'
      });
    }

    let user;
    if (phone) {
      const formattedPhone = phone.startsWith('+') ? phone : `+250${phone.replace(/^0/, '')}`;
      user = await User.findOne({ where: { phone: formattedPhone } });
    } else if (identifier) {
      if (identifier.includes('@')) {
        user = await User.findOne({ where: { email: identifier } });
      } else {
        const formattedPhone = identifier.startsWith('+') ? identifier : `+250${identifier.replace(/^0/, '')}`;
        user = await User.findOne({ where: { phone: formattedPhone } });
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP matches and not expired
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (isOTPExpired(user.otpExpiry)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpiry = null;
    user.lastLogin = new Date();
    if (user.status === 'pending') {
      user.status = 'active';
    }
    await user.save();

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'umurenge_wallet_secret_key_change_in_production_2024';
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Send welcome notification if first login
    if (user.status === 'active' && !user.lastLogin) {
      try {
        if (user.email) {
          await sendWelcomeEmail(user.email, user.name);
        }
        await sendRegistrationConfirmation(user.phone, user.name);
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }
    }

    logAction(user.id, 'LOGIN', 'User', user.id, {}, req);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          groupId: user.groupId,
          totalSavings: user.totalSavings,
          creditScore: user.creditScore,
          language: user.language
        }
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const { Contribution } = require('../models');
    
    // Fetch user with group information
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] },
      include: [{ association: 'group', attributes: ['id', 'name', 'code'] }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate totalSavings from actual approved contributions (source of truth)
    const approvedContributions = await Contribution.findAll({
      where: {
        memberId: user.id,
        status: 'approved'
      },
      attributes: ['amount']
    });

    const calculatedTotalSavings = approvedContributions.reduce((sum, c) => {
      return sum + parseFloat(c.amount || 0);
    }, 0);

    // Sync stored value if different (update in background, don't wait)
    const storedTotalSavings = parseFloat(user.totalSavings || 0);
    if (Math.abs(storedTotalSavings - calculatedTotalSavings) > 0.01) {
      user.totalSavings = calculatedTotalSavings;
      user.save().catch(err => {
        console.warn('Failed to sync user totalSavings:', err.message);
      });
    }

    // Send response immediately with calculated totalSavings
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        groupId: user.groupId,
        branchId: user.branchId,
        totalSavings: calculatedTotalSavings, // Use calculated value from contributions
        creditScore: user.creditScore || 0,
        language: user.language,
        status: user.status,
        nationalId: user.nationalId,
        group: user.group ? {
          id: user.group.id,
          name: user.group.name,
          code: user.group.code
        } : null
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

/**
 * Demo login (deprecated for production) - keep route but return 400 to prevent demo users
 */
const demoLogin = async (req, res) => {
  return res.status(400).json({ success: false, message: 'Demo login is disabled. Use email/phone + password.' });
};

module.exports = {
  sendOTPCode,
  verifyOTP,
  getCurrentUser,
  demoLogin,
  passwordLogin,
  forgotPassword,
  resetPassword
};

