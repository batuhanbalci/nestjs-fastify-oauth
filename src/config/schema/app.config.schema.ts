import Joi from 'joi';

export const appValidationSchema = Joi.object({
  PORT: Joi.number().port().required(),
});
