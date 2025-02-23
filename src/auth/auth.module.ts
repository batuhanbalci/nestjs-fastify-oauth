import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService],
})
export class AuthModule {}
