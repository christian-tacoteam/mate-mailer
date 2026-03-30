function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildQrEmailHtml({ cleanTitle, trackedUrl, message }) {
    const safeTitle = escapeHtml(cleanTitle);
    const safeTrackedUrl = escapeHtml(trackedUrl);
    const safeMessage = escapeHtml(message) || 'Nosken\u0113 un pal\u012bdzi!';

    return `<!DOCTYPE html>
<html lang="lv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<center>
  <table style="background-color:#ffffff;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
    <tbody>
      <tr>
        <td style="padding:10px;" align="center">

          <table style="background-color:#f3e8da;border-radius:30px 30px 0 0;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;width:600px;max-width:600px;" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0">
            <tbody>

              <tr>
                <td style="padding:40px 40px 20px 40px;text-align:center;" align="center">
                  <img style="display:block;border:0;margin:0 auto;max-width:120px;" src="https://cdn.prod.website-files.com/698e2c3af37ce59eb7e8a957/698e483dcbbbd5d8eec466e4_logo.svg" alt="Māte Logo" width="120">
                  <p style="font-size:14px;color:#101817;letter-spacing:1px;margin-top:15px;font-weight:bold;text-transform:uppercase;margin-bottom:0;">Palīdzam palīdzēt</p>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 20px 40px;text-align:center;" align="center">
                  <h1 style="font-size:28px;color:#101817;margin:0;line-height:1.2;">Sveiks/-a!</h1>
                  <div style="font-size:16px;line-height:1.6;color:#101817;margin-top:25px;text-align:center;">
                    <p style="margin:0 0 12px;">Paldies, ka palīdzi mums palīdzēt, daloties ar labo un dodot iespēju sapnim!</p>
                    <p style="margin:0 0 12px;">Esi izveidojis savu unikālo QR kodu, tagad vari ar to dalīties ar mīļajiem digitāli vai lejupielādēt un izmantot arī fiziskajā telpā.</p>
                    <p style="margin:0 0 4px;">Tu esi izvēlējies atbalstīt:</p>
                    <p style="margin:0;font-weight:700;font-size:17px;">${safeTitle}</p>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 20px 40px;text-align:center;" align="center">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                    <tr>
                      <td align="center" style="background:#ffffff;border-radius:16px;padding:24px;border:1px solid #e8e0d5;text-align:center;">
                        <p style="text-align:center;color:#333333;font-size:18px;font-weight:700;margin:0 0 20px;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${safeMessage}</p>
                        <img src="cid:qrcode" alt="QR kods" width="260" height="260" style="display:block;margin:0 auto;border:0;max-width:100%;height:auto;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 20px 40px;text-align:center;" align="center">
                  <table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="text-align:center;">
                        <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
                          <tr>
                            <td style="padding-right:8px;text-align:center;" align="center">
                              <a href="${safeTrackedUrl}" style="display:inline-block;padding:14px 24px;background:#f15b46;color:#ffffff;border-radius:30px;text-decoration:none;font-weight:700;font-size:15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Doties uz projektu</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 20px 40px;text-align:center;" align="center">
                  <p style="font-size:13px;color:#666;font-style:italic;line-height:1.6;margin:0;text-align:center;">
                    *Atceries — ja projekts būs noslēdzies vai mērķis sasniegts,<br>Tavs QR kods vedīs uz visiem projektiem!
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 40px 40px;text-align:center;" align="center">
                  <p style="font-size:16px;margin:5px 0;font-weight:bold;color:#101817;">Sirsnīgs paldies, par labajiem darbiem!</p>
                  <p style="font-size:16px;margin:5px 0;font-weight:bold;color:#101817;">Biedrības Māte komanda</p>
                  <p style="font-size:16px;margin:25px 0 15px 0;color:#101817;">Ar sirsnību,</p>
                  <img style="display:block;margin:0 auto;" src="https://cdn.prod.website-files.com/698e2c3af37ce59eb7e8a957/69988c1fc6349bd823178aa6_favicon.ico" alt="Sirds" width="30">
                </td>
              </tr>

            </tbody>
          </table>

          <table style="width:600px;max-width:600px;" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0">
            <tbody>
              <tr>
                <td style="padding:40px 20px;background-color:#101817;border-bottom-left-radius:30px;border-bottom-right-radius:30px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;text-align:center;" align="center">
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
</html>`;
}

module.exports = { buildQrEmailHtml };
