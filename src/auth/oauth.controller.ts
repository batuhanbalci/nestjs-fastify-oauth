import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProviderEnum } from '@prisma/client';
import { FastifyReply } from 'fastify';
import { Public } from './decorators';
import { OAuthCallbackDto } from './dtos';
import { FastifyThrottlerGuard } from './guards';
import { OAuthFlagGuard } from './guards/oauth-flag.guard';
import { IGoogleUser } from './interfaces/oauth-user-response.interface';
import { OAuthService } from './oauth.service';

@Controller('oauth')
@UseGuards(FastifyThrottlerGuard)
export class OAuthController {
  private readonly url: string;
  private readonly cookiePath = '/api/auth';
  private readonly cookieName: string;
  private readonly refreshTime: number;
  private readonly testing: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    this.url = `https://${this.configService.get<string>('app.domain')}`;
    this.cookieName = this.configService.get<string>('REFRESH_COOKIE')!;
    this.refreshTime = this.configService.get<number>('jwt.refresh.time')!;
    this.testing = this.configService.get<boolean>('testing')!;
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProviderEnum.GOOGLE))
  @Get('google')
  public google(@Res() res: FastifyReply): FastifyReply {
    return this.startRedirect(res, OAuthProviderEnum.GOOGLE);
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProviderEnum.GOOGLE))
  @Get('google/callback')
  public async googleCallback(
    @Query() cbQuery: OAuthCallbackDto,
    @Res() res: FastifyReply,
  ): Promise<FastifyReply> {
    const provider = OAuthProviderEnum.GOOGLE;
    const { email } = await this.oauthService.getUserData<IGoogleUser>(
      provider,
      cbQuery,
    );
    return this.loginAndRedirect(res, provider, email);
  }

  private startRedirect(
    res: FastifyReply,
    provider: OAuthProviderEnum,
  ): FastifyReply {
    return res
      .status(HttpStatus.TEMPORARY_REDIRECT)
      .redirect(this.oauthService.getAuthorizationUrl(provider));
  }

  private async loginAndRedirect(
    res: FastifyReply,
    provider: OAuthProviderEnum,
    email: string,
    firstName?: string,
    lastName?: string,
  ): Promise<FastifyReply> {
    const [accessToken, refreshToken] = await this.oauthService.login(
      provider,
      email,
      firstName,
      lastName,
    );
    return res
      .cookie(this.cookieName, refreshToken, {
        secure: !this.testing,
        httpOnly: true,
        signed: true,
        path: this.cookiePath,
        expires: new Date(Date.now() + this.refreshTime * 1000),
      })
      .status(HttpStatus.PERMANENT_REDIRECT)
      .redirect(`${this.url}/?access_token=${accessToken}`);
  }
}
