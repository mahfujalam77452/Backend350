const { Strategy: JwtStrategy } = require('passport-jwt');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { User } = require('../models');
const { jwtExtractor, debugToken } = require('./jwtExtractor');
const logger = require('./logger');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: (req) => {
    // Extract token using our custom extractor
    const token = jwtExtractor(req);
    
    // Debug: Log token details
    if (token) {
      logger.debug('JWT token found in request');
      debugToken(token);
    } else {
      logger.debug('No JWT token found in request');
    }
    
    return token;
  },
  // Allow for some clock skew between servers (in seconds)
  clockTolerance: 30,
  // Don't ignore expired tokens for now - we'll handle that in the verify callback
  ignoreExpiration: false,
};

const jwtVerify = async (payload, done) => {
  try {
    logger.debug('JWT Payload received:', {
      ...payload,
      iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    });

    // Check token type
    if (payload.type !== tokenTypes.ACCESS) {
      logger.warn(`Invalid token type: ${payload.type}`);
      return done(new Error('Invalid token type'), false);
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      logger.warn('Token has expired');
      return done(new Error('Token expired'), false);
    }

    // Find user
    const user = await User.findById(payload.sub);
    if (!user) {
      logger.warn(`User not found with id: ${payload.sub}`);
      return done(null, false, { message: 'User not found' });
    }

    logger.debug(`User authenticated: ${user.email} (${user.role})`);
    return done(null, user);
    
  } catch (error) {
    logger.error('Error in JWT verification:', error);
    return done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

// Google Strategy
const googleStrategy = new GoogleStrategy({
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackUrl,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: Math.random().toString(36).slice(-10),
      });
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});

module.exports = {
  jwtStrategy,
  googleStrategy,
};
