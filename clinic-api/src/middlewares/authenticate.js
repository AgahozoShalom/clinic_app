const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

// Simple in-memory set for denylisted tokens (logout)
const tokenDenylist = new Set();

/**
 * Verifies JWT token and attaches the payload to req.user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized: missing or invalid token', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (tokenDenylist.has(decoded.jti)) {
      return next(new AppError('Unauthorized: token has been invalidated', 401));
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
      name: decoded.name,
      jti: decoded.jti,
    };
    next();
  } catch (err) {
    return next(new AppError('Unauthorized: invalid token', 401));
  }
};

const addToDenylist = (jti) => {
  tokenDenylist.add(jti);
};

module.exports = {
  authenticate,
  addToDenylist,
};
