import Joi from 'joi';

export const cookieValidationSchema = Joi.object({
  REFRESH_COOKIE: Joi.string().required(),
  COOKIE_SECRET: Joi.string().required(),
});
