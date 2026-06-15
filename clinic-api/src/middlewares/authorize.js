const { AppError } = require('./errorHandler');

/**
 * Middleware factory to restrict access to specific roles.
 * @param {...string} roles - Allowed roles.
 * @returns {Function} Express middleware function.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }
    next();
  };
};

module.exports = authorize;
