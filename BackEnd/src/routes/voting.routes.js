const express = require('express');
const router = express.Router();
const { createVote, getVotes, castVote, getVoteById, getMyVote } = require('../controllers/voting.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getVotes);
router.get('/:id', authenticate, getVoteById);
router.get('/:id/my-vote', authenticate, getMyVote);
router.post('/', authenticate, authorize('Group Admin'), createVote);
router.post('/:id/vote', authenticate, castVote);

module.exports = router;

