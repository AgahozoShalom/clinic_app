class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  // Apply security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  // Handle pg unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      status: 'error',
      code: 409,
      message: 'Conflict: duplicate key value violates unique constraint',
    });
  }

  // Handle pg foreign key violation
  if (err.code === '23503') {
    return res.status(404).json({
      status: 'error',
      code: 404,
      message: 'Not found: foreign key violation',
    });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      status: 'error',
      code: 400,
      message: 'Validation failed',
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      code: err.statusCode,
      message: err.message,
    });
  }

  // Programmer errors
  console.error('ERROR 💥:', err);
  return res.status(500).json({
    status: 'error',
    code: 500,
    message: 'Internal server error',
  });
};

module.exports = {
  AppError,
  errorHandler,
};
