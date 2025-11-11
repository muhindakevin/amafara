const { LearnGrowContent, User } = require('../models');
const { sendLearnGrowUpdate } = require('../notifications/emailService');
const { Op } = require('sequelize');

/**
 * Create Learn & Grow content
 * POST /api/learn-grow
 */
const createContent = async (req, res) => {
  try {
    const { title, description, content, type, category, fileUrl, thumbnailUrl, duration } = req.body;
    const createdBy = req.user.id;

    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title and type are required'
      });
    }

    const learnContent = await LearnGrowContent.create({
      title,
      description,
      content,
      type,
      category,
      fileUrl,
      thumbnailUrl,
      duration: duration ? parseInt(duration) : null,
      createdBy,
      status: 'published'
    });

    // TODO: Send notifications to all members about new content

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: learnContent
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create content',
      error: error.message
    });
  }
};

/**
 * Get all Learn & Grow content
 * GET /api/learn-grow
 */
const getContent = async (req, res) => {
  try {
    const { type, category, status } = req.query;

    let whereClause = {};

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    if (category) {
      whereClause.category = category;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    } else {
      whereClause.status = 'published'; // Default to published only
    }

    const contents = await LearnGrowContent.findAll({
      where: whereClause,
      include: [
        { association: 'creator', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
      error: error.message
    });
  }
};

/**
 * Get single content
 * GET /api/learn-grow/:id
 */
const getContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await LearnGrowContent.findByPk(id, {
      include: [
        { association: 'creator', attributes: ['id', 'name'] }
      ]
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Increment views
    content.views = (content.views || 0) + 1;
    await content.save();

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
      error: error.message
    });
  }
};

module.exports = {
  createContent,
  getContent,
  getContentById
};

