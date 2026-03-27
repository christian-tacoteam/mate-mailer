const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAILGUN_SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAILGUN_SMTP_USER,
        pass: process.env.MAILGUN_SMTP_PASS,
    },
});

module.exports = async function handler(req, res) {
    // Allow requests from your Shopify store
    res.setHeader('Access-Control-Allow-Origin', 'https://ziedo.fondsmate.lv');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, projectTitle, message, trackedUrl, qrImageBase64 } = req.body;

    if (!email || !projectTitle || !trackedUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Strip the data:image/png;base64, prefix if present
    const base64Data = qrImageBase64
        ? qrImageBase64.replace(/^data:image\/\w+;base64,/, '')
        : null;

    try {
        await transporter.sendMail({
            from: process.env.MAILGUN_FROM,
            to: email,
            subject: `QR kods: ${projectTitle}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
                    <h2 style="color: #222;">${projectTitle}</h2>
                    <p style="color: #444; font-size: 16px;">${message || 'Noskenē un palīdzi!'}</p>

                    ${base64Data ? `
                    <div style="text-align: center; margin: 32px 0;">
                        <img src="cid:qrcode" alt="QR kods" style="width: 260px; height: 260px;" />
                    </div>
                    ` : ''}

                    <a href="${trackedUrl}"
                       style="display: inline-block; margin-top: 16px; padding: 14px 28px;
                              background: #FF8F73; color: #fff; border-radius: 30px;
                              text-decoration: none; font-weight: 700; font-size: 16px;">
                        Doties uz projektu
                    </a>

                    <p style="margin-top: 32px; color: #999; font-size: 13px;">
                        Šo e-pastu nosūtīja <a href="https://fondsmate.lv" style="color: #FF8F73;">Fonds Māte</a>
                    </p>
                </div>
            `,
            attachments: base64Data ? [
                {
                    filename: 'qr-kods.png',
                    content: base64Data,
                    encoding: 'base64',
                    cid: 'qrcode',
                },
            ] : [],
        });

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Mailgun SMTP error:', err);
        return res.status(500).json({ error: 'Failed to send email' });
    }
};

