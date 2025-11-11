const { Transaction, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get user transactions
 * GET /api/transactions
 */
const getTransactions = async (req, res) => {
  try {
    const { type, status, startDate, endDate, limit = 50, offset = 0 } = req.query;
    const userId = req.user.role === 'Member' ? req.user.id : req.query.userId || req.user.id;

    let whereClause = { userId };

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.transactionDate = {};
      if (startDate) {
        whereClause.transactionDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.transactionDate[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        { association: 'user', attributes: ['id', 'name', 'phone'] }
      ],
      order: [['transactionDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

/**
 * Get transaction summary
 * GET /api/transactions/summary
 */
const getTransactionSummary = async (req, res) => {
  try {
    const userId = req.user.role === 'Member' ? req.user.id : req.query.userId || req.user.id;

    const transactions = await Transaction.findAll({
      where: { userId, status: 'completed' }
    });

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      byType: {},
      count: transactions.length
    };

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      
      if (['contribution', 'refund'].includes(transaction.type)) {
        summary.totalIncome += amount;
      } else {
        summary.totalExpense += amount;
      }

      if (!summary.byType[transaction.type]) {
        summary.byType[transaction.type] = 0;
      }
      summary.byType[transaction.type] += amount;
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction summary',
      error: error.message
    });
  }
};

module.exports = {
  getTransactions,
  getTransactionSummary
};

