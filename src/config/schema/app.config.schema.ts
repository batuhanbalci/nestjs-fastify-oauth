import Joi from 'joi';

export const appValidationSchema = Joi.object({
  APP_ID: Joi.string().uuid({ version: 'uuidv4' }).required(),
  DOMAIN: Joi.string().domain().required(),
  PORT: Joi.number().port().required(),
  EMAIL_FROM: Joi.string().email().required(),
});
