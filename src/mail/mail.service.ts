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
}
