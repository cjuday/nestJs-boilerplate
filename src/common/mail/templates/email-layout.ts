interface EmailLayoutOptions {
    title: string;
    content: string;
}

export function emailLayout({
    title,
    content,
}: EmailLayoutOptions): string {
    const appName = process.env.APP_NAME ?? 'Your Company';

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />
            <title>${title}</title>
        </head>

        <body style="
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
        ">
            <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="background-color: #f8fafc; padding: 40px 16px;"
            >
                <tr>
                    <td align="center">

                        <table
                            role="presentation"
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                                max-width: 560px;
                                background-color: #ffffff;
                                border-radius: 12px;
                                overflow: hidden;
                            "
                        >
                            <!-- Header -->
                            <tr>
                                <td
                                    align="center"
                                    style="padding: 28px 32px;"
                                >
                                    <strong style="
                                        font-size: 22px;
                                        color: #0f172a;
                                    ">
                                        ${appName}
                                    </strong>
                                </td>
                            </tr>

                            <!-- Content -->
                            <tr>
                                <td style="padding: 8px 32px 32px;">
                                    ${content}
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td
                                    align="center"
                                    style="
                                        padding: 20px 32px;
                                        border-top: 1px solid #e8edf3;
                                        color: #64748b;
                                        font-size: 12px;
                                    "
                                >
                                    © ${new Date().getFullYear()} ${appName}.
                                    All rights reserved.
                                </td>
                            </tr>

                        </table>

                    </td>
                </tr>
            </table>
        </body>
        </html>
    `.trim();
}