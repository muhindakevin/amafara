const { SupportTicket, User } = require('../models');
const { logAction } = require('../utils/auditLogger');

const listTickets = async (req, res) => {
  try {
    const where = {};
    const tickets = await SupportTicket.findAll({ where, include: [{ model: User, as: 'user', attributes: ['id','name','email','role'] }], order: [['createdAt','DESC']] });
    return res.json({ success: true, data: tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error.message });
  }
};

const createTicket = async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;
    if (!subject || !message) return res.status(400).json({ success: false, message: 'Subject and message are required' });
    const ticket = await SupportTicket.create({ userId: req.user.id, subject, message, category: category || 'other', priority: priority || 'medium' });
    logAction(req.user.id, 'CREATE_TICKET', 'SupportTicket', ticket.id, { category, priority }, req);
    return res.json({ success: true, message: 'Ticket created', data: ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create ticket', error: error.message });
  }
};

module.exports = { listTickets, createTicket };


