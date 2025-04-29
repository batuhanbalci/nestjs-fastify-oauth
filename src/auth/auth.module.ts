import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MailModule } from 'src/mail/mail.module';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  imports: [UsersModule, MailModule, HttpModule],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, JwtService, OAuthService],
  exports: [JwtService],
})
export class AuthModule {}
