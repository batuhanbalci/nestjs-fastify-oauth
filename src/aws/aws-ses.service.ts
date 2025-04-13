import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const CHARSET = 'UTF-8';

@Injectable()
export class AwsSesService {
  private readonly sesClient: SESClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('aws.ses.region')!;
    const accessKeyId = this.configService.get<string>('aws.ses.accessKeyId')!;
    const secretAccessKey = this.configService.get<string>(
      'aws.ses.secretAccessKey',
    )!;
    this.sesClient = new SESClient({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  }

  public sendEmail(
    from: string,
    to: Array<string>,
    html: string,
    subject: string,
  ): void {
    this.sesClient
      .send(
        new SendEmailCommand({
          Source: from,
          Destination: {
            ToAddresses: to,
          },
          Message: {
            Body: {
              Html: {
                Charset: CHARSET,
                Data: html,
              },
            },
            Subject: {
              Charset: CHARSET,
              Data: subject,
            },
          },
        }),
      )
      .catch((error) => {
        Logger.error('Error sending email via AWS SES', error);
      });
  }
}
