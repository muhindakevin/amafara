const { Announcement, Group, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Create announcement
 * POST /api/announcements
 */
const createAnnouncement = async (req, res) => {
  try {
    const { groupId, title, content, priority } = req.body;
    const createdBy = req.user.id;

    if (!groupId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Group ID, title, and content are required'
      });
    }

    const announcement = await Announcement.create({
      groupId,
      title,
      content,
      priority: priority || 'medium',
      createdBy,
      status: 'draft'
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message
    });
  }
};

/**
 * Get announcements
 * GET /api/announcements
 */
const getAnnouncements = async (req, res) => {
  try {
    const { groupId, status } = req.query;
    const user = req.user;

    let whereClause = {};

    if (user.role === 'Group Admin' && user.groupId) {
      whereClause.groupId = user.groupId;
    } else if (groupId) {
      whereClause.groupId = groupId;
    } else if (user.role === 'Member' && user.groupId) {
      whereClause.groupId = user.groupId;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const announcements = await Announcement.findAll({
      where: whereClause,
      include: [
        { association: 'group', attributes: ['id', 'name', 'code'] },
        { association: 'creator', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message
    });
  }
};

/**
 * Send announcement
 * PUT /api/announcements/:id/send
 */
const sendAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByPk(id, {
      include: [{ association: 'group' }]
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    announcement.status = 'sent';
    announcement.sentAt = new Date();
    await announcement.save();

    // TODO: Send notifications to all group members

    res.json({
      success: true,
      message: 'Announcement sent successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send announcement',
      error: error.message
    });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  sendAnnouncement
};

