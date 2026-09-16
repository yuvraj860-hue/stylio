import AppError from '../utils/AppError.js';

export const sanitizeBody = (allowedKeys) => (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const cleaned = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        cleaned[key] = req.body[key];
      }
    }
    req.body = cleaned;
  }
  next();
};

const getValue = (obj, path) =>
  path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

export const validate = (rules) => (req, res, next) => {
  const errors = [];
  const body = req.body || {};

  for (const field of Object.keys(rules)) {
    const { required, pattern, minLength, maxLength, options } = rules[field];
    const value = getValue(body, field);

    if (required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
    }

    if (value !== undefined && value !== null && value !== '') {
      if (pattern && !pattern.regex.test(String(value))) {
        errors.push(pattern.message || `${field} is invalid`);
      }
      if (minLength && String(value).length < minLength) {
        errors.push(`${field} must be at least ${minLength} characters`);
      }
      if (maxLength && String(value).length > maxLength) {
        errors.push(`${field} must be at most ${maxLength} characters`);
      }
      if (options && !options.includes(value)) {
        errors.push(`${field} must be one of: ${options.join(', ')}`);
      }
    }
  }

  if (errors.length > 0) {
    const err = new AppError('Validation Error', 400);
    err.errors = errors;
    return next(err);
  }
  next();
};

export const validateId = (param) => (req, res, next) => {
  const value = req.params[param];
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  if (!objectIdPattern.test(value)) {
    return next(new AppError(`Invalid ${param} format`, 400));
  }
  next();
};