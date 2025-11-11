const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { ChatMessage, Group, User, Notification } = require('../models');
const { sendEmail } = require('../notifications/emailService');
const { Op } = require('sequelize');

/**
 * Get chat list (groups and leaders for the logged-in user)
 * GET /api/chat/list
 */
router.get('/list', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user || !user.groupId) {
      return res.json({
        success: true,
        data: []
      });
    }

    const groupId = user.groupId;
    
    // Get group info
    const group = await Group.findByPk(groupId);
    
    // Get all group members and leaders
    const allUsers = await User.findAll({
      where: {
        groupId,
        status: 'active'
      },
      attributes: ['id', 'name', 'phone', 'email', 'role', 'profileImage']
    });

    // Separate leaders
    const leaders = allUsers.filter(u => 
      ['Group Admin', 'Cashier', 'Secretary'].includes(u.role)
    );

    // Get unread counts for group chat
    const groupUnreadCount = await ChatMessage.count({
      where: {
        groupId,
        senderId: { [Op.ne]: userId },
        isRead: false
      }
    });

    // Get last message for group
    let lastGroupMessage = null;
    try {
      lastGroupMessage = await ChatMessage.findOne({
        where: { groupId },
        include: [
          { association: 'sender', attributes: ['id', 'name'], required: false }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (msgError) {
      console.warn('[Chat] Error fetching last group message:', msgError.message);
      // Continue without last message
    }

    // Build chat list
    const chatList = [];

    // Add group chat FIRST (always visible)
    if (group) {
      chatList.push({
        id: `group-${groupId}`,
        type: 'group',
        name: group.name,
        members: allUsers.length,
        lastMessage: lastGroupMessage ? {
          text: lastGroupMessage.message,
          sender: lastGroupMessage.sender?.name || 'Unknown',
          time: lastGroupMessage.createdAt
        } : null,
        unread: groupUnreadCount,
        groupId: groupId
      });
    }

    // Add ALL leader chats (even if no messages exist yet)
    for (const leader of leaders) {
      if (leader.id === userId) continue; // Skip self

      let unreadCount = 0;
      try {
        // Try to count unread private messages (only if receiverId column exists)
        unreadCount = await ChatMessage.count({
          where: {
            senderId: leader.id,
            receiverId: userId,
            isRead: false
          }
        });
      } catch (countError) {
        // If receiverId column doesn't exist, set unreadCount to 0
        if (countError.message && countError.message.includes('receiverId')) {
          console.warn('[Chat] receiverId column not found, skipping unread count for private messages');
          unreadCount = 0;
        } else {
          throw countError; // Re-throw if it's a different error
        }
      }

      let lastMessage = null;
      try {
        // Try to find last private message (only if receiverId column exists)
        lastMessage = await ChatMessage.findOne({
          where: {
            [Op.or]: [
              { senderId: leader.id, receiverId: userId },
              { senderId: userId, receiverId: leader.id }
            ]
          },
          include: [
            { association: 'sender', attributes: ['id', 'name'], required: false }
          ],
          order: [['createdAt', 'DESC']]
        });
      } catch (msgError) {
        // If receiverId column doesn't exist, lastMessage will be null
        if (msgError.message && msgError.message.includes('receiverId')) {
          console.warn(`[Chat] receiverId column not found, skipping last message for leader ${leader.id}`);
          lastMessage = null;
        } else {
          console.warn(`[Chat] Error fetching last message for leader ${leader.id}:`, msgError.message);
          lastMessage = null;
        }
      }

      // Always add leader to chat list, even if no messages exist
      chatList.push({
        id: `user-${leader.id}`,
        type: 'private',
        name: leader.name,
        role: leader.role,
        phone: leader.phone,
        email: leader.email,
        members: 1,
        lastMessage: lastMessage ? {
          text: lastMessage.message,
          sender: lastMessage.sender?.name || 'Unknown',
          time: lastMessage.createdAt
        } : null,
        unread: unreadCount,
        receiverId: leader.id
      });
    }

    // Sort: Group chat first, then leaders by last message time (most recent first), then by name
    chatList.sort((a, b) => {
      // Group chat always first
      if (a.type === 'group') return -1
      if (b.type === 'group') return 1
      
      // Then by last message time (most recent first)
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.time) - new Date(a.lastMessage.time)
      }
      if (a.lastMessage) return -1
      if (b.lastMessage) return 1
      
      // Finally by name
      return a.name.localeCompare(b.name)
    })

    res.json({
      success: true,
      data: chatList
    });
  } catch (error) {
    console.error('[Chat] Error fetching chat list:', error);
    console.error('[Chat] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat list',
      error: error.message,
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

/**
 * Get chat messages for a group or private chat
 * GET /api/chat/:groupId?receiverId=X for private chat
 * GET /api/chat/:groupId for group chat
 */
router.get('/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { receiverId } = req.query;
    const userId = req.user.id;

    let whereClause = {};
    
    if (receiverId && groupId === 'user') {
      // Private chat - get messages between current user and receiver
      // This route is used when groupId is 'user' and receiverId is in query
      const parsedReceiverId = parseInt(receiverId);
      if (isNaN(parsedReceiverId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid receiverId'
        });
      }

      whereClause = {
        [Op.or]: [
          { senderId: userId, receiverId: parsedReceiverId },
          { senderId: parsedReceiverId, receiverId: userId }
        ],
        groupId: null // Private messages have no groupId
      };
    } else if (receiverId) {
      // Private chat - receiverId provided as query param
      const parsedReceiverId = parseInt(receiverId);
      if (isNaN(parsedReceiverId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid receiverId'
        });
      }

      whereClause = {
        [Op.or]: [
          { senderId: userId, receiverId: parsedReceiverId },
          { senderId: parsedReceiverId, receiverId: userId }
        ],
        groupId: null // Private messages have no groupId
      };
    } else {
      // Group chat - get all messages for the group
      const parsedGroupId = parseInt(groupId);
      if (isNaN(parsedGroupId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid groupId'
        });
      }

      // Verify user is a member of this group
      const user = await User.findByPk(userId);
      if (!user || user.groupId !== parsedGroupId) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group'
        });
      }

      whereClause = { 
        groupId: parsedGroupId,
        receiverId: null // Group messages have no receiverId
      };
    }

    // Load all messages for chat history (like WhatsApp) - no limit for full history
    let messages = [];
    try {
      messages = await ChatMessage.findAll({
        where: whereClause,
        include: [
          { association: 'sender', attributes: ['id', 'name', 'phone', 'profileImage'], required: false }
        ],
        order: [['createdAt', 'ASC']], // Oldest first for chat display (chronological order)
      });
    } catch (findError) {
      console.error('[Chat] Error fetching messages:', findError);
      throw findError;
    }

    // Mark messages as read
    if (messages.length > 0) {
      const unreadIds = messages
        .filter(m => !m.isRead && m.senderId !== userId)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        await ChatMessage.update(
          { isRead: true },
          { where: { id: { [Op.in]: unreadIds } } }
        );
      }
    }

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('[Chat] Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

/**
 * Send private chat message
 * POST /api/chat/user
 * For private messages between users (like WhatsApp direct messages)
 */
router.post('/user', authenticate, async (req, res) => {
  try {
    const { message, type = 'text', fileUrl, recipientIds } = req.body;

    if (!message && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message or file is required'
      });
    }

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'recipientIds must be an array with exactly one user ID for private messages'
      });
    }

    const sender = await User.findByPk(req.user.id);
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender not found'
      });
    }

    const receiverId = parseInt(recipientIds[0]);
    if (isNaN(receiverId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid receiver ID'
      });
    }

    // Verify receiver exists and is in the same group (for members chatting with leaders)
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Verify both users are in the same group (members can only chat with their group leaders)
    if (sender.groupId && receiver.groupId && sender.groupId !== receiver.groupId) {
      return res.status(403).json({
        success: false,
        message: 'You can only send private messages to members in your group'
      });
    }

    // Create private message (NO groupId, only receiverId)
    const chatMessage = await ChatMessage.create({
      groupId: null, // Private messages don't have a groupId
      senderId: req.user.id,
      receiverId: receiverId,
      message: message || '',
      type,
      fileUrl
    });

    const messageWithSender = await ChatMessage.findByPk(chatMessage.id, {
      include: [
        { association: 'sender', attributes: ['id', 'name', 'phone', 'profileImage'] }
      ]
    });

    // Emit Socket.io event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Emit to the receiver
      io.to(`user:${receiverId}`).emit('new_message', {
        message: messageWithSender,
        receiverId: receiverId
      });
      // Also emit to sender so they see their own message immediately
      io.to(`user:${req.user.id}`).emit('new_message', {
        message: messageWithSender,
        receiverId: receiverId
      });
      // Play notification sound for receiver
      io.to(`user:${receiverId}`).emit('play_notification_sound');
    }

    // Create in-app notification for receiver (if offline)
    setImmediate(async () => {
      try {
        await Notification.create({
          userId: receiverId,
          type: 'chat_message',
          channel: 'in_app',
          title: `New Message from ${sender.name}`,
          content: message || 'You have a new private message',
          status: 'sent'
        });
      } catch (notifError) {
        console.error('[Chat] Error creating notification:', notifError);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Private message sent successfully',
      data: messageWithSender
    });
  } catch (error) {
    console.error('[Chat] Error sending private message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send private message',
      error: error.message
    });
  }
});

/**
 * Send group chat message
 * POST /api/chat/:groupId
 * Sends message to all members in the group (group chat)
 * Note: For private messages, use POST /api/chat/user
 */
router.post('/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message, type = 'text', fileUrl } = req.body;

    // If groupId is 'user', redirect to private message handler
    if (groupId === 'user') {
      return res.status(400).json({
        success: false,
        message: 'Use POST /api/chat/user for private messages'
      });
    }

    if (!message && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message or file is required'
      });
    }

    const sender = await User.findByPk(req.user.id);
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender not found'
      });
    }

    // Verify sender is a member of this group
    if (sender.groupId !== parseInt(groupId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // For group messages, groupId must be a valid number
    const parsedGroupId = parseInt(groupId);
    if (isNaN(parsedGroupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid groupId'
      });
    }

    // Create group message (NO receiverId - this is a group message)
    const chatMessage = await ChatMessage.create({
      groupId: parsedGroupId,
      senderId: req.user.id,
      receiverId: null, // Group messages don't have a receiverId
      message: message || '',
      type,
      fileUrl
    });

    const messageWithSender = await ChatMessage.findByPk(chatMessage.id, {
      include: [
        { association: 'sender', attributes: ['id', 'name', 'phone', 'profileImage'] }
      ]
    });

    // Emit Socket.io event for real-time updates to all group members
    const io = req.app.get('io');
    if (io) {
      // Broadcast to all members in the group
      io.to(`group:${parsedGroupId}`).emit('new_message', {
        message: messageWithSender,
        groupId: parsedGroupId
      });
      // Play notification sound for all group members except sender
      io.to(`group:${parsedGroupId}`).emit('play_notification_sound');
    }

    // Create notifications for offline group members
    setImmediate(async () => {
      try {
        // Get all active group members
        const groupMembers = await User.findAll({
          where: {
            groupId: parsedGroupId,
            status: 'active',
            id: { [Op.ne]: req.user.id } // Exclude sender
          },
          attributes: ['id', 'name', 'email']
        });

        // Create in-app notifications for offline members
        const notificationPromises = groupMembers.map(member =>
          Notification.create({
            userId: member.id,
            type: 'chat_message',
            channel: 'in_app',
            title: `New Message in Group Chat`,
            content: `${sender.name}: ${message || 'You have a new message in group chat'}`,
            status: 'sent'
          }).catch(err => {
            console.warn(`[Chat] Failed to create notification for member ${member.id}:`, err.message);
          })
        );
        await Promise.all(notificationPromises);
      } catch (notifError) {
        console.error('[Chat] Error creating group notifications:', notifError);
        // Don't fail the message send if notifications fail
      }
    });

    res.status(201).json({
      success: true,
      message: 'Group message sent successfully',
      data: messageWithSender
    });
  } catch (error) {
    console.error('[Chat] Error sending group message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send group message',
      error: error.message
    });
  }
});

module.exports = router;

