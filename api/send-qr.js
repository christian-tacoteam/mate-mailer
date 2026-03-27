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
        // Strip project title of anything in parentheses e.g. "(123 / 500)"
        const cleanTitle = projectTitle.replace(/\s*\(.*?\)\s*/g, '').trim();

        await transporter.sendMail({
            from: process.env.MAILGUN_FROM,
            to: email,
            subject: `QR kods: ${cleanTitle}`,
            html: `<!DOCTYPE html>
<html lang="lv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style type="text/css">
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 20px !important; }
      .content-padding { padding: 30px 20px !important; }
      .mobile-title { font-size: 24px !important; }
      .footer-cell { border-radius: 0 0 20px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<center>
  <table style="background-color:#ffffff;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
    <tbody>
      <tr>
        <td style="padding:10px;" align="center">

          <!-- Main beige card -->
          <table class="container" style="background-color:#f3e8da;border-radius:30px 30px 0 0;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0">
            <tbody>

              <!-- Logo -->
              <tr>
                <td class="content-padding" style="padding:40px 40px 20px 40px;" align="center">
                  <img style="display:block;border:0;margin:0 auto;max-width:120px;" src="https://cdn.prod.website-files.com/698e2c3af37ce59eb7e8a957/698e483dcbbbd5d8eec466e4_logo.svg" alt="Māte Logo" width="120">
                  <p style="font-size:14px;color:#101817;letter-spacing:1px;margin-top:15px;font-weight:bold;text-transform:uppercase;margin-bottom:0;">Palīdzam palīdzēt</p>
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td class="content-padding" style="padding:0 40px 20px 40px;" align="center">
                  <h1 class="mobile-title" style="font-size:28px;color:#101817;margin:0;line-height:1.2;">Sveiks/-a!</h1>
                  <div style="font-size:16px;line-height:1.6;color:#101817;margin-top:25px;text-align:center;">
                    <p style="margin:0 0 12px;">Paldies, ka palīdzi mums palīdzēt, daloties ar labo un dodot iespēju sapnim!</p>
                    <p style="margin:0 0 12px;">Esi izveidojis savu unikālo QR kodu, tagad vari ar to dalīties ar mīļajiem digitāli vai lejupielādēt un izmantot arī fiziskajā telpā.</p>
                    <p style="margin:0 0 4px;">Tu esi izvēlējies atbalstīt:</p>
                    <p style="margin:0;font-weight:700;font-size:17px;">${cleanTitle}</p>
                  </div>
                </td>
              </tr>

              <!-- QR white card -->
              ${base64Data ? `
              <tr>
                <td class="content-padding" style="padding:0 40px 20px 40px;" align="center">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                    <tr>
                      <td align="center" style="background:#ffffff;border-radius:16px;padding:32px 24px;border:1px solid #e8e0d5;">
                        <p style="text-align:center;color:#555;font-size:17px;font-weight:600;margin:0 0 24px;line-height:1.4;">${message || 'Noskenē un palīdzi!'}</p>
                        <img src="cid:qrcode" alt="QR kods" width="220" height="220" style="display:block;margin:0 auto;border:0;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ` : ''}

              <!-- Button -->
              <tr>
                <td class="content-padding" style="padding:0 40px 20px 40px;" align="center">
                  <a href="${trackedUrl}" style="display:inline-block;padding:14px 32px;background:#f15b46;color:#ffffff;border-radius:30px;text-decoration:none;font-weight:700;font-size:15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Doties uz projektu</a>
                </td>
              </tr>

              <!-- Footer note -->
              <tr>
                <td class="content-padding" style="padding:0 40px 20px 40px;" align="center">
                  <p style="font-size:13px;color:#666;font-style:italic;line-height:1.6;margin:0;text-align:center;">
                    *Atceries — ja projekts būs noslēdzies vai mērķis sasniegts,<br>Tavs QR kods vedīs uz visiem projektiem!
                  </p>
                </td>
              </tr>

              <!-- Sign-off -->
              <tr>
                <td class="content-padding" style="padding:0 40px 40px 40px;" align="center">
                  <p style="font-size:16px;margin:5px 0;font-weight:bold;color:#101817;">Sirsnīgs paldies, par labajiem darbiem!</p>
                  <p style="font-size:16px;margin:5px 0;font-weight:bold;color:#101817;">Biedrības Māte komanda</p>
                  <p style="font-size:16px;margin:25px 0 15px 0;color:#101817;">Ar sirsnību,</p>
                  <img style="display:block;margin:0 auto;" src="https://cdn.prod.website-files.com/698e2c3af37ce59eb7e8a957/69988c1fc6349bd823178aa6_favicon.ico" alt="Sirds" width="30">
                </td>
              </tr>

            </tbody>
          </table>

          <!-- Dark footer -->
          <table class="container" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0">
            <tbody>
              <tr>
                <td class="footer-cell" style="padding:40px 20px;background-color:#101817;border-bottom-left-radius:30px;border-bottom-right-radius:30px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;" align="center">
                  <p style="font-size:12px;color:#ffffff;line-height:1.8;opacity:0.8;margin:0;">
                    Organizācijai ir piešķirts sabiedriskā labuma statuss.<br>
                    Darbība tiek īstenota caurspīdīgi un atbildīgi.
                  </p>
                  <p style="font-size:11px;color:#f15b46;margin-top:25px;letter-spacing:0.5px;">© 2026 Māte. Visas tiesības aizsargātas.</p>
                </td>
              </tr>
            </tbody>
          </table>

        </td>
      </tr>
    </tbody>
  </table>
</center>
</body>
</html>`,
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

