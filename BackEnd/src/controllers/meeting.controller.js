const { Meeting, Group, User } = require('../models');
const { sendMeetingReminder } = require('../notifications/smsService');
const { logAction } = require('../utils/auditLogger');
const { Op } = require('sequelize');

/**
 * Create meeting
 * POST /api/meetings
 */
const createMeeting = async (req, res) => {
  try {
    const { groupId, title, agenda, scheduledDate, scheduledTime, location } = req.body;
    const createdBy = req.user.id;

    if (!groupId || !title || !scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Group ID, title, scheduled date, and time are required'
      });
    }

    const meeting = await Meeting.create({
      groupId,
      title,
      agenda,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      location,
      createdBy,
      status: 'scheduled'
    });

    // Send reminders to all group members
    try {
      const members = await User.findAll({
        where: { groupId, role: 'Member', status: 'active' }
      });

      for (const member of members) {
        if (member.phone) {
          await sendMeetingReminder(
            member.phone,
            member.name,
            scheduledDate,
            scheduledTime
          ).catch(err => console.error(`Failed to send reminder to ${member.phone}:`, err));
        }
      }
    } catch (notifError) {
      console.error('Meeting reminder error:', notifError);
    }

    logAction(createdBy, 'MEETING_CREATED', 'Meeting', meeting.id, { groupId, title }, req);

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: meeting
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meeting',
      error: error.message
    });
  }
};

/**
 * Get meetings
 * GET /api/meetings
 */
const getMeetings = async (req, res) => {
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

    const meetings = await Meeting.findAll({
      where: whereClause,
      include: [
        { association: 'group', attributes: ['id', 'name', 'code'] },
        { association: 'creator', attributes: ['id', 'name'] }
      ],
      order: [['scheduledDate', 'DESC']]
    });

    res.json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meetings',
      error: error.message
    });
  }
};

/**
 * Update meeting (e.g., add minutes)
 * PUT /api/meetings/:id
 */
const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes, attendance, status } = req.body;

    const meeting = await Meeting.findByPk(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (minutes) meeting.minutes = minutes;
    if (attendance) meeting.attendance = attendance;
    if (status) meeting.status = status;

    await meeting.save();

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: meeting
    });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting',
      error: error.message
    });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  updateMeeting
};

