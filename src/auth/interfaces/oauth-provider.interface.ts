import { OAuthProviderEnum, User } from '@prisma/client';

export interface IOAuthProvider {
  readonly provider: OAuthProviderEnum;
  readonly user: User;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
