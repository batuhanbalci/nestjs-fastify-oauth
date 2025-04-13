import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guards';
import { AwsModule } from './aws/aws.module';
import { CommonModule } from './common/common.module';
import {
  appConfig,
  awsConfig,
  cookieConfig,
  databaseConfig,
  jwtConfig,
  oauthConfig,
  validationSchema,
} from './config';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        abortEarly: true,
      },
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        oauthConfig,
        cookieConfig,
        awsConfig,
      ],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 5000,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CommonModule,
    MailModule,
    AwsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
