import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthProviderEnum, User } from '@prisma/client';
import * as argon from 'argon2';
import { isDefined } from 'class-validator';
import dayjs from 'dayjs';
import { CommonService } from 'src/common/common.service';
import { IMessageResponse } from 'src/common/interfaces';
import { UsersService } from 'src/users/users.service';
import {
  ChangePasswordDto,
  ConfirmEmailDto,
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dtos';
import { TokenTypeEnum } from './enums';
import { IAuthResult, IEmailToken, IRefreshToken } from './interfaces';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly commonService: CommonService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  public async register(
    dto: RegisterDto,
    domain?: string,
  ): Promise<IMessageResponse> {
    const { name, email, password1, password2 } = dto;
    this.comparePasswords(password1, password2);
    const user = await this.usersService.create(
      OAuthProviderEnum.LOCAL,
      email,
      name,
      password1,
    );
    const confirmationToken = await this.jwtService.generateToken(
      user,
      TokenTypeEnum.CONFIRMATION,
      domain,
    );
    //TODO: send confirmation email
    console.log(confirmationToken);

    return this.commonService.generateMessageResponse(
      'Registration successful',
    );
  }

  public async confirmEmail(
    dto: ConfirmEmailDto,
    domain?: string,
  ): Promise<IAuthResult> {
    const { confirmationToken } = dto;
    const { id } = await this.jwtService.verifyToken<IEmailToken>(
      confirmationToken,
      TokenTypeEnum.CONFIRMATION,
    );
    const user = await this.usersService.confirmEmail(id);
    const [accessToken, refreshToken] =
      await this.jwtService.generateAuthTokens(user, domain);
    return { user, accessToken, refreshToken };
  }

  public async login(dto: LoginDto, domain?: string): Promise<IAuthResult> {
    const { email, password } = dto;
    const user = await this.userByEmail(email);

    if (!(await argon.verify(user.password, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.confirmed) {
      const confirmationToken = await this.jwtService.generateToken(
        user,
        TokenTypeEnum.CONFIRMATION,
        domain,
      );

      //TODO: send confirmation email
      console.log(confirmationToken);

      throw new UnauthorizedException(
        'Please confirm your email, a new email has been sent',
      );
    }

    const [accessToken, refreshToken] =
      await this.jwtService.generateAuthTokens(user, domain);
    return { user, accessToken, refreshToken };
  }

  public async refreshTokenAccess(
    refreshToken: string,
    domain?: string,
  ): Promise<IAuthResult> {
    const { id, confirmed, tokenId } =
      await this.jwtService.verifyToken<IRefreshToken>(
        refreshToken,
        TokenTypeEnum.REFRESH,
      );
    await this.checkIfTokenIsBlacklisted(id, tokenId);
    const user = await this.usersService.findOneByCredentials(id, confirmed);
    const [accessToken, newRefreshToken] =
      await this.jwtService.generateAuthTokens(user, domain, tokenId);
    return { user, accessToken, refreshToken: newRefreshToken };
  }

  public async logout(refreshToken: string): Promise<IMessageResponse> {
    const { id, tokenId, exp } =
      await this.jwtService.verifyToken<IRefreshToken>(
        refreshToken,
        TokenTypeEnum.REFRESH,
      );
    await this.blacklistToken(id, tokenId, exp);
    return this.commonService.generateMessageResponse('Logout successful');
  }

  public async resetPasswordEmail(
    dto: EmailDto,
    domain?: string,
  ): Promise<IMessageResponse> {
    const user = await this.usersService.uncheckedUserByEmail(dto.email);

    if (user) {
      const resetToken = await this.jwtService.generateToken(
        user,
        TokenTypeEnum.RESET_PASSWORD,
        domain,
      );

      console.log(resetToken);
      //TODO: send reset password email
    }

    return this.commonService.generateMessageResponse(
      'Reset password email sent',
    );
  }

  public async resetPassword(dto: ResetPasswordDto): Promise<IMessageResponse> {
    const { password1, password2, resetToken } = dto;
    const { id, confirmed } = await this.jwtService.verifyToken<IEmailToken>(
      resetToken,
      TokenTypeEnum.RESET_PASSWORD,
    );
    this.comparePasswords(password1, password2);
    await this.usersService.resetPassword(id, confirmed, password1);
    return this.commonService.generateMessageResponse(
      'Password reset successfully',
    );
  }

  public async updatePassword(
    userId: number,
    dto: ChangePasswordDto,
    domain?: string,
  ): Promise<IAuthResult> {
    const { password1, password2, password } = dto;
    this.comparePasswords(password1, password2);
    const user = await this.usersService.updatePassword(
      userId,
      password1,
      password,
    );
    const [accessToken, refreshToken] =
      await this.jwtService.generateAuthTokens(user, domain);
    return { user, accessToken, refreshToken };
  }

  private async checkIfTokenIsBlacklisted(
    userId: number,
    tokenId: string,
  ): Promise<void> {
    const time = await this.cacheManager.get<number>(
      `blacklist:${userId}:${tokenId}`,
    );

    if (isDefined(time)) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async blacklistToken(
    userId: number,
    tokenId: string,
    exp: number,
  ): Promise<void> {
    const now = dayjs().unix();
    const ttl = (exp - now) * 1000;

    if (ttl > 0) {
      await this.cacheManager.set(`blacklist:${userId}:${tokenId}`, now, ttl);
    }
  }

  private comparePasswords(password1: string, password2: string): void {
    if (password1 !== password2) {
      throw new BadRequestException('Passwords do not match');
    }
  }

  private async userByEmail(email: string): Promise<User> {
    return this.usersService.findOneByEmail(email);
  }
}
