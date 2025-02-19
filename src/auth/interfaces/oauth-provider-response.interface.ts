import { OAuthProviderEnum } from '@prisma/client';

export interface IOAuthProviderResponse {
  readonly provider: OAuthProviderEnum;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IOAuthProvidersResponse {
  readonly data: IOAuthProviderResponse[];
}
