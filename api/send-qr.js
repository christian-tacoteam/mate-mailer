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

// Clean 500px QR-only PNG for inline cid:qrcode in email body.
async function buildEmailQrPng(trackedUrl) {
    const qrBuf = await QRCode.toBuffer(trackedUrl, {
        type: 'png',
        width: 500,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#101817', light: '#ffffff' },
    });
    return sharp(qrBuf)
        .resize(500, 500, { fit: 'contain', background: '#ffffff' })
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

    console.log('POST body keys:', Object.keys(req.body));
    console.log('message value:', JSON.stringify(message));

    const safeMessageValue = (typeof message === 'string' && message.trim()) ? message.trim() : 'Nosken\u0113 un pal\u012bdzi!';

    if (!email || !projectTitle || !trackedUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // qrImageBase64  — browser-rendered card (text + QR). Used as download attachment fallback.
    // cardImageBase64 — browser-rendered high-res download card, preferred for attachment.
    // For the inline email QR we generate a clean server-side PNG so it always renders correctly.
    const downloadCardBase64 = (cardImageBase64 || qrImageBase64).replace(/^data:image\/\w+;base64,/, '');

    try {
        const cleanTitle = projectTitle.replace(/\s*\(.*?\)\s*/g, '').trim();

        const apiBase = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.API_BASE_URL || '';

        const downloadUrl = apiBase
            ? `${apiBase}/api/send-qr?url=${encodeURIComponent(trackedUrl)}`
            : null;

        // Generate a clean server-side QR PNG for inline display in email body
        const inlineQrBuffer = await buildEmailQrPng(trackedUrl);

        await transporter.sendMail({
            from: process.env.MAILGUN_FROM,
            to: email,
            subject: `QR kods: ${cleanTitle}`,
            html: buildQrEmailHtml({
                cleanTitle,
                trackedUrl,
                message: safeMessageValue,
                downloadUrl,
            }),
            attachments: [
                {
                    // Shown inline in email body via cid:qrcode — server-generated, always clean
                    filename: 'qrcode.png',
                    content: inlineQrBuffer,
                    encoding: 'base64',
                    cid: 'qrcode',
                },
                {
                    // Downloadable attachment — browser-rendered high-res card with text
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
