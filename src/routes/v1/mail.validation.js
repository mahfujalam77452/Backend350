const Joi = require('joi');

const sendMailSchema = {
  body: Joi.object().keys({
    to: Joi.alternatives()
      .try(
        Joi.string().email(),
        Joi.string().valid('all'),
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId pattern
        Joi.array().items(Joi.string().email()).min(1)
      )
      .required()
      .description('Single email, "all" for all users, club ID, or array of email addresses'),
    subject: Joi.string()
      .required()
      .min(1)
      .max(255)
      .description('Email subject'),
    message: Joi.string()
      .required()
      .min(1)
      .description('Email message content')
  })
};

module.exports = {
  sendMail: sendMailSchema
};
