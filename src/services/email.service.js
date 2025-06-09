const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

// Create a transporter with retry logic
const createTransporter = () => {
  // Log the SMTP config (remove this in production)
  console.log('SMTP Config:', {
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    user: config.email.smtp.auth.user,
    pass: config.email.smtp.auth.pass ? '***' : 'undefined'
  });

  return nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: config.email.smtp.port === 465, // true for 465, false for other ports
    auth: {
      user: config.email.smtp.auth.user,
      pass: config.email.smtp.auth.pass
    },
    tls: {
      rejectUnauthorized: false // Only for development, remove in production
    },
    debug: true, // Enable debug output
    logger: true  // Log to console
  });
};

let transport = createTransporter();

// Verify connection on startup
const verifyConnection = async () => {
  try {
    await transport.verify();
    logger.info('✅ Connected to email server');
    return true;
  } catch (error) {
    logger.error('❌ Failed to connect to email server:', error.message);
    logger.warn('Please check your SMTP configuration in the .env file');
    return false;
  }
};

// Verify connection on startup if not in test mode
if (config.env !== 'test') {
  verifyConnection();
}

/**
 * Send an email to multiple recipients
 * @param {string|string[]} to - Single email or array of recipient email addresses
 * @param {string} subject - Email subject
 * @param {string} text - Email body
 * @returns {Promise<{success: boolean, messageId?: string, recipients: string[], error?: string}>}
 */
const sendEmail = async (to, subject, text) => {
  const maxRetries = 3;
  let attempt = 0;
  let lastError;

  while (attempt < maxRetries) {
    attempt++;
    try {
      logger.info(`Sending email to ${to} (attempt ${attempt}/${maxRetries})`);
      
      // Create a new transport for each attempt
      transport = createTransporter();
      
      // Handle multiple recipients
      const recipients = Array.isArray(to) ? to : [to];

      const msg = {
        from: `"${config.email.fromName || 'System'}" <${config.email.from}>`,
        to: recipients.join(', '),
        subject,
        text,
        messageId: `${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${config.email.domain || 'example.com'}`
      };

      logger.debug(`Sending email to ${recipients.length} recipients`);

      const info = await transport.sendMail(msg);
      logger.info(`Email sent successfully to ${to}`, { messageId: info.messageId });
      
      // Close the transport after successful send
      transport.close();
      
      return {
        success: true,
        messageId: info.messageId,
        recipients
      };
      
    } catch (error) {
      lastError = error;
      logger.error(`Attempt ${attempt} failed:`, error.message);
      
      // Close the transport if it exists
      if (transport) {
        transport.close();
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all attempts failed
  const errorMessage = lastError?.message || 'Unknown error occurred';
  logger.error(`Failed to send email after ${maxRetries} attempts:`, errorMessage);
  
  return {
    success: false,
    error: errorMessage
  };
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `${config.clientURL}/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification for AUSTCMS';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `${config.clientURL}/verify-email?token=${token}`;
  const text = `Dear AUST Student,

Welcome to AUSTCMS - the Club Management System for Ahsanullah University of Science and Technology!

We're excited to have you join our community. To complete your registration and start exploring the vibrant club life at AUST, please verify your email address by clicking on the link below:

${verificationEmailUrl}

This link will be active for the next 24 hours. If you don't verify your email within this time, you may need to request a new verification link.

If you didn't create an account on AUSTCMS, please disregard this email. Your information remains secure, and no action is required on your part.

Should you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The AUSTCMS Team
Ahsanullah University of Science and Technology`;

  await sendEmail(to, subject, text);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
