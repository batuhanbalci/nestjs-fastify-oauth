import { OAuthProviderEnum } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AuthorizationCode } from 'simple-oauth2';
import { IOauthClient, IOAuthParams, IProvider } from '../interfaces';

export class OAuthClass {
  private static readonly [OAuthProviderEnum.MICROSOFT]: IProvider = {
    authorizeHost: 'https://login.microsoftonline.com',
    authorizePath: '/common/oauth2/v2.0/authorize',
    tokenHost: 'https://login.microsoftonline.com',
    tokenPath: '/common/oauth2/v2.0/token',
  };
  private static readonly [OAuthProviderEnum.GOOGLE]: IProvider = {
    authorizeHost: 'https://accounts.google.com',
    authorizePath: '/o/oauth2/v2/auth',
    tokenHost: 'https://www.googleapis.com',
    tokenPath: '/oauth2/v4/token',
    revokePath: '/revoke',
  };
  private static readonly [OAuthProviderEnum.FACEBOOK]: IProvider = {
    authorizeHost: 'https://facebook.com',
    authorizePath: '/v9.0/dialog/oauth',
    tokenHost: 'https://graph.facebook.com',
    tokenPath: '/v9.0/oauth/access_token',
  };
  private static readonly [OAuthProviderEnum.GITHUB]: IProvider = {
    authorizeHost: 'https://github.com',
    authorizePath: '/login/oauth/authorize',
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
  };
  private static userDataUrls: Record<OAuthProviderEnum, string> = {
    [OAuthProviderEnum.GOOGLE]: 'https://www.googleapis.com/oauth2/v3/userinfo',
    [OAuthProviderEnum.MICROSOFT]: 'https://graph.microsoft.com/v1.0/me',
    [OAuthProviderEnum.FACEBOOK]:
      'https://graph.facebook.com/v16.0/me?fields=email,name',
    [OAuthProviderEnum.GITHUB]: 'https://api.github.com/user',
    [OAuthProviderEnum.APPLE]: '',
    [OAuthProviderEnum.LINKEDIN]: '',
    [OAuthProviderEnum.TWITTER]: '',
    [OAuthProviderEnum.LOCAL]: '',
  };

  private readonly code: AuthorizationCode;
  private readonly authorization: IOAuthParams;
  private readonly userDataUrl: string;

  constructor(
    private readonly provider: OAuthProviderEnum,
    private readonly client: IOauthClient,
    private readonly url: string,
  ) {
    if (provider === OAuthProviderEnum.LOCAL) {
      throw new Error('Invalid provider');
    }

    this.code = new AuthorizationCode({
      client,
      auth: OAuthClass[provider] as IProvider,
    });
    this.authorization = OAuthClass.genAuthorization(provider, url);
    this.userDataUrl = OAuthClass.userDataUrls[provider];
  }

  public get state(): string {
    return this.authorization.state;
  }

  public get dataUrl(): string {
    return this.userDataUrl;
  }

  public get authorizationUrl(): string {
    return this.code.authorizeURL(this.authorization);
  }

  private static genAuthorization(
    provider: OAuthProviderEnum,
    url: string,
  ): IOAuthParams {
    const redirect_uri = `${url}/api/oauth/${provider}/callback`;
    const state = randomBytes(16).toString('hex');

    switch (provider) {
      case OAuthProviderEnum.GOOGLE:
        return {
          state,
          redirect_uri,
          scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'openid',
          ],
        };
      case OAuthProviderEnum.MICROSOFT:
        return {
          state,
          redirect_uri,
          scope: ['openid', 'profile', 'email'],
        };
      case OAuthProviderEnum.FACEBOOK:
        return {
          state,
          redirect_uri,
          scope: ['email', 'public_profile'],
        };
      case OAuthProviderEnum.GITHUB:
        return {
          state,
          redirect_uri,
          scope: ['user:email', 'read:user'],
        };
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  public async getToken(code: string): Promise<string> {
    const result = await this.code.getToken({
      code,
      redirect_uri: this.authorization.redirect_uri,
      scope: this.authorization.scope,
    });
    return result.token.access_token as string;
  }
}
