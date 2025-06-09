const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');
const logger = require('../config/logger');

const verifyCallback = (req, resolve, reject, requiredRights = []) => async (err, user, info) => {
  try {
    logger.debug('Auth verifyCallback called', { 
      hasError: !!err, 
      hasUser: !!user, 
      hasInfo: !!info,
      requiredRights
    });

    // Handle errors
    if (err) {
      logger.error('Auth error:', err);
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication error'));
    }

    // Handle missing user
    if (!user) {
      const errorMessage = info && info.message ? info.message : 'Please authenticate';
      logger.warn('Authentication failed:', errorMessage);
      return reject(new ApiError(httpStatus.UNAUTHORIZED, errorMessage));
    }

    // Attach user to request
    req.user = user;
    logger.debug(`User authenticated: ${user.email} (${user.role})`);

    // Check permissions if required
    if (requiredRights.length) {
      const userRights = roleRights.get(user.role) || [];
      logger.debug(`Checking permissions for ${user.role}:`, { userRights, requiredRights });
      
      const hasRequiredRights = requiredRights.every((requiredRight) => 
        userRights.includes(requiredRight)
      );
      
      const isOwner = req.params.userId && req.params.userId === user.id;
      
      if (!hasRequiredRights && !isOwner) {
        logger.warn(`User ${user.id} lacks required permissions:`, { requiredRights });
        return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    resolve();
  } catch (error) {
    logger.error('Error in verifyCallback:', error);
    reject(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Authentication failed'));
  }
};

const auth = (...requiredRights) => async (req, res, next) => {
  logger.debug('Auth middleware called', { 
    path: req.path,
    method: req.method,
    requiredRights
  });

  // Log headers for debugging (but not the Authorization header for security)
  const headers = { ...req.headers };
  if (headers.authorization) {
    headers.authorization = headers.authorization.substring(0, 20) + '...';
  }
  logger.debug('Request headers:', headers);

  return new Promise((resolve, reject) => {
    passport.authenticate(
      'jwt', 
      { session: false, failWithError: true },
      verifyCallback(req, resolve, reject, requiredRights)
    )(req, res, next);
  })
  .then(() => {
    logger.debug('Authentication successful');
    next();
  })
  .catch((err) => {
    logger.error('Authentication failed:', err.message);
    
    // Handle different types of errors
    if (err instanceof ApiError) {
      next(err);
    } else if (err.name === 'TokenExpiredError') {
      next(new ApiError(httpStatus.UNAUTHORIZED, 'Token expired'));
    } else if (err.name === 'JsonWebTokenError') {
      next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
    } else {
      next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication failed'));
    }
  });
};

module.exports = auth;
