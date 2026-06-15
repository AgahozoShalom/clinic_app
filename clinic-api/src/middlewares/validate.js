/**
 * Zod schema validator middleware.
 * @param {Object} schema - The Zod schema to validate against.
 * @returns {Function} Express middleware function.
 */
const validate = (schema) => (req, res, next) => {
  try {
    const parsedBody = schema.parse(req.body);
    req.body = parsedBody;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validate;
