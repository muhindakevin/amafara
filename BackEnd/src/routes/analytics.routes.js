const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { Loan, Contribution, User, Transaction, Group } = require('../models');
const { Op } = require('sequelize');

/**
 * Get analytics data
 * GET /api/analytics
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { groupId, startDate, endDate } = req.query;
    const user = req.user;

    let groupFilter = {};
    if (user.role === 'Group Admin' && user.groupId) {
      groupFilter.id = user.groupId;
    } else if (groupId) {
      groupFilter.id = groupId;
    }

    // Get statistics
    const totalSavings = await User.sum('totalSavings', {
      where: user.groupId ? { groupId: user.groupId } : {}
    });

    const activeLoans = await Loan.count({
      where: {
        status: { [Op.in]: ['approved', 'disbursed', 'active'] },
        ...(user.groupId && { groupId: user.groupId })
      }
    });

    const totalMembers = await User.count({
      where: {
        role: 'Member',
        status: 'active',
        ...(user.groupId && { groupId: user.groupId })
      }
    });

    const pendingContributions = await Contribution.count({
      where: {
        status: 'pending',
        ...(user.groupId && { groupId: user.groupId })
      }
    });

    res.json({
      success: true,
      data: {
        totalSavings: totalSavings || 0,
        activeLoans,
        totalMembers,
        pendingContributions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

module.exports = router;

