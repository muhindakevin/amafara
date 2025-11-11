const { User, MemberApplication, Group, Notification } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sendRegistrationConfirmation, sendSMS } = require('../notifications/smsService');
const { sendApprovalEmail, sendEmail } = require('../notifications/emailService');

// Helper function to normalize phone number
function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = phone.trim();
  if (!cleaned) return null;
  // If already starts with +, return as is (assuming it's properly formatted)
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // Remove any spaces, dashes, or other characters
  const digits = cleaned.replace(/\D/g, '');
  // If starts with 0, remove it and add +250
  if (digits.startsWith('0')) {
    return `+250${digits.substring(1)}`;
  }
  // If starts with 250, add +
  if (digits.startsWith('250')) {
    return `+${digits}`;
  }
  // Default: assume it's a local number and add +250
  return `+250${digits}`;
}

// POST /api/member-applications
const createMemberApplication = async (req, res) => {
  try {
    const { name, email, phone, password, groupId, occupation, address, reason, nationalId, dateOfBirth, role } = req.body;
    
    // Validate required fields
    if (!name || !phone || !password || !groupId || !nationalId) {
      return res.status(400).json({ success: false, message: 'Name, phone, password, nationalId, and group are required' });
    }

    // Enforce signup only for Members
    if (role && role !== 'Member') {
      return res.status(400).json({ success: false, message: 'Only Member role is allowed for signup' });
    }

    // Validate group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(400).json({ success: false, message: 'Group not found' });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required' });
    }

    // Check if user already exists
    const existing = await User.findOne({ 
      where: { 
        [Op.or]: [
          { phone: normalizedPhone },
          ...(email ? [{ email: email.trim() }] : [])
        ]
      } 
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this phone or email already exists' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Clean email - set to null if empty string
    const cleanEmail = email && email.trim() ? email.trim() : null;

    // Create user
    const user = await User.create({ 
      name: name.trim(), 
      email: cleanEmail, 
      phone: normalizedPhone, 
      password: hashed, 
      role: 'Member', 
      status: 'pending', 
      groupId: null, // Will be set when approved
      nationalId: nationalId.trim(), 
      occupation: occupation ? occupation.trim() : null, 
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null, 
      address: address ? address.trim() : null, 
      totalSavings: 0 
    });

    // Create application
    const app = await MemberApplication.create({ 
      userId: user.id, 
      groupId, 
      occupation: occupation ? occupation.trim() : null, 
      address: address ? address.trim() : null, 
      reason: reason ? reason.trim() : null, 
      status: 'pending' 
    });

    // Find Group Admin(s) for the group and send notifications
    try {
      const groupAdmins = await User.findAll({
        where: {
          groupId: groupId,
          role: 'Group Admin',
          status: 'active'
        }
      });

      const notificationMessage = `New member application: ${user.name} has applied to join ${group.name}. Please review and approve/reject the application.`;

      // Send notifications to all Group Admins
      for (const admin of groupAdmins) {
        // Create in-app notification
        await Notification.create({
          userId: admin.id,
          type: 'registration',
          channel: 'in_app',
          title: 'New Member Application',
          content: notificationMessage,
          status: 'sent'
        });

        // Send SMS if phone is available
        try {
          if (admin.phone) {
            const smsMessage = `New member application: ${user.name} (${user.phone}) applied to join ${group.name}. Application ID: ${app.id}. Please review in your dashboard.`;
            await sendSMS(admin.phone, smsMessage, admin.id, 'registration');
          }
        } catch (smsError) {
          console.error(`Failed to send SMS to Group Admin ${admin.name}:`, smsError);
        }

        // Send email if available
        try {
          if (admin.email) {
            await sendEmail(
              admin.email,
              'New Member Application - Requires Review',
              `<p>Dear ${admin.name},</p>
              <p>A new member has applied to join your group:</p>
              <ul>
                <li><strong>Name:</strong> ${user.name}</li>
                <li><strong>Phone:</strong> ${user.phone}</li>
                ${user.email ? `<li><strong>Email:</strong> ${user.email}</li>` : ''}
                <li><strong>National ID:</strong> ${user.nationalId}</li>
                ${user.occupation ? `<li><strong>Occupation:</strong> ${user.occupation}</li>` : ''}
                <li><strong>Group:</strong> ${group.name}</li>
                <li><strong>Application ID:</strong> ${app.id}</li>
                ${reason ? `<li><strong>Reason:</strong> ${reason}</li>` : ''}
              </ul>
              <p>Please review and approve or reject this application in your dashboard.</p>`,
              admin.id,
              'registration'
            );
          }
        } catch (emailError) {
          console.error(`Failed to send email to Group Admin ${admin.name}:`, emailError);
        }
      }
    } catch (notifError) {
      console.error('Error sending notifications to Group Admin:', notifError);
      // Don't fail the application submission if notifications fail
    }

    res.status(201).json({ 
      success: true, 
      message: 'Application submitted successfully. Group Admin has been notified.', 
      data: { applicationId: app.id, userId: user.id } 
    });
  } catch (error) {
    console.error('Create member application error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit application', 
      error: error.message 
    });
  }
};

/**
 * List member applications (optionally by status/group)
 * GET /api/member-applications
 */
const listMemberApplications = async (req, res) => {
  try {
    const { status = 'pending', groupId } = req.query;
    const currentUser = req.user;
    
    const where = {};
    
    // Group Admin can only see applications for their own group
    if (currentUser.role === 'Group Admin' && currentUser.groupId) {
      where.groupId = currentUser.groupId;
    } else if (groupId) {
      where.groupId = groupId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    const apps = await MemberApplication.findAll({ 
      where,
      include: [
        { 
          association: 'user', 
          attributes: ['id', 'name', 'phone', 'email', 'nationalId', 'occupation', 'address', 'dateOfBirth', 'status'],
          required: true
        },
        {
          association: 'group',
          attributes: ['id', 'name', 'code'],
          required: true
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.json({ success: true, data: apps });
  } catch (error) {
    console.error('List member applications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications', error: error.message });
  }
};

/**
 * Approve application
 * PUT /api/member-applications/:id/approve
 */
const approveMemberApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await MemberApplication.findByPk(id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    const user = await User.findByPk(app.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.groupId = app.groupId;
    user.status = 'active';
    await user.save();
    app.status = 'approved';
    app.reviewedBy = req.user.id;
    app.reviewDate = new Date();
    await app.save();
    // Notify via SMS and Email
    try {
      if (user.phone) await sendRegistrationConfirmation(user.phone, user.name || 'Member')
      if (user.email) await sendApprovalEmail(user.email, user.name || 'Member')
    } catch (_) {}

    return res.json({ success: true, message: 'Application approved', data: { application: app, user } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to approve application', error: error.message });
  }
};

/**
 * Reject application
 * PUT /api/member-applications/:id/reject
 */
const rejectMemberApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const app = await MemberApplication.findByPk(id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    app.status = 'rejected';
    app.reviewedBy = req.user.id;
    app.reviewDate = new Date();
    app.rejectionReason = reason || null;
    await app.save();
    return res.json({ success: true, message: 'Application rejected', data: app });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reject application', error: error.message });
  }
};

module.exports = { createMemberApplication, listMemberApplications, approveMemberApplication, rejectMemberApplication };


