import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  jwt: {
    access: {
      time: parseInt(process.env.JWT_ACCESS_TIME!),
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      time: parseInt(process.env.JWT_REFRESH_TIME!),
    },
    confirmation: {
      secret: process.env.JWT_CONFIRMATION_SECRET,
      time: parseInt(process.env.JWT_CONFIRMATION_TIME!),
    },
    resetPassword: {
      secret: process.env.JWT_RESET_PASSWORD_SECRET,
      time: parseInt(process.env.JWT_RESET_PASSWORD_TIME!),
    },
  },
}));
