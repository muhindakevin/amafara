const { AuditLog, User } = require('../models');

const listAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({ include: [{ model: User, as: 'user', attributes: ['id','name','email','role'] }], order: [['createdAt','DESC']], limit: 1000 });
    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
  }
};

const exportAuditLogsCsv = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({ order: [['createdAt','DESC']], limit: 5000 });
    const header = 'id,userId,action,entity,entityId,metadata,ip,createdAt\n';
    const rows = logs.map(l => `${l.id},${l.userId},${l.action},${l.entity},${l.entityId},"${(l.metadata||'').toString().replace(/"/g,'"')} ",${l.ip||''},${l.createdAt.toISOString()}`).join('\n');
    const csv = header + rows;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export audit logs', error: error.message });
  }
};

module.exports = { listAuditLogs, exportAuditLogsCsv };


