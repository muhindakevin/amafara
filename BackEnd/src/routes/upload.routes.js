const express = require('express');
const router = express.Router();
const { uploadFile } = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, uploadFile);

module.exports = router;

