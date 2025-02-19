import Joi from 'joi';
import { appValidationSchema } from './app.config.schema';
import { cookieValidationSchema } from './cookie.config.schema';
import { databaseValidationSchema } from './database.config.schema';
import { jwtValidationSchema } from './jwt.config.schema';
import { oauthValidationSchema } from './oauth.config.schema';

export const validationSchema = Joi.object({
  ...appValidationSchema,
  ...databaseValidationSchema,
  ...jwtValidationSchema,
  ...oauthValidationSchema,
  ...cookieValidationSchema,
});
