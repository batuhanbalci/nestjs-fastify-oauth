import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { readFileSync } from 'fs';
import * as Handlebars from 'handlebars';
import { join } from 'path';
import { AwsSesService } from 'src/aws/aws-ses.service';
import { ITemplatedData, ITemplates } from './interfaces';

@Injectable()
export class MailService {
  private readonly templates: ITemplates;
  private readonly domain: string;
  private readonly emailFrom: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsSesService: AwsSesService,
  ) {
    this.domain = this.configService.get<string>('domain')!;
    this.emailFrom = this.configService.get<string>('app.email.from')!;
    this.templates = {
      confirmation: MailService.parseTemplate('confirmation.hbs'),
      resetPassword: MailService.parseTemplate('reset-password.hbs'),
    };
  }

  private static parseTemplate(
    templateName: string,
  ): Handlebars.TemplateDelegate<ITemplatedData> {
    const templateText = readFileSync(
      join(__dirname, 'templates', templateName),
      'utf-8',
    );
    return Handlebars.compile<ITemplatedData>(templateText, { strict: true });
  }

  private sendEmail(
    from: string,
    to: Array<string>,
    subject: string,
    html: string,
  ): void {
    this.awsSesService.sendEmail(from, to, html, subject);
  }

  public sendConfirmationEmail(user: User, token: string): void {
    const { email } = user;
    const subject = 'Confirm your email';
    const html = this.templates.confirmation({
      name: 'USER',
      website: this.domain,
      link: `${this.domain}/api/auth/confirm-email/${token}`,
    });

    this.sendEmail(this.emailFrom, [email], subject, html);
  }

  public sendResetPasswordEmail(user: User, token: string): void {
    const { email } = user;
    const subject = 'Reset your password';
    const html = this.templates.resetPassword({
      name: 'USER',
      website: this.domain,
      link: `${this.domain}/api/auth/reset-password/${token}`,
    });

    this.sendEmail(this.emailFrom, [email], subject, html);
  }
}
