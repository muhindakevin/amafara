const express = require('express');
const router = express.Router();
const { getTransactions, getTransactionSummary } = require('../controllers/transaction.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, getTransactions);
router.get('/summary', authenticate, getTransactionSummary);

module.exports = router;

