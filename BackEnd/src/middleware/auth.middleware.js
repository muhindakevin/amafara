const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'umurenge_wallet_secret_key_change_in_production_2024';
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive or suspended.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    next(error);
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Check if user owns resource or is admin
 */
const authorizeResource = (resourceUserId, adminRoles = ['Group Admin', 'System Admin']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.id === resourceUserId || adminRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access this resource.'
    });
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeResource
};

