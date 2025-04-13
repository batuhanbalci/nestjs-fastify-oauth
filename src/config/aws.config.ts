import { registerAs } from '@nestjs/config';

export const awsConfig = registerAs('aws', () => ({
  ses: {
    region: process.env.AWS_SES_REGION,
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  },
}));
