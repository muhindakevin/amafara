const { Fine, User, Group, Transaction } = require('../models');
const { sendFineNotification } = require('../notifications/smsService');
const { logAction } = require('../utils/auditLogger');
const { Op } = require('sequelize');

/**
 * Issue a fine
 * POST /api/fines
 */
const issueFine = async (req, res) => {
  try {
    const { memberId, amount, reason, dueDate } = req.body;
    const issuerId = req.user.id;

    if (!memberId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Member ID, amount, and reason are required'
      });
    }

    const member = await User.findByPk(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (!member.groupId) {
      return res.status(400).json({
        success: false,
        message: 'Member must belong to a group'
      });
    }

    const fine = await Fine.create({
      memberId,
      groupId: member.groupId,
      amount: parseFloat(amount),
      reason,
      dueDate: dueDate ? new Date(dueDate) : null,
      issuedBy: issuerId,
      status: 'pending'
    });

    // Send notification
    try {
      await sendFineNotification(member.phone, member.name, fine.amount, reason);
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    logAction(issuerId, 'FINE_ISSUED', 'Fine', fine.id, { memberId, amount, reason }, req);

    res.status(201).json({
      success: true,
      message: 'Fine issued successfully',
      data: fine
    });
  } catch (error) {
    console.error('Issue fine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue fine',
      error: error.message
    });
  }
};

/**
 * Get member fines
 * GET /api/fines/member
 */
const getMemberFines = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { status } = req.query;

    let whereClause = { memberId };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const fines = await Fine.findAll({
      where: whereClause,
      include: [
        { association: 'group', attributes: ['id', 'name', 'code'] },
        { association: 'member', attributes: ['id', 'name', 'phone'] }
      ],
      order: [['issuedDate', 'DESC']]
    });

    res.json({
      success: true,
      data: fines
    });
  } catch (error) {
    console.error('Get member fines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fines',
      error: error.message
    });
  }
};

/**
 * Get all fines (Group Admin)
 * GET /api/fines
 */
const getAllFines = async (req, res) => {
  try {
    const { status, groupId } = req.query;
    const user = req.user;

    let whereClause = {};
    
    if (user.role === 'Group Admin' && user.groupId) {
      whereClause.groupId = user.groupId;
    } else if (groupId) {
      whereClause.groupId = groupId;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const fines = await Fine.findAll({
      where: whereClause,
      include: [
        { association: 'member', attributes: ['id', 'name', 'phone'] },
        { association: 'group', attributes: ['id', 'name', 'code'] }
      ],
      order: [['issuedDate', 'DESC']]
    });

    res.json({
      success: true,
      data: fines
    });
  } catch (error) {
    console.error('Get all fines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fines',
      error: error.message
    });
  }
};

/**
 * Approve fine
 * PUT /api/fines/:id/approve
 */
const approveFine = async (req, res) => {
  try {
    const { id } = req.params;
    const approverId = req.user.id;

    const fine = await Fine.findByPk(id, {
      include: [{ association: 'member' }]
    });

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Fine not found'
      });
    }

    fine.status = 'approved';
    fine.approvedBy = approverId;
    await fine.save();

    logAction(approverId, 'FINE_APPROVED', 'Fine', fine.id, {}, req);

    res.json({
      success: true,
      message: 'Fine approved',
      data: fine
    });
  } catch (error) {
    console.error('Approve fine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve fine',
      error: error.message
    });
  }
};

/**
 * Pay fine
 * PUT /api/fines/:id/pay
 */
const payFine = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    const memberId = req.user.id;

    const fine = await Fine.findByPk(id, {
      include: [{ association: 'member' }]
    });

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Fine not found'
      });
    }

    if (fine.memberId !== memberId) {
      return res.status(403).json({
        success: false,
        message: 'You can only pay your own fines'
      });
    }

    if (fine.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Fine must be approved before payment'
      });
    }

    fine.status = 'paid';
    fine.paidDate = new Date();
    await fine.save();

    // Create transaction
    await Transaction.create({
      userId: memberId,
      type: 'fine_payment',
      amount: fine.amount,
      balance: fine.member.totalSavings,
      status: 'completed',
      referenceId: fine.id.toString(),
      referenceType: 'Fine',
      paymentMethod: paymentMethod || 'cash',
      description: `Fine payment: ${fine.reason}`
    });

    logAction(memberId, 'FINE_PAID', 'Fine', fine.id, { amount: fine.amount }, req);

    res.json({
      success: true,
      message: 'Fine paid successfully',
      data: fine
    });
  } catch (error) {
    console.error('Pay fine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pay fine',
      error: error.message
    });
  }
};

/**
 * Waive fine
 * PUT /api/fines/:id/waive
 */
const waiveFine = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const approverId = req.user.id;

    const fine = await Fine.findByPk(id);

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Fine not found'
      });
    }

    fine.status = 'waived';
    fine.approvedBy = approverId;
    fine.waiverReason = reason || 'Administrative waiver';
    await fine.save();

    logAction(approverId, 'FINE_WAIVED', 'Fine', fine.id, { reason }, req);

    res.json({
      success: true,
      message: 'Fine waived',
      data: fine
    });
  } catch (error) {
    console.error('Waive fine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to waive fine',
      error: error.message
    });
  }
};

module.exports = {
  issueFine,
  getMemberFines,
  getAllFines,
  approveFine,
  payFine,
  waiveFine
};

