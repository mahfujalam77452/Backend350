const emailService = require('../services/email.service');
const logger = require('../config/logger');
const { User } = require('../models');
const { Club } = require('../models');
const mongoose = require('mongoose');

const sendMail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    // Basic validation
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, or message'
      });
    }

    let recipientEmails = [];

    // Handle different recipient types
    if (to === 'all') {
      // Get all users' emails regardless of verification status
      const users = await User.find({}).select('email -_id');
      recipientEmails = users.map(user => user.email).filter(Boolean);
      
      if (recipientEmails.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No users found in the system'
        });
      }
      
      logger.info(`Sending email to ${recipientEmails.length} users`);
    } else if (mongoose.Types.ObjectId.isValid(to)) {
      // Check if it's a valid club ID
      const club = await Club.findById(to).populate('members', 'email');
      
      if (!club) {
        return res.status(404).json({
          success: false,
          message: 'Club not found'
        });
      }
      
      if (club.members.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No members found in this club'
        });
      }
      
      recipientEmails = club.members.map(member => member.email).filter(Boolean);
    } else {
      // Treat as normal email address(es)
      recipientEmails = Array.isArray(to) ? to : [to];
    }

    // Remove any duplicates
    recipientEmails = [...new Set(recipientEmails)];

    // Send email to all recipients
    const result = await emailService.sendEmail(recipientEmails, subject, message);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Email sent successfully to ${recipientEmails.length} recipient(s)`,
        data: {
          to: result.recipients,
          subject,
          messageId: result.messageId,
          recipientCount: recipientEmails.length
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error,
        failedRecipients: result.failedRecipients || []
      });
    }
    
  } catch (error) {
    logger.error('Error in sendMail:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  sendMail
};
