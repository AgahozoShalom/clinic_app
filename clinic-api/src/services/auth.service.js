const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Authenticates a user and generates a JWT.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} The token and user object.
 */
const login = async (email, password) => {
  const result = await db.query('SELECT id, name, email, password, role, is_active FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.is_active) {
    throw new AppError('Account is deactivated', 403);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const payload = {
    sub: user.id,
    role: user.role,
    name: user.name,
    jti: crypto.randomUUID(),
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '8h',
  });

  // Strip password before returning
  const { password: _, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};

module.exports = {
  login,
};
