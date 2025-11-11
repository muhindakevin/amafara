const { Branch } = require('../models');
const { logAction } = require('../utils/auditLogger');

const listBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data: branches });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch branches', error: error.message });
  }
};

const createBranch = async (req, res) => {
  try {
    const { name, code, address } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Branch name is required' });
    const branch = await Branch.create({ name, code: code || null, address: address || null });
    logAction(req.user.id, 'CREATE_BRANCH', 'Branch', branch.id, { name, code }, req);
    return res.json({ success: true, message: 'Branch created', data: branch });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create branch', error: error.message });
  }
};

const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    const { name, code, address } = req.body;
    if (name !== undefined) branch.name = name;
    if (code !== undefined) branch.code = code;
    if (address !== undefined) branch.address = address;
    await branch.save();
    logAction(req.user.id, 'UPDATE_BRANCH', 'Branch', branch.id, {}, req);
    return res.json({ success: true, message: 'Branch updated', data: branch });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update branch', error: error.message });
  }
};

const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    await branch.destroy();
    logAction(req.user.id, 'DELETE_BRANCH', 'Branch', req.params.id, {}, req);
    return res.json({ success: true, message: 'Branch deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete branch', error: error.message });
  }
};

module.exports = {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch
};


