import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  oauthConfig,
  validationSchema,
} from './config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        abortEarly: true,
      },
      load: [appConfig, databaseConfig, jwtConfig, oauthConfig],
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
