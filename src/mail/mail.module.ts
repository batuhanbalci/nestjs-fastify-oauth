import { Module } from '@nestjs/common';
import { AwsModule } from 'src/aws/aws.module';
import { MailService } from './mail.service';

@Module({
  imports: [AwsModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
