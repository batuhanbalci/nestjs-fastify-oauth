import { User } from '@prisma/client';

export interface IAuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}
