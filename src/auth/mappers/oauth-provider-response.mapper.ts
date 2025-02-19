import { OAuthProviderEnum } from '@prisma/client';
import {
  IOAuthProvider,
  IOAuthProviderResponse,
  IOAuthProvidersResponse,
} from '../interfaces';

export class OAuthProviderResponseMapper implements IOAuthProviderResponse {
  public readonly provider: OAuthProviderEnum;

  public readonly createdAt: string;

  public readonly updatedAt: string;

  constructor(values: IOAuthProviderResponse) {
    Object.assign(this, values);
  }

  public static map(provider: IOAuthProvider): OAuthProviderResponseMapper {
    return new OAuthProviderResponseMapper({
      provider: provider.provider,
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
    });
  }
}

export class OAuthProvidersResponseMapper implements IOAuthProvidersResponse {
  public readonly data: OAuthProviderResponseMapper[];

  constructor(values: IOAuthProvidersResponse) {
    Object.assign(this, values);
  }

  public static map(providers: IOAuthProvider[]): OAuthProvidersResponseMapper {
    return new OAuthProvidersResponseMapper({
      data: providers.map((provider) =>
        OAuthProviderResponseMapper.map(provider),
      ),
    });
  }
}
