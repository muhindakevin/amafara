const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { Notification } = require('../models');

/**
 * Get user notifications
 * GET /api/notifications
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { read, type, limit = 50 } = req.query;
    const userId = req.user.id;

    let whereClause = { userId };

    if (read !== undefined) {
      whereClause.read = read === 'true';
    }

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
});

module.exports = router;

