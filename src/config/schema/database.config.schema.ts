import Joi from 'joi';

export const databaseValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
});
