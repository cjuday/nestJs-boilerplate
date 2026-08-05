import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

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
            html: `
                <h2>Welcome ${name}</h2>
                <p>Thanks for registering.</p>
                <p>
                    Click the button below to verify your email.
                </p>
                <p>
                    <a href="${verificationUrl}">
                    Verify Email
                    </a>
                </p>

                <p>
                    This link expires in 10 minutes.
                </p>
                `,        
        });
    }

    async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
        const from = `${this.configService.getOrThrow('MAIL_FROM_NAME')} <${this.configService.getOrThrow('MAIL_FROM_EMAIL')}>`;
        const appName = this.configService.getOrThrow('APP_NAME');
        const resetUrl = `${this.configService.getOrThrow<string>('APP_FRONTEND_URL')}/auth/reset-password?token=${resetToken}`;

        await this.resend.emails.send({
            from,
            to: email,
            subject: `Reset Your ${appName} Password`,
            html: `
                <h2>Hello ${name},</h2>

                <p>
                    We received a request to reset your password.
                </p>

                <p>
                    <a href="${resetUrl}">
                        Reset Password
                    </a>
                </p>

                <p>
                    This link expires in 15 minutes.
                </p>

                <p>
                    If you didn't request a password reset, you can safely ignore this email.
                </p>
            `,   
        });
    }
}
