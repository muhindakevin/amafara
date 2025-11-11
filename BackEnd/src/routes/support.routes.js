const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { listTickets, createTicket } = require('../controllers/support.controller');

router.use(authenticate);
router.get('/', listTickets);
router.post('/', createTicket);

module.exports = router;


