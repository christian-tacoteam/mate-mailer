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

const DOWNLOAD_SIZE = 2048;

function escapeSvg(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Build the downloadable square card as a 2048x2048 PNG.
async function buildCardPng(base64Data, message) {
    const cardW = DOWNLOAD_SIZE;
    const cardH = DOWNLOAD_SIZE;
    const padding = 120;
    const qrSize = 1280;
    const textBlockTop = 140;
    const textBlockHeight = 500;
    const textAreaWidth = cardW - (padding * 2);

    const normalizedMessage = (message || 'Noskenē un palīdzi!').trim() || 'Noskenē un palīdzi!';

    const baseCard = await sharp({
        create: {
            width: cardW,
            height: cardH,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
    })
        .png()
        .toBuffer();

    // Pango text rendering handles UTF-8 glyphs more reliably than SVG text in this environment.
    const textSvg = Buffer.from(`
    <svg width="${textAreaWidth}" height="${textBlockHeight}" xmlns="http://www.w3.org/2000/svg">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml"
             style="
               width:${textAreaWidth}px;
               height:${textBlockHeight}px;
               display:flex;
               align-items:flex-start;
               justify-content:center;
               text-align:center;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans',Arial,sans-serif;
               font-size:92px;
               line-height:1.2;
               font-weight:600;
               color:#555555;
               word-break:break-word;
               overflow:hidden;
             ">
          ${escapeSvg(normalizedMessage)}
        </div>
      </foreignObject>
    </svg>`);

    const textOverlay = await sharp(textSvg)
        .png()
        .toBuffer();

    const qrBuf = await sharp(Buffer.from(base64Data, 'base64'))
        .resize(qrSize, qrSize, { fit: 'contain', background: '#ffffff' })
        .png()
        .toBuffer();

    const card = await sharp(baseCard)
        .composite([
            {
                input: textOverlay,
                top: textBlockTop,
                left: padding,
                blend: 'over',
            },
            {
                input: qrBuf,
                top: cardH - padding - qrSize,
                left: Math.round((cardW - qrSize) / 2),
                blend: 'over',
            },
        ])
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
