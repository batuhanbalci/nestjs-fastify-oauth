import Joi from 'joi';

export const awsValidationSchema = {
  AWS_SES_REGION: Joi.string().required(),
  AWS_SES_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SES_SECRET_ACCESS_KEY: Joi.string().required(),
};
