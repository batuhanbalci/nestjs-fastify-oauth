import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { IJwtConfig } from 'src/config/interfaces';
import { v4 } from 'uuid';
import { TokenTypeEnum } from './enums';
import {
  IAccessPayload,
  IAccessToken,
  IEmailPayload,
  IEmailToken,
  IRefreshPayload,
  IRefreshToken,
} from './interfaces';

@Injectable()
export class JwtService {
  private readonly jwtConfig: IJwtConfig;
  private readonly issuer: string;
  private readonly domain: string;

  constructor(private readonly config: ConfigService) {
    this.jwtConfig = this.config.get<IJwtConfig>('jwt')!;
    this.issuer = this.config.get<string>('app.id')!;
    this.domain = this.config.get<string>('domain')!;
  }

  private static async generateTokenAsync(
    payload: IAccessPayload | IEmailPayload | IRefreshPayload,
    secret: string,
    options: jwt.SignOptions,
  ): Promise<string> {
    return new Promise((resolve, rejects) => {
      jwt.sign(payload, secret, options, (error, token) => {
        if (error) {
          rejects(error);
          return;
        }
        if (token) {
          resolve(token);
        } else {
          rejects(new Error('Token generation failed'));
        }
      });
    });
  }

  private static async verifyTokenAsync<T>(
    token: string,
    secret: jwt.Secret,
    options: jwt.VerifyOptions,
  ): Promise<T> {
    return new Promise((resolve, rejects) => {
      jwt.verify(token, secret, options, (error, payload) => {
        if (error) {
          rejects(error);
          return;
        }
        resolve(payload as T);
      });
    });
  }

  private static async throwBadRequest<
    T extends IAccessToken | IRefreshToken | IEmailToken,
  >(promise: Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new BadRequestException('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new BadRequestException('Invalid token');
      }
      throw new InternalServerErrorException(error);
    }
  }

  public async generateToken(
    user: User,
    tokenType: TokenTypeEnum,
    domain?: string | null,
    tokenId?: string,
  ): Promise<string> {
    const jwtOptions: jwt.SignOptions = {
      issuer: this.issuer,
      subject: user.email,
      audience: domain ?? this.domain,
      algorithm: 'HS256',
    };

    switch (tokenType) {
      case TokenTypeEnum.ACCESS: {
        const { privateKey, time: accessTime } = this.jwtConfig.jwt.access;
        return JwtService.generateTokenAsync({ id: user.id }, privateKey, {
          ...jwtOptions,
          expiresIn: accessTime,
          algorithm: 'RS256',
        });
      }
      case TokenTypeEnum.REFRESH: {
        const { secret: refreshSecret, time: refreshTime } =
          this.jwtConfig.jwt.refresh;
        return JwtService.generateTokenAsync(
          {
            id: user.id,
            confirmed: user.confirmed,
            tokenId: tokenId ?? v4(),
          },
          refreshSecret,
          {
            ...jwtOptions,
            expiresIn: refreshTime,
          },
        );
      }
      case TokenTypeEnum.CONFIRMATION:
      case TokenTypeEnum.RESET_PASSWORD: {
        const { secret, time } = this.jwtConfig.jwt[tokenType];
        return JwtService.generateTokenAsync(
          { id: user.id, confirmed: user.confirmed },
          secret,
          {
            ...jwtOptions,
            expiresIn: time,
          },
        );
      }
    }
  }

  public async verifyToken<
    T extends IAccessToken | IRefreshToken | IEmailToken,
  >(token: string, tokenType: TokenTypeEnum): Promise<T> {
    const jwtOptions: jwt.VerifyOptions = {
      issuer: this.issuer,
      audience: new RegExp(this.domain),
    };

    switch (tokenType) {
      case TokenTypeEnum.ACCESS: {
        const { publicKey, time: accessTime } = this.jwtConfig.jwt.access;
        return JwtService.throwBadRequest(
          JwtService.verifyTokenAsync(token, publicKey, {
            ...jwtOptions,
            maxAge: accessTime,
            algorithms: ['RS256'],
          }),
        );
      }
      case TokenTypeEnum.REFRESH:
      case TokenTypeEnum.CONFIRMATION:
      case TokenTypeEnum.RESET_PASSWORD: {
        const { secret, time } = this.jwtConfig.jwt[tokenType];
        return JwtService.throwBadRequest(
          JwtService.verifyTokenAsync(token, secret, {
            ...jwtOptions,
            maxAge: time,
            algorithms: ['HS256'],
          }),
        );
      }
    }
  }

  public async generateAuthTokens(
    user: User,
    domain?: string,
    tokenId?: string,
  ): Promise<[string, string]> {
    return Promise.all([
      this.generateToken(user, TokenTypeEnum.ACCESS, domain, tokenId),
      this.generateToken(user, TokenTypeEnum.REFRESH, domain, tokenId),
    ]);
  }
}
