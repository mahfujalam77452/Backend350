const { ExtractJwt } = require('passport-jwt');
const logger = require('../config/logger');

const cookieExtractor = (req) => {
  if (!req || !req.cookies) {
    logger.debug('No cookies found in request');
    return null;
  }
  
  const token = req.cookies['accessToken'] || req.cookies['jwt'];
  if (token) {
    logger.debug('Token found in cookies');
  } else {
    logger.debug('No token found in cookies');
  }
  return token;
};

const jwtExtractor = (req) => {
  // Try to get token from Authorization header first
  let token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  
  if (token) {
    logger.debug('Token found in Authorization header');
    return token;
  }
  
  // If not in header, try to get from cookies
  token = cookieExtractor(req);
  
  if (!token) {
    logger.debug('No JWT token found in any location');
    logger.debug('Request headers:', JSON.stringify(req.headers, null, 2));
    if (req.cookies) {
      logger.debug('Available cookies:', Object.keys(req.cookies));
    }
  }
  
  return token;
};

// For debugging purposes
const debugToken = (token) => {
  if (!token) {
    logger.debug('No token provided to debug');
    return;
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.debug('Invalid token format: not a JWT');
      return;
    }
    
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    logger.debug('JWT Header:', header);
    logger.debug('JWT Payload:', {
      ...payload,
      // Don't log the entire signature
      iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    });
  } catch (error) {
    logger.debug('Error parsing token:', error.message);
  }
};

module.exports = {
  jwtExtractor,
  debugToken
};