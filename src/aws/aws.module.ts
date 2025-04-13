import { Module } from '@nestjs/common';
import { AwsSesService } from './aws-ses.service';

@Module({
  imports: [],
  providers: [AwsSesService],
  exports: [AwsSesService],
})
export class AwsModule {}
