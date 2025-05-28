const express = require('express');
const mailController = require('../../controllers/mail.controller');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const mailValidation = require('./mail.validation');

const router = express.Router();

/**
 * @swagger
 * /mail/send:
 *   post:
 *     summary: Send an email to one or multiple recipients
 *     tags: [Mail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - message
 *             properties:
 *               to:
 *                 oneOf:
 *                   - type: string
 *                     format: email
 *                     example: "user@example.com"
 *                   - type: array
 *                     items:
 *                       type: string
 *                       format: email
 *                     example: ["user1@example.com", "user2@example.com"]
 *               subject:
 *                 type: string
 *                 example: "Important Announcement"
 *               message:
 *                 type: string
 *                 example: "Hello, this is a test email."
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/send', 
  auth(), 
  validate(mailValidation.sendMail), 
  mailController.sendMail
);

module.exports = router;
