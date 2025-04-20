import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProviderEnum } from '@prisma/client';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { UsersService } from 'src/users/users.service';
import { OAuthClass } from './classes/oauth.class';
import { IOAuthCallbackQuery, IOauthClient } from './interfaces';
import { JwtService } from './jwt.service';

@Injectable()
export class OAuthService {
  private readonly [OAuthProviderEnum.MICROSOFT]: OAuthClass | null;
  private readonly [OAuthProviderEnum.GOOGLE]: OAuthClass | null;
  private readonly [OAuthProviderEnum.FACEBOOK]: OAuthClass | null;
  private readonly [OAuthProviderEnum.GITHUB]: OAuthClass | null;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const url = configService.get<string>('app.domain')!;
    this[OAuthProviderEnum.MICROSOFT] = OAuthService.setOAuthClass(
      OAuthProviderEnum.MICROSOFT,
      configService,
      url,
    );
    this[OAuthProviderEnum.GOOGLE] = OAuthService.setOAuthClass(
      OAuthProviderEnum.GOOGLE,
      configService,
      url,
    );
    this[OAuthProviderEnum.FACEBOOK] = OAuthService.setOAuthClass(
      OAuthProviderEnum.FACEBOOK,
      configService,
      url,
    );
    this[OAuthProviderEnum.GITHUB] = OAuthService.setOAuthClass(
      OAuthProviderEnum.GITHUB,
      configService,
      url,
    );
  }

  private static setOAuthClass(
    provider: OAuthProviderEnum,
    configService: ConfigService,
    url: string,
  ): OAuthClass | null {
    const client = configService.get<IOauthClient | null>(
      `oauth2.${provider.toLowerCase()}`,
    );

    if (!client) {
      return null;
    }

    return new OAuthClass(provider, client, url);
  }

  public getAuthorizationUrl(provider: OAuthProviderEnum): string {
    return this.getOAuth(provider).authorizationUrl;
  }

  public async getUserData<T extends Record<string, any>>(
    provider: OAuthProviderEnum,
    cbQuery: IOAuthCallbackQuery,
  ): Promise<T> {
    const { code, state } = cbQuery;
    const accessToken = await this.getAccessToken(provider, code, state);
    const userData = await firstValueFrom(
      this.httpService
        .get<T>(this.getOAuth(provider).dataUrl, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new UnauthorizedException(error.response?.data);
          }),
        ),
    );
    return userData.data;
  }

  public async login(
    provider: OAuthProviderEnum,
    email: string,
    firstName?: string,
    lastName?: string,
  ): Promise<[string, string]> {
    const user = await this.usersService.findOrCreateForOAuth(
      provider,
      email,
      firstName,
      lastName,
    );
    return this.jwtService.generateAuthTokens(user);
  }

  private getOAuth(provider: OAuthProviderEnum): OAuthClass {
    const oauth = this[provider] as OAuthClass | null;

    if (!oauth) {
      throw new NotFoundException('Page not found');
    }

    return oauth;
  }

  private async getAccessToken(
    provider: OAuthProviderEnum,
    code: string,
    state: string,
  ): Promise<string> {
    const oauth = this.getOAuth(provider);

    if (state !== oauth.state) {
      throw new UnauthorizedException('Corrupted state');
    }

    try {
      return await oauth.getToken(code);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
