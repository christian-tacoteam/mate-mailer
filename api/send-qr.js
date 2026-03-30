const nodemailer = require('nodemailer');
const sharp = require('sharp');
const QRCode = require('qrcode');
const { buildQrEmailHtml } = require('./templates/qr-email-html');

const transporter = nodemailer.createTransport({
    host: process.env.MAILGUN_SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAILGUN_SMTP_USER,
        pass: process.env.MAILGUN_SMTP_PASS,
    },
});

// GET fallback: regenerate a plain QR PNG (no text) for the download button link.
async function buildQrPng(trackedUrl) {
    const qrBuf = await QRCode.toBuffer(trackedUrl, {
        type: 'png',
        width: 1400,
        margin: 2,
        errorCorrectionLevel: 'M',
    });
    return sharp(qrBuf)
        .resize(2048, 2048, { fit: 'contain', background: '#ffffff' })
        .png()
        .toBuffer();
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://ziedo.fondsmate.lv');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET /api/send-qr?url=<trackedUrl>
    // Fallback download — returns a plain QR PNG (server has no fonts for text).
    if (req.method === 'GET') {
        const url = req.query && req.query.url;
        if (!url) return res.status(400).send('Missing url');

        try {
            const card = await buildQrPng(decodeURIComponent(url));
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', 'attachment; filename="qr-kods.png"');
            return res.status(200).send(card);
        } catch (e) {
            console.error('Card build error:', e);
            return res.status(500).send('Failed to build image');
        }
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, projectTitle, message, trackedUrl, qrImageBase64, cardImageBase64 } = req.body;

    if (!email || !projectTitle || !trackedUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // qrImageBase64  — browser-rendered email preview card (text + QR, ~500px), shown inline.
    // cardImageBase64 — browser-rendered high-res download card (text + QR, ~900px), sent as attachment.
    // Both are built by browser canvas so text renders correctly regardless of server fonts.
    const emailCardBase64 = qrImageBase64.replace(/^data:image\/\w+;base64,/, '');
    const downloadCardBase64 = cardImageBase64
        ? cardImageBase64.replace(/^data:image\/\w+;base64,/, '')
        : emailCardBase64;

    try {
        const cleanTitle = projectTitle.replace(/\s*\(.*?\)\s*/g, '').trim();

        const apiBase = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.API_BASE_URL || '';

        const downloadUrl = apiBase
            ? `${apiBase}/api/send-qr?url=${encodeURIComponent(trackedUrl)}`
            : null;

        await transporter.sendMail({
            from: process.env.MAILGUN_FROM,
            to: email,
            subject: `QR kods: ${cleanTitle}`,
            html: buildQrEmailHtml({
                cleanTitle,
                trackedUrl,
                message,
                downloadUrl,
            }),
            attachments: [
                {
                    // Shown inline in email body via cid:qrcode (email preview card)
                    filename: 'qrcode.png',
                    content: emailCardBase64,
                    encoding: 'base64',
                    cid: 'qrcode',
                },
                {
                    // Downloadable attachment — high-res card, works in any email client
                    filename: 'qr-kods.png',
                    content: downloadCardBase64,
                    encoding: 'base64',
                },
            ],
        });

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Mailgun SMTP error:', err);
        return res.status(500).json({ error: 'Failed to send email' });
    }
};
