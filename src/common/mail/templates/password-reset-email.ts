import { emailLayout } from './email-layout';

interface PasswordResetEmailOptions {
    name: string;
    resetUrl: string;
    expiresIn: string;
}

export function passwordResetEmail({ name, resetUrl, expiresIn = '15 minutes' }: PasswordResetEmailOptions): string {
    const appName = process.env.APP_NAME ?? 'Your Company';

    return emailLayout({
        title: 'Reset your password',
        content: `
            <h1 style="
                margin: 0 0 16px;
                font-size: 24px;
                color: #0f172a;
            ">
                Reset your password
            </h1>

            <p style="
                margin: 0 0 16px;
                font-size: 15px;
                line-height: 1.6;
                color: #475569;
            ">
                Hi ${name},
            </p>

            <p style="
                margin: 0 0 24px;
                font-size: 15px;
                line-height: 1.6;
                color: #475569;
            ">
                We received a request to reset your ${appName}
                account password. Click the button below to choose
                a new password.
            </p>

            <table
                role="presentation"
                cellpadding="0"
                cellspacing="0"
                border="0"
                align="center"
                style="margin: 0 auto;"
            >
                <tr>
                    <td
                        align="center"
                        style="
                            border-radius: 8px;
                            background-color: #2563eb;
                        "
                    >
                        <a
                            href="${resetUrl}"
                            style="
                                display: inline-block;
                                min-width: 180px;
                                padding: 15px 36px;
                                color: #ffffff;
                                font-size: 15px;
                                font-weight: 600;
                                line-height: 1.2;
                                text-align: center;
                                text-decoration: none;
                            "
                        >
                            Reset Password
                        </a>
                    </td>
                </tr>
            </table>

            <p style="
                margin: 24px 0 0;
                font-size: 13px;
                line-height: 1.6;
                color: #64748b;
            ">
                This password reset link will expire in ${expiresIn}.
            </p>

            <p style="
                margin: 12px 0 0;
                font-size: 13px;
                line-height: 1.6;
                color: #64748b;
            ">
                If you didn't request a password reset, you can safely
                ignore this email. Your password will remain unchanged.
            </p>
        `,
    });
}