const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../schemas/auth.schema');
const { authenticate } = require('../middlewares/authenticate');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 10,
  message: 'Too many login attempts from this IP, please try again later.',
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
