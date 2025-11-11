const { Group, User, Loan, Contribution } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all groups
 * GET /api/groups
 */
const getGroups = async (req, res) => {
  try {
    const { status, branchId } = req.query;
    const user = req.user;

    let whereClause = {};

    if (user.role === 'Agent' || user.role === 'System Admin') {
      if (branchId) whereClause.branchId = branchId;
    } else if (user.role === 'Group Admin' || user.role === 'Member') {
      if (user.groupId) whereClause.id = user.groupId;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const groups = await Group.findAll({
      where: whereClause,
      include: [
        { association: 'branch', attributes: ['id', 'name', 'code'] },
        { association: 'agent', attributes: ['id', 'name', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups',
      error: error.message
    });
  }
};

/**
 * Get group details
 * GET /api/groups/:id
 */
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id, {
      include: [
        { association: 'branch', attributes: ['id', 'name', 'code'] },
        { association: 'agent', attributes: ['id', 'name', 'phone'] },
        { 
          association: 'members', 
          attributes: ['id', 'name', 'phone', 'totalSavings', 'creditScore', 'status'],
          limit: 50
        }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group',
      error: error.message
    });
  }
};

/**
 * Create group (Agent/System Admin)
 * POST /api/groups
 */
const createGroup = async (req, res) => {
  try {
    const { name, code, description, branchId, district, sector, cell, contributionAmount, contributionFrequency } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }

    // Check if code exists
    const existingGroup = await Group.findOne({ where: { code } });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'Group code already exists'
      });
    }

    const group = await Group.create({
      name,
      code,
      description,
      branchId: branchId || req.user.branchId,
      agentId: req.user.role === 'Agent' ? req.user.id : null,
      district,
      sector,
      cell,
      contributionAmount: contributionAmount ? parseFloat(contributionAmount) : null,
      contributionFrequency: contributionFrequency || 'monthly'
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group',
      error: error.message
    });
  }
};

/**
 * Update group (Agent/System Admin)
 * PUT /api/groups/:id
 */
const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, district, sector, cell, status, contributionAmount, contributionFrequency } = req.body;

    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if code is being changed and if it's already taken
    if (code && code !== group.code) {
      const existingGroup = await Group.findOne({ where: { code } });
      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: 'Group code already exists'
        });
      }
    }

    // Update allowed fields
    if (name !== undefined) group.name = name;
    if (code !== undefined) group.code = code;
    if (description !== undefined) group.description = description;
    if (district !== undefined) group.district = district;
    if (sector !== undefined) group.sector = sector;
    if (cell !== undefined) group.cell = cell;
    if (status !== undefined) group.status = status;
    if (contributionAmount !== undefined) group.contributionAmount = contributionAmount ? parseFloat(contributionAmount) : null;
    if (contributionFrequency !== undefined) group.contributionFrequency = contributionFrequency;

    await group.save();

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: group
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group',
      error: error.message
    });
  }
};

/**
 * Get group statistics
 * GET /api/groups/:id/stats
 */
const getGroupStats = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const totalMembers = await User.count({ where: { groupId: id, status: 'active' } });
    const activeLoans = await Loan.count({
      where: {
        groupId: id,
        status: { [Op.in]: ['approved', 'disbursed', 'active'] }
      }
    });
    const pendingContributions = await Contribution.count({
      where: { groupId: id, status: 'pending' }
    });

    res.json({
      success: true,
      data: {
        totalMembers,
        activeLoans,
        pendingContributions,
        totalSavings: group.totalSavings
      }
    });
  } catch (error) {
    console.error('Get group stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group statistics',
      error: error.message
    });
  }
};

/**
 * Get comprehensive group data for member view
 * GET /api/groups/my-group/data
 * Returns: group info, leaders, members, financials
 */
const getMyGroupData = async (req, res) => {
  try {
    console.log('[getMyGroupData] Request received');
    const userId = req.user.id;
    console.log('[getMyGroupData] User ID:', userId);
    const user = await User.findByPk(userId);

    if (!user || !user.groupId) {
      return res.status(400).json({
        success: false,
        message: 'User does not belong to a group'
      });
    }

    const groupId = user.groupId;

    // Fetch group information
    const group = await Group.findByPk(groupId, {
      include: [
        { 
          association: 'branch', 
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Fetch all users in the group
    const allGroupUsers = await User.findAll({
      where: { groupId, status: 'active' },
      attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'totalSavings', 'creditScore', 'createdAt']
    });

    // Separate leaders (must be active)
    const leaders = {
      admin: null,
      cashier: null,
      secretary: null
    };

    const members = [];

    allGroupUsers.forEach(user => {
      const role = user.role;
      if (role === 'Group Admin' && user.status === 'active') {
        leaders.admin = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        };
      } else if (role === 'Cashier' && user.status === 'active') {
        leaders.cashier = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        };
      } else if (role === 'Secretary' && user.status === 'active') {
        leaders.secretary = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        };
      } else if (role === 'Member') {
        members.push({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          totalSavings: parseFloat(user.totalSavings || 0),
          creditScore: user.creditScore || 0,
          joinedDate: user.createdAt
        });
      }
    });

    // Calculate financial overview
    // Total Savings (from group.totalSavings or sum of approved contributions)
    let totalSavings = 0;
    try {
      totalSavings = parseFloat(group.totalSavings || 0);
      if (isNaN(totalSavings)) totalSavings = 0;
    } catch (e) {
      console.warn('[getMyGroupData] Error parsing totalSavings:', e);
      totalSavings = 0;
    }

    // Active Loans (sum of active loan amounts)
    let activeLoans = 0;
    try {
      const activeLoansData = await Loan.findAll({
        where: {
          groupId,
          status: { [Op.in]: ['approved', 'disbursed', 'active'] }
        },
        attributes: ['amount']
      });
      activeLoans = activeLoansData.reduce((sum, loan) => {
        const amount = parseFloat(loan.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    } catch (e) {
      console.warn('[getMyGroupData] Error calculating active loans:', e);
      activeLoans = 0;
    }

    // Monthly Contributions (current month)
    let monthlyContributions = 0;
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyContributionsData = await Contribution.findAll({
        where: {
          groupId,
          status: 'approved',
          createdAt: { [Op.gte]: startOfMonth }
        },
        attributes: ['amount']
      });
      monthlyContributions = monthlyContributionsData.reduce((sum, contrib) => {
        const amount = parseFloat(contrib.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    } catch (e) {
      console.warn('[getMyGroupData] Error calculating monthly contributions:', e);
      monthlyContributions = 0;
    }

    // Format location
    const locationParts = [group.district, group.sector, group.cell].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : 'Not specified';

    // Format contribution day
    let contributionDay = 'Not specified';
    if (group.contributionFrequency) {
      if (group.contributionFrequency === 'monthly') {
        contributionDay = '1st of every month';
      } else if (group.contributionFrequency === 'weekly') {
        contributionDay = 'Every week';
      } else {
        contributionDay = group.contributionFrequency;
      }
    }

    // Ensure all values are safe for JSON
    const response = {
      success: true,
      data: {
        groupInfo: {
          id: Number(group.id) || 0,
          name: String(group.name || ''),
          code: String(group.code || ''),
          establishedDate: group.createdAt ? new Date(group.createdAt).toISOString().split('T')[0] : null,
          location: String(location || 'Not specified'),
          contributionDay: String(contributionDay || 'Not specified'),
          contributionAmount: group.contributionAmount ? `${Number(group.contributionAmount).toLocaleString()} RWF` : 'Not specified',
          description: group.description ? String(group.description) : null
        },
        leaders: {
          admin: leaders.admin ? {
            id: Number(leaders.admin.id),
            name: String(leaders.admin.name || ''),
            email: String(leaders.admin.email || ''),
            phone: String(leaders.admin.phone || '')
          } : null,
          cashier: leaders.cashier ? {
            id: Number(leaders.cashier.id),
            name: String(leaders.cashier.name || ''),
            email: String(leaders.cashier.email || ''),
            phone: String(leaders.cashier.phone || '')
          } : null,
          secretary: leaders.secretary ? {
            id: Number(leaders.secretary.id),
            name: String(leaders.secretary.name || ''),
            email: String(leaders.secretary.email || ''),
            phone: String(leaders.secretary.phone || '')
          } : null
        },
        members: members.map(m => ({
          id: Number(m.id),
          name: String(m.name || ''),
          email: String(m.email || ''),
          phone: String(m.phone || ''),
          role: String(m.role || 'Member'),
          status: String(m.status || 'active'),
          totalSavings: Number(m.totalSavings) || 0,
          creditScore: Number(m.creditScore) || 0,
          joinedDate: m.joinedDate ? new Date(m.joinedDate).toISOString() : null
        })),
        totalMembers: Number(allGroupUsers.length) || 0,
        financials: {
          totalSavings: Number(totalSavings) || 0,
          activeLoans: Number(activeLoans) || 0,
          monthlyContributions: Number(monthlyContributions) || 0
        }
      }
    };

    console.log('[getMyGroupData] Response prepared successfully');
    res.json(response);
  } catch (error) {
    console.error('[getMyGroupData] Error:', error);
    console.error('[getMyGroupData] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group data',
      error: error.message,
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

module.exports = {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  getGroupStats,
  getMyGroupData
};

