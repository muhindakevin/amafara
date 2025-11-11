const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Group, Branch } = require('../models');
const { logAction } = require('../utils/auditLogger');
const { sendSMS } = require('../notifications/smsService');
const { sendEmail } = require('../notifications/emailService');

const ALLOWED_ROLES = ['System Admin', 'Agent', 'Group Admin', 'Secretary', 'Cashier', 'Member'];

function normalizePhone(phone) {
  if (!phone) return null;
  return phone.startsWith('+') ? phone : `+250${phone.replace(/^0/, '')}`;
}

// Create user (System Admin, Agent, or Group Admin)
const createUser = async (req, res) => {
  try {
    const { name, email, phone, role, groupId, password, groupName, nationalId } = req.body;
    const currentUser = req.user;

    if (!name || !role) {
      return res.status(400).json({ success: false, message: 'Name and role are required' });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    // Phone is required in the database, so ensure it's provided
    // Handle empty strings as missing
    const hasPhone = phone && phone.trim();
    const hasEmail = email && email.trim();
    
    if (!hasPhone && !hasEmail) {
      return res.status(400).json({ success: false, message: 'Phone or email is required' });
    }
    // If email is provided but phone is not, we need phone for database constraint
    // Generate a placeholder phone number if email exists but phone doesn't
    let finalPhone = hasPhone ? phone.trim() : null;
    if (!finalPhone && hasEmail) {
      // Generate a unique placeholder phone - ensure it doesn't conflict
      // Use format: +250 + 9 digits (Rwandan format)
      let placeholderPhone;
      let attempts = 0;
      do {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        // Generate 9-digit number from timestamp and random
        const phoneDigits = `${(timestamp % 1000000000).toString().padStart(9, '0')}`.slice(-9);
        placeholderPhone = `+250${phoneDigits}`;
        attempts++;
        // Check if this phone already exists
        const exists = await User.findOne({ where: { phone: placeholderPhone } });
        if (!exists) break;
        // If exists, add random component
        if (attempts > 1) {
          const randomSuffix = random.toString().slice(-2);
          placeholderPhone = `+250${phoneDigits.slice(0, 7)}${randomSuffix}`;
        }
      } while (attempts < 5);
      finalPhone = placeholderPhone;
    }

    // Group Admin can only create Members for their own group
    if (currentUser.role === 'Group Admin') {
      if (role !== 'Member') {
        return res.status(403).json({ 
          success: false, 
          message: 'Group Admin can only create Members. Please contact System Admin to create other roles.' 
        });
      }
      // Force groupId to be the Group Admin's group
      if (!currentUser.groupId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Group Admin must belong to a group to create members' 
        });
      }
    }

    let assignedGroupId = groupId || null;

    // If user is Group Admin, use their groupId
    if (currentUser.role === 'Group Admin') {
      assignedGroupId = currentUser.groupId;
    }

    // If groupName provided for Group Admin creation, create group on the fly (only System Admin/Agent)
    if (role === 'Group Admin' && groupName && !assignedGroupId && currentUser.role !== 'Group Admin') {
      const newGroup = await Group.create({ name: groupName });
      assignedGroupId = newGroup.id;
    }

    // For roles that require an existing group, ensure groupId is present
    if ((role === 'Secretary' || role === 'Cashier' || role === 'Member' || role === 'Group Admin') && !assignedGroupId) {
      return res.status(400).json({ success: false, message: 'groupId or groupName is required for this role' });
    }

    const normalizedPhone = normalizePhone(finalPhone);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required' });
    }

    const existing = await User.findOne({
      where: {
        [Op.or]: [
          ...(hasEmail ? [{ email: hasEmail }] : []),
          { phone: normalizedPhone }
        ]
      }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with email or phone already exists' });
    }

    const hashed = password ? await bcrypt.hash(password, 10) : null;
    // Clean email - set to null if empty string
    const cleanEmail = hasEmail || null;
    
    const user = await User.create({
      name,
      email: cleanEmail,
      phone: normalizedPhone,
      role,
      groupId: assignedGroupId,
      status: 'active',
      password: hashed,
      nationalId: nationalId || null
    });

    logAction(req.user.id, 'CREATE_USER', 'User', user.id, { role, groupId: assignedGroupId }, req);

    return res.json({ success: true, message: 'User created', data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
};

// List users with optional role filter
const listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const currentUser = req.user;
    let where = role ? { role } : {};
    
    // Group Admin can only see users from their own group
    if (currentUser.role === 'Group Admin' && currentUser.groupId) {
      where.groupId = currentUser.groupId;
    }
    
    const users = await User.findAll({ 
      where, 
      order: [['createdAt', 'DESC']], 
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] },
      include: [{ association: 'group', attributes: ['id', 'name'] }]
    });
    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

// Get user details
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password', 'otp', 'otpExpiry'] } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, groupId, status, password } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (password) user.password = await bcrypt.hash(password, 10);
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = normalizePhone(phone);
    if (role !== undefined) user.role = role;
    if (groupId !== undefined) user.groupId = groupId;
    if (status !== undefined) user.status = status;
    await user.save();

    logAction(req.user.id, 'UPDATE_USER', 'User', user.id, {}, req);

    return res.json({ success: true, message: 'User updated', data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await user.destroy();
    logAction(req.user.id, 'DELETE_USER', 'User', req.params.id, {}, req);
    return res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
};

// Send password reminder (set temporary password and notify)
const remindPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const temp = Math.random().toString(36).slice(-8);
    user.password = await bcrypt.hash(temp, 10);
    await user.save();

    // Try to notify
    const msg = `Your temporary UMURENGE WALLET password is: ${temp}`;
    try { if (user.phone) await sendSMS(user.phone, msg, user.id, 'general'); } catch (_) {}
    try { if (user.email) await sendEmail(user.email, 'Password reminder', msg, user.id, 'general'); } catch (_) {}

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Temporary password for ${user.email || user.phone}: ${temp}`);
    }

    logAction(req.user.id, 'REMIND_PASSWORD', 'User', user.id, {}, req);
    return res.json({ success: true, message: 'Temporary password sent', data: { temp: process.env.NODE_ENV !== 'production' ? temp : undefined } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send password reminder', error: error.message });
  }
};

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  remindPassword,
  // Counts for dashboard
  async usersCount(req, res) {
    try {
      const count = await User.count();
      return res.json({ success: true, data: { count } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to count users', error: error.message });
    }
  },
  async agentsCount(req, res) {
    try {
      const count = await User.count({ where: { role: 'Agent', status: 'active' } });
      return res.json({ success: true, data: { count } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to count agents', error: error.message });
    }
  },
  async branchesCount(req, res) {
    try {
      const count = await Branch.count();
      return res.json({ success: true, data: { count } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to count branches', error: error.message });
    }
  }
};


