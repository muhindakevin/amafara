const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { listAuditLogs, exportAuditLogsCsv } = require('../controllers/audit.controller');

router.use(authenticate, authorize('System Admin', 'Agent'));

router.get('/', listAuditLogs);
router.get('/export', exportAuditLogsCsv);

module.exports = router;


