import {
  CanActivate,
  ExecutionContext,
  Injectable,
  mixin,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProviderEnum } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import { IOauthClient } from '../interfaces';

export const OAuthFlagGuard = (
  provider: OAuthProviderEnum,
): Type<CanActivate> => {
  @Injectable()
  class OAuthFlagGuardClass implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    public canActivate(context: ExecutionContext): boolean {
      const client = this.configService.get<IOauthClient | null>(
        `oauth2.${provider}`,
      );

      if (client === null) {
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        throw new NotFoundException(`Cannot ${request.method} ${request.url}`);
      }

      return true;
    }
  }

  return mixin(OAuthFlagGuardClass);
};
