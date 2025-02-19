import { registerAs } from '@nestjs/config';

export const cookieConfig = registerAs('cookie', () => ({
  refreshCookie: process.env.REFRESH_COOKIE,
  cookieSecret: process.env.COOKIE_SECRET,
}));
