import AppError from '../utils/AppError.js';

const errorHandler = (err, req, res, next) => {
  let error = {
    status: err.statusCode || 500,
    message: err.message || 'Server Error',
    errors: undefined,
  };

  if (err.name === 'CastError') {
    error = {
      status: 400,
      message: `Invalid ${err.path}: ${err.value}`,
    };
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = {
      status: 400,
      message: 'Validation Error',
      errors: messages,
    };
  }

  if (err.code === 11000) {
    error = {
      status: 409,
      message: `Duplicate value for field: ${Object.keys(err.keyValue).join(', ')}`,
    };
  }

  if (err.name === 'JsonWebTokenError') {
    error = { status: 401, message: 'Invalid token' };
  }

  if (err.name === 'TokenExpiredError') {
    error = { status: 401, message: 'Token expired' };
  }

  if (err.name === 'MulterError') {
    error = {
      status: 400,
      message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : err.message,
    };
  }

  if (err.type && String(err.type).startsWith('Stripe')) {
    error = {
      status: err.statusCode || 400,
      message: err.message || 'Payment processing error',
    };
  }

  if (err.isOperational) {
    error = { status: err.statusCode, message: err.message };
  }

  res.status(error.status || 500).json({
    status: error.status || 500,
    message: error.message || 'Server Error',
    ...(error.errors ? { errors: error.errors } : {}),
  });
};

export default errorHandler;