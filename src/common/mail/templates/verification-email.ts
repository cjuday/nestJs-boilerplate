import { emailLayout } from './email-layout';

interface VerificationEmailOptions {
    name: string;
    verificationUrl: string;
}

export function verificationEmail({
    name,
    verificationUrl,
}: VerificationEmailOptions): string {
    const appName = process.env.APP_NAME ?? 'Your Company';

    return emailLayout({
        title: 'Verify your email',
        content: `
            <h1 style="
                margin: 0 0 16px;
                font-size: 24px;
                color: #0f172a;
            ">
                Verify your email
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
                Thanks for creating an account with ${appName}.
                Please verify your email address by clicking the
                button below.
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
                            href="${verificationUrl}"
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
                            Verify Email
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
                If you didn't create this account, you can safely
                ignore this email.
            </p>
        `,
    });
}