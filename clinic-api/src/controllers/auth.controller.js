const authService = require('../services/auth.service');
const { addToDenylist } = require('../middlewares/authenticate');
const db = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Handles user login.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Handles user logout.
 */
const logout = async (req, res, next) => {
  try {
    if (req.user && req.user.jti) {
      addToDenylist(req.user.jti);
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetches current user profile.
 */
const getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, phone, role, is_active FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) {
      throw new AppError('User not found', 404);
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  logout,
  getMe,
};
