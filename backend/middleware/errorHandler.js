const logger = require('../utils/logger');

/**
 * Global error handler middleware for Express
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Log the error with full details
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build error response
  const errorResponse = {
    error: true,
    message: getErrorMessage(err, statusCode),
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || null;
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Get user-friendly error message
 * @param {Error} err - Error object
 * @param {number} statusCode - HTTP status code
 * @returns {string} - Error message
 */
function getErrorMessage(err, statusCode) {
  // In production, don't leak error details
  if (process.env.NODE_ENV === 'production') {
    switch (statusCode) {
      case 400:
        return 'Bad Request - Invalid input provided';
      case 401:
        return 'Unauthorized - Authentication required';
      case 403:
        return 'Forbidden - Access denied';
      case 404:
        return 'Not Found - Resource not found';
      case 429:
        return 'Too Many Requests - Please try again later';
      case 500:
        return 'Internal Server Error - Something went wrong';
      case 503:
        return 'Service Unavailable - Please try again later';
      default:
        return 'An error occurred while processing your request';
    }
  }

  // In development, return actual error message
  return err.message || 'Unknown error occurred';
}

/**
 * Wrapper for async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFoundHandler(req, res) {
  logger.warn('404 Not Found', {
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    error: true,
    message: `Cannot ${req.method} ${req.url}`,
    statusCode: 404,
    timestamp: new Date().toISOString()
  });
}

/**
 * Validation error handler
 * @param {Array} errors - Array of validation errors
 * @returns {Error} - Formatted error
 */
function validationError(errors) {
  const err = new Error('Validation Error');
  err.statusCode = 400;
  err.details = errors;
  return err;
}

/**
 * Create custom error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} - Custom error
 */
function createError(message, statusCode = 500) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Handle specific error types
 * @param {Error} err - Error object
 * @returns {Error} - Formatted error
 */
function handleSpecificErrors(err) {
  // MongoDB/Mongoose errors
  if (err.name === 'CastError') {
    return createError('Invalid ID format', 400);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return validationError(messages);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return createError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return createError('Token expired', 401);
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return createError('File too large', 400);
    }
    return createError(err.message, 400);
  }

  return err;
}

/**
 * Express middleware to handle specific error types
 */
function errorTypeHandler(err, req, res, next) {
  const formattedError = handleSpecificErrors(err);
  next(formattedError);
}

module.exports = { 
  errorHandler,
  asyncHandler,
  notFoundHandler,
  validationError,
  createError,
  errorTypeHandler
};
