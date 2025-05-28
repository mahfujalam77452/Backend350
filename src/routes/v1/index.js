const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const clubRoute = require('./club.route');
const docsRoute = require('./docs.route');
const config = require('../../config/config');
const sslcommerzRoute = require('./sslcommerz.route');
const uploadRoute = require('./upload.route');
const eventRoute = require('./event.route');
const mailRoute = require('./mail.route');
const router = express.Router();

// Add default routes
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/clubs', clubRoute);
router.use('/sslcommerz', sslcommerzRoute);
router.use('/events', eventRoute);
router.use('/uploads', uploadRoute);
router.use('/mail', mailRoute);

// Add development routes only if in development mode
if (config.env === 'development') {
  router.use('/docs', docsRoute);
}

module.exports = router;
