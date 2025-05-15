import { OAuthProviderEnum, User } from '@prisma/client';

export interface IOAuthProvider {
  readonly provider: OAuthProviderEnum;
  readonly user: User;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IProvider {
  readonly tokenHost: string;
  readonly tokenPath: string;
  readonly authorizeHost: string;
  readonly authorizePath: string;
  readonly refreshPath?: string;
  readonly revokePath?: string;
}
