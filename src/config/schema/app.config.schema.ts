import Joi from 'joi';

export const appValidationSchema = {
  APP_ID: Joi.string().uuid({ version: 'uuidv4' }).required(),
  DOMAIN: Joi.string().uri().required(),
  PORT: Joi.number().port().required(),
  EMAIL_FROM: Joi.string().email().required(),
};
