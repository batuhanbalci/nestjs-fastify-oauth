import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isDefined } from 'class-validator';
import { FastifyReply, FastifyRequest } from 'fastify';
import { IMessageResponse } from 'src/common/interfaces';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { CurrentUser, Origin, Public } from './decorators';
import {
  ChangePasswordDto,
  ConfirmEmailDto,
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dtos';
import { FastifyThrottlerGuard } from './guards';
import { IAuthResponseUser, IOAuthProvidersResponse } from './interfaces';
import {
  AuthResponseMapper,
  AuthResponseUserMapper,
  OAuthProvidersResponseMapper,
} from './mappers';

@Controller('auth')
@UseGuards(FastifyThrottlerGuard)
export class AuthController {
  private readonly cookiePath = '/api/auth';
  private readonly cookieName: string;
  private readonly refreshTime: number;
  private readonly testing: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.cookieName = this.configService.get<string>('cookie.refreshCokiee')!;
    this.refreshTime = this.configService.get<number>('jwt.refresh.time')!;
    this.testing = this.configService.get<boolean>('testing')!;
  }

  @Public()
  @Post('/register')
  public async signUp(
    @Origin() origin: string | undefined,
    @Body() signUpDto: RegisterDto,
  ): Promise<IMessageResponse> {
    return await this.authService.register(signUpDto, origin);
  }

  @Public()
  @Post('/login')
  public async signIn(
    @Res() res: FastifyReply,
    @Origin() origin: string | undefined,
    @Body() singInDto: LoginDto,
  ): Promise<void> {
    const result = await this.authService.login(singInDto, origin);
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  @Public()
  @Post('/refresh-access')
  public async refreshAccess(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const token = this.refreshTokenFromReq(req);
    const result = await this.authService.refreshTokenAccess(
      token,
      req.headers.origin,
    );
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  @Post('/logout')
  public async logout(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const token = this.refreshTokenFromReq(req);
    const message = await this.authService.logout(token);
    res
      .clearCookie(this.cookieName, { path: this.cookiePath })
      .header('Content-Type', 'application/json')
      .status(HttpStatus.OK)
      .send(message);
  }

  @Public()
  @Get('/confirm-email/:id')
  public async confirmEmail(
    @Param() params: ConfirmEmailDto,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const result = await this.authService.confirmEmail(params);
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  @Public()
  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  public async forgotPassword(
    @Origin() origin: string | undefined,
    @Body() emailDto: EmailDto,
  ): Promise<IMessageResponse> {
    return this.authService.resetPasswordEmail(emailDto, origin);
  }

  @Public()
  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  public async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<IMessageResponse> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Patch('/update-password')
  public async updatePassword(
    @CurrentUser() userId: number,
    @Origin() origin: string | undefined,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const result = await this.authService.updatePassword(
      userId,
      changePasswordDto,
      origin,
    );
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  @Get('/me')
  public async getMe(@CurrentUser() id: number): Promise<IAuthResponseUser> {
    const user = await this.usersService.findOneById(id);
    return AuthResponseUserMapper.map(user);
  }

  @Get('/providers')
  public async getOAuthProviders(
    @CurrentUser() id: number,
  ): Promise<IOAuthProvidersResponse> {
    const providers = await this.usersService.findOAuthProviders(id);
    return OAuthProvidersResponseMapper.map(providers);
  }

  private refreshTokenFromReq(req: FastifyRequest): string {
    const token: string | undefined = req.cookies[this.cookieName];

    if (!isDefined(token)) {
      throw new UnauthorizedException();
    }

    const { valid, value } = req.unsignCookie(token);

    if (!valid) {
      throw new UnauthorizedException();
    }

    return value;
  }

  private saveRefreshCookie(
    res: FastifyReply,
    refreshToken: string,
  ): FastifyReply {
    return res
      .cookie(this.cookieName, refreshToken, {
        secure: !this.testing,
        httpOnly: true,
        signed: true,
        path: this.cookiePath,
        expires: new Date(Date.now() + this.refreshTime * 1000),
      })
      .header('Content-Type', 'application/json');
  }
}
