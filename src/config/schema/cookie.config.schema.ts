import Joi from 'joi';

export const cookieValidationSchema = {
  REFRESH_COOKIE: Joi.string().required(),
  COOKIE_SECRET: Joi.string().required(),
};
