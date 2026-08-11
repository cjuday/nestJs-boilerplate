import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { verificationEmail } from '../common/mail/templates/verification-email';
import { passwordResetEmail } from '../common/mail//templates/password-reset-email';
import { formatDuration } from '../common/utils/formatDuration';

@Injectable()
export class MailService {
    private readonly resend: Resend;

    constructor(private readonly configService: ConfigService) {
        this.resend = new Resend(this.configService.getOrThrow<string>('RESEND_API_KEY'));
    }

    async sendVerificationEmail(email: string, name: string, verificationToken: string): Promise<void> {
        const from = `${this.configService.getOrThrow('MAIL_FROM_NAME')} <${this.configService.getOrThrow('MAIL_FROM_EMAIL')}>`;
        const appName = this.configService.getOrThrow('APP_NAME');
        const verificationUrl = `${this.configService.getOrThrow<string>('APP_FRONTEND_URL')}/auth/verify-email?token=${verificationToken}`;

        await this.resend.emails.send({
            from,
            to: email,
            subject: `Verify Your ${appName} Account`,
            html: verificationEmail({ name, verificationUrl })
        });
    }

    async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
        const from = `${this.configService.getOrThrow('MAIL_FROM_NAME')} <${this.configService.getOrThrow('MAIL_FROM_EMAIL')}>`;
        const appName = this.configService.getOrThrow('APP_NAME');
        const resetUrl = `${this.configService.getOrThrow<string>('APP_FRONTEND_URL')}/auth/reset-password?token=${resetToken}`;
        const expiresIn = formatDuration(this.configService.getOrThrow('PASSWORD_RESET_EXPIRES_IN'));

        await this.resend.emails.send({
            from,
            to: email,
            subject: `Reset Your ${appName} Password`,
            html: passwordResetEmail({ name, resetUrl, expiresIn})
        });
    }
}
