const nodemailer = require('nodemailer');
const sharp = require('sharp');
const QRCode = require('qrcode');
const { createCanvas } = require('@napi-rs/canvas');
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

const DOWNLOAD_SIZE = 2048;

// Wrap text into lines that fit within maxWidth pixels at the given font size.
function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    for (const word of words) {
        const candidate = current ? current + ' ' + word : word;
        if (ctx.measureText(candidate).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);
    return lines;
}

// Build the downloadable square card as a 2048x2048 PNG using canvas for text.
async function buildCardPng(base64Data, message) {
    const cardW = DOWNLOAD_SIZE;
    const cardH = DOWNLOAD_SIZE;
    const padding = 120;
    const qrSize = 1400;
    const fontSize = 72;
    const lineHeight = 96;
    const textTop = 160;

    const normalizedMessage = (message || 'Noskenē un palīdzi!').trim() || 'Noskenē un palīdzi!';

    // --- Draw text onto a canvas then export as PNG ---
    const textCanvas = createCanvas(cardW, cardH);
    const ctx = textCanvas.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cardW, cardH);

    // Text
    ctx.fillStyle = '#555555';
    ctx.font = `600 ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const maxTextWidth = cardW - padding * 2;
    const lines = wrapText(ctx, normalizedMessage, maxTextWidth).slice(0, 3);

    lines.forEach((line, i) => {
        ctx.fillText(line, cardW / 2, textTop + i * lineHeight);
    });

    const baseCardBuf = textCanvas.toBuffer('image/png');

    // --- Scale QR to fill bottom portion ---
    const qrBuf = await sharp(Buffer.from(base64Data, 'base64'))
        .resize(qrSize, qrSize, { fit: 'contain', background: '#ffffff' })
        .png()
        .toBuffer();

    const card = await sharp(baseCardBuf)
        .composite([{
            input: qrBuf,
            top: cardH - padding - qrSize,
            left: Math.round((cardW - qrSize) / 2),
            blend: 'over',
        }])
        .png()
        .toBuffer();

    return { card, cardW, cardH };
}

async function buildQrBase64FromUrl(trackedUrl) {
    const qrBuf = await QRCode.toBuffer(trackedUrl, {
        type: 'png',
        width: 1400,
        margin: 1,
        errorCorrectionLevel: 'M',
    });
    return qrBuf.toString('base64');
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://ziedo.fondsmate.lv');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET /api/send-qr?url=<trackedUrl>&msg=<text> -> returns full white card PNG
    // Legacy GET /api/send-qr?img=<base64>&msg=<text> is still supported.
    if (req.method === 'GET') {
        const img = req.query && req.query.img;
        const url = req.query && req.query.url;
        const msg = req.query && req.query.msg ? decodeURIComponent(req.query.msg) : '';

        if (!img && !url) {
            return res.status(400).send('Missing img or url');
        }

        try {
            let qrBase64;
            if (img) {
                qrBase64 = decodeURIComponent(img);
            } else {
                const trackedUrl = decodeURIComponent(url);
                qrBase64 = await buildQrBase64FromUrl(trackedUrl);
            }

            const { card } = await buildCardPng(qrBase64, msg);
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

    const { email, projectTitle, message, trackedUrl, qrImageBase64 } = req.body;

    if (!email || !projectTitle || !trackedUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Frontend always provides QR image data URL.
    const base64Data = qrImageBase64.replace(/^data:image\/\w+;base64,/, '');

    try {
        const cleanTitle = projectTitle.replace(/\s*\(.*?\)\s*/g, '').trim();

        const qrBase64 = base64Data;
        const { card: cardAttachment } = await buildCardPng(qrBase64, message || '');

        const apiBase = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.API_BASE_URL || '';

        const downloadUrl = apiBase
            ? `${apiBase}/api/send-qr?url=${encodeURIComponent(trackedUrl)}&msg=${encodeURIComponent(message || '')}`
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
                    filename: 'qrcode.png',
                    content: qrBase64,
                    encoding: 'base64',
                    cid: 'qrcode',
                },
                {
                    filename: 'qr-kods.png',
                    content: cardAttachment,
                },
            ],
        });

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Mailgun SMTP error:', err);
        return res.status(500).json({ error: 'Failed to send email' });
    }
};
