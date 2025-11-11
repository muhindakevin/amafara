const { Vote, VoteOption, VoteResponse, Group, User } = require('../models');
const { logAction } = require('../utils/auditLogger');
const { Op } = require('sequelize');

/**
 * Create vote
 * POST /api/voting
 */
const createVote = async (req, res) => {
  try {
    const { groupId, title, description, type, endDate, options } = req.body;
    const createdBy = req.user.id;

    if (!groupId || !title || !endDate || !options || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Group ID, title, end date, and at least 2 options are required'
      });
    }

    const vote = await Vote.create({
      groupId,
      title,
      description,
      type: type || 'other',
      endDate: new Date(endDate),
      createdBy,
      status: 'open'
    });

    // Create vote options
    const voteOptions = await Promise.all(
      options.map(optionText =>
        VoteOption.create({
          voteId: vote.id,
          option: optionText
        })
      )
    );

    logAction(createdBy, 'VOTE_CREATED', 'Vote', vote.id, { groupId, title }, req);

    res.status(201).json({
      success: true,
      message: 'Vote created successfully',
      data: {
        ...vote.toJSON(),
        options: voteOptions
      }
    });
  } catch (error) {
    console.error('Create vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vote',
      error: error.message
    });
  }
};

/**
 * Get votes
 * GET /api/voting
 */
const getVotes = async (req, res) => {
  try {
    const { groupId, status } = req.query;
    const user = req.user;

    let whereClause = {};

    if (user.role === 'Group Admin' && user.groupId) {
      whereClause.groupId = user.groupId;
    } else if (user.role === 'Member' && user.groupId) {
      whereClause.groupId = user.groupId;
    } else if (groupId) {
      whereClause.groupId = groupId;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const votes = await Vote.findAll({
      where: whereClause,
      include: [
        { association: 'group', attributes: ['id', 'name', 'code'] },
        { association: 'creator', attributes: ['id', 'name'] },
        { association: 'options' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: votes
    });
  } catch (error) {
    console.error('Get votes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch votes',
      error: error.message
    });
  }
};

/**
 * Cast vote
 * POST /api/voting/:id/vote
 */
const castVote = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionId } = req.body;
    const memberId = req.user.id;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: 'Option ID is required'
      });
    }

    const vote = await Vote.findByPk(id, {
      include: [{ association: 'group' }]
    });

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Vote not found'
      });
    }

    if (vote.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Vote is not open'
      });
    }

    if (new Date() > new Date(vote.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Vote has ended'
      });
    }

    // Check if user already voted
    const existingVote = await VoteResponse.findOne({
      where: { voteId: id, memberId }
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted'
      });
    }

    // Verify option belongs to this vote
    const option = await VoteOption.findByPk(optionId);
    if (!option || option.voteId !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote option'
      });
    }

    // Create vote response
    await VoteResponse.create({
      voteId: id,
      optionId,
      memberId
    });

    // Update vote counts
    option.voteCount = (option.voteCount || 0) + 1;
    await option.save();

    vote.totalVotes = (vote.totalVotes || 0) + 1;
    await vote.save();

    logAction(memberId, 'VOTE_CAST', 'Vote', vote.id, { optionId }, req);

    res.json({
      success: true,
      message: 'Vote cast successfully',
      data: { vote, option }
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cast vote',
      error: error.message
    });
  }
};

/**
 * Get single vote with details
 * GET /api/voting/:id
 */
const getVoteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vote = await Vote.findByPk(id, {
      include: [
        { association: 'group', attributes: ['id', 'name', 'code'] },
        { association: 'creator', attributes: ['id', 'name'] },
        { 
          association: 'options',
          include: [{ association: 'responses' }]
        }
      ]
    });

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Vote not found'
      });
    }

    // Calculate vote counts for each option
    const optionsWithCounts = vote.options.map(option => ({
      ...option.toJSON(),
      voteCount: option.responses ? option.responses.length : 0
    }));

    res.json({
      success: true,
      data: {
        ...vote.toJSON(),
        options: optionsWithCounts
      }
    });
  } catch (error) {
    console.error('Get vote by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vote',
      error: error.message
    });
  }
};

/**
 * Get user's vote for a specific vote
 * GET /api/voting/:id/my-vote
 */
const getMyVote = async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.user.id;

    const voteResponse = await VoteResponse.findOne({
      where: { voteId: id, memberId },
      include: [
        { association: 'option' },
        { association: 'vote' }
      ]
    });

    if (!voteResponse) {
      return res.status(404).json({
        success: false,
        message: 'You have not voted on this proposal yet'
      });
    }

    res.json({
      success: true,
      data: {
        voteId: voteResponse.voteId,
        option: voteResponse.option,
        votedAt: voteResponse.createdAt
      }
    });
  } catch (error) {
    console.error('Get my vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your vote',
      error: error.message
    });
  }
};

module.exports = {
  createVote,
  getVotes,
  castVote,
  getVoteById,
  getMyVote
};

