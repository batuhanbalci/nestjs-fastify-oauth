import Joi from 'joi';

export const databaseValidationSchema = {
  DATABASE_URL: Joi.string().required(),
};
