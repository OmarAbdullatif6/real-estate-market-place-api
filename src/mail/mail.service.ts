import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset Request',
        template: './reset-password',
        context: {
          name,
          url: resetUrl,
        },
      });
      this.logger.log(`Password reset email successfully sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${email}`, error.stack);
    }
  }
}