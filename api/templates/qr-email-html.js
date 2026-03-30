function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildQrEmailHtml({ cleanTitle, trackedUrl, message, downloadUrl }) {
    const safeTitle = escapeHtml(cleanTitle);
    const safeTrackedUrl = escapeHtml(trackedUrl);
    const safeMessage = escapeHtml(message || 'Noskenē un palīdzi!');
    const safeDownloadUrl = downloadUrl ? escapeHtml(downloadUrl) : null;

    return `<!DOCTYPE html>
<html lang="lv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    .outer {
      background-color: #ffffff;
      width: 100%;
    }
    .outer-cell {
      padding: 10px;
      text-align: center;
    }
    .container {
      width: 600px;
      max-width: 600px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .main-card {
      background-color: #f3e8da;
      border-radius: 30px 30px 0 0;
      overflow: hidden;
    }
    .content-padding {
      padding: 0 40px 20px 40px;
      text-align: center;
    }
    .logo-wrap {
      padding: 40px 40px 20px 40px;
      text-align: center;
    }
    .logo {
      display: block;
      border: 0;
      margin: 0 auto;
      max-width: 120px;
    }
    .brand-subtitle {
      font-size: 14px;
      color: #101817;
      letter-spacing: 1px;
      margin-top: 15px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 0;
    }
    .mobile-title {
      font-size: 28px;
      color: #101817;
      margin: 0;
      line-height: 1.2;
    }
    .intro {
      font-size: 16px;
      line-height: 1.6;
      color: #101817;
      margin-top: 25px;
      text-align: center;
    }
    .intro-p {
      margin: 0 0 12px;
    }
    .intro-p-tight {
      margin: 0 0 4px;
    }
    .project-title {
      margin: 0;
      font-weight: 700;
      font-size: 17px;
    }
    .qr-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 32px 24px;
      border: 1px solid #e8e0d5;
      text-align: center;
    }
    .qr-caption {
      text-align: center;
      color: #555555;
      font-size: 17px;
      font-weight: 600;
      margin: 0 0 24px;
      line-height: 1.4;
    }
    .qr-image {
      display: block;
      margin: 0 auto;
      border: 0;
    }
    .btn-row {
      text-align: center;
    }
    .btn-cell-left {
      padding-right: 8px;
    }
    .btn-cell-right {
      padding-left: 8px;
    }
    .btn {
      display: inline-block;
      padding: 14px 24px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .btn-primary {
      background: #f15b46;
      color: #ffffff;
    }
    .btn-secondary {
      background: #ffffff;
      color: #101817;
      border: 2px solid #101817;
    }
    .note {
      font-size: 13px;
      color: #666666;
      font-style: italic;
      line-height: 1.6;
      margin: 0;
      text-align: center;
    }
    .signoff {
      padding: 0 40px 40px 40px;
      text-align: center;
    }
    .signoff-strong {
      font-size: 16px;
      margin: 5px 0;
      font-weight: bold;
      color: #101817;
    }
    .signoff-soft {
      font-size: 16px;
      margin: 25px 0 15px 0;
      color: #101817;
    }
    .heart {
      display: block;
      margin: 0 auto;
    }
    .footer-cell {
      padding: 40px 20px;
      background-color: #101817;
      border-bottom-left-radius: 30px;
      border-bottom-right-radius: 30px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .footer-copy {
      font-size: 12px;
      color: #ffffff;
      line-height: 1.8;
      opacity: 0.8;
      margin: 0;
    }
    .footer-copyright {
      font-size: 11px;
      color: #f15b46;
      margin-top: 25px;
      letter-spacing: 0.5px;
    }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 20px !important; }
      .content-padding { padding: 30px 20px !important; }
      .logo-wrap { padding: 30px 20px 20px 20px !important; }
      .mobile-title { font-size: 24px !important; }
      .footer-cell { border-radius: 0 0 20px 20px !important; }
    }
  </style>
</head>
<body>
<center>
  <table class="outer" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
    <tbody>
      <tr>
        <td class="outer-cell" align="center">

          <table class="container main-card" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0">
            <tbody>

              <tr>
                <td class="logo-wrap" align="center">
                  <img class="logo" src="https://cdn.prod.website-files.com/698e2c3af37ce59eb7e8a957/698e483dcbbbd5d8eec466e4_logo.svg" alt="Māte Logo" width="120">
                  <p class="brand-subtitle">Palīdzam palīdzēt</p>
                </td>
              </tr>

              <tr>
                <td class="content-padding" align="center">
                  <h1 class="mobile-title">Sveiks/-a!</h1>
                  <div class="intro">
                    <p class="intro-p">Paldies, ka palīdzi mums palīdzēt, daloties ar labo un dodot iespēju sapnim!</p>
                    <p class="intro-p">Esi izveidojis savu unikālo QR kodu, tagad vari ar to dalīties ar mīļajiem digitāli vai lejupielādēt un izmantot arī fiziskajā telpā.</p>
                    <p class="intro-p-tight">Tu esi izvēlējies atbalstīt:</p>
                    <p class="project-title">${safeTitle}</p>
                  </div>
                </td>
              </tr>

              <tr>
                <td class="content-padding" align="center">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                    <tr>
                      <td class="qr-card" align="center">
                        <p class="qr-caption">${safeMessage}</p>
                        <img class="qr-image" src="cid:qrcode" alt="QR kods" width="220" height="220">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td class="content-padding btn-row" align="center">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td class="btn-cell-left">
                        <a href="${safeTrackedUrl}" class="btn btn-primary">Doties uz projektu</a>
                      </td>
                      ${safeDownloadUrl ? `
                      <td class="btn-cell-right">
                        <a href="${safeDownloadUrl}" class="btn btn-secondary">Lejupielādēt</a>
                      </td>
                      ` : ''}
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td class="content-padding" align="center">
                  <p class="note">
                    *Atceries — ja projekts būs noslēdzies vai mērķis sasniegts,<br>Tavs QR kods vedīs uz visiem projektiem!
                  </p>
                </td>
              </tr>

              <tr>
                <td class="signoff" align="center">
                  <p class="signoff-strong">Sirsnīgs paldies, par labajiem darbiem!</p>
                  <p class="signoff-strong">Biedrības Māte komanda</p>
                  <p class="signoff-soft">Ar sirsnību,</p>
                  <img class="heart" src="https://cdn.prod.website-files.com/698e2c3af37ce59eb7e8a957/69988c1fc6349bd823178aa6_favicon.ico" alt="Sirds" width="30">
                </td>
              </tr>

            </tbody>
          </table>

          <table class="container" role="presentation" border="0" width="600" cellspacing="0" cellpadding="0">
            <tbody>
              <tr>
                <td class="footer-cell" align="center">
                  <p class="footer-copy">
                    Organizācijai ir piešķirts sabiedriskā labuma statuss.<br>
                    Darbība tiek īstenota caurspīdīgi un atbildīgi.
                  </p>
                  <p class="footer-copyright">© 2026 Māte. Visas tiesības aizsargātas.</p>
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
