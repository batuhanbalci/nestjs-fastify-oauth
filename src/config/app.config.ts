import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  id: process.env.APP_ID,
  port: process.env.PORT,
  domain: process.env.DOMAIN,
  email: {
    from: process.env.EMAIL_FROM,
  },
}));
