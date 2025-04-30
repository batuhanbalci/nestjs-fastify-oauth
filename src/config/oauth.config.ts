import { registerAs } from '@nestjs/config';

export const oauthConfig = registerAs('oauth', () => ({
  microsoft: {
    id: process.env.MICROSOFT_CLIENT_ID,
    secret: process.env.MICROSOFT_CLIENT_SECRET,
  },
  google: {
    id: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_CLIENT_SECRET,
  },
  facebook: {
    id: process.env.FACEBOOK_CLIENT_ID,
    secret: process.env.FACEBOOK_CLIENT_SECRET,
  },
  github: {
    id: process.env.GITHUB_CLIENT_ID,
    secret: process.env.GITHUB_CLIENT_SECRET,
  },
}));
