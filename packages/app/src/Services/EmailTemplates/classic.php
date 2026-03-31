<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($postTitle, ENT_QUOTES) ?></title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#ffffff;border-radius:8px 8px 0 0;padding:28px 36px;border-bottom:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:56px;vertical-align:middle;">
                    <?php if ($blogLogoUrl): ?>
                    <img src="<?= htmlspecialchars($blogLogoUrl, ENT_QUOTES) ?>" width="44" height="44"
                         style="border-radius:50%;object-fit:cover;display:block;"
                         alt="<?= htmlspecialchars($blogName, ENT_QUOTES) ?>">
                    <?php endif; ?>
                  </td>
                  <td style="vertical-align:middle;padding-left:<?= $blogLogoUrl ? '14px' : '0' ?>;">
                    <span style="color:#111827;font-family:Georgia,serif;font-size:22px;font-weight:700;">
                      <?= htmlspecialchars($blogName, ENT_QUOTES) ?>
                    </span>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;width:4px;height:32px;background:#e11d48;border-radius:2px;"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content — with left accent border -->
          <tr>
            <td style="background:#ffffff;padding:32px 36px 28px;">
              <p style="margin:0 0 12px;color:#6b7280;font-family:Georgia,serif;font-size:13px;font-style:italic;">
                <?= htmlspecialchars(sprintf($t['greeting'], $subscriberName), ENT_QUOTES) ?>
              </p>

              <!-- Left-border editorial block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:4px;background:#e11d48;border-radius:2px;">&nbsp;</td>
                  <td style="padding-left:18px;">
                    <p style="margin:0 0 6px;color:#9ca3af;font-family:sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;">
                      <?= htmlspecialchars(sprintf($t['new_post'], $blogName), ENT_QUOTES) ?>
                    </p>
                    <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#111827;line-height:1.35;">
                      <?= htmlspecialchars($postTitle, ENT_QUOTES) ?>
                    </h1>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;color:#374151;font-family:Georgia,serif;font-size:15px;line-height:1.75;">
                <?= nl2br(htmlspecialchars($excerpt, ENT_QUOTES)) ?>
              </p>
              <a href="<?= htmlspecialchars($postUrl, ENT_QUOTES) ?>"
                 style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:4px;font-family:sans-serif;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                <?= htmlspecialchars($t['read_article'], ENT_QUOTES) ?>
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 8px 8px;padding:18px 36px 26px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;color:#9ca3af;font-family:sans-serif;font-size:12px;line-height:1.6;">
                <?= htmlspecialchars(sprintf($t['subscribed_to'], $blogName), ENT_QUOTES) ?><br>
                <a href="<?= htmlspecialchars($unsubscribeUrl, ENT_QUOTES) ?>"
                   style="color:#e11d48;text-decoration:underline;">
                  <?= htmlspecialchars($t['unsubscribe'], ENT_QUOTES) ?>
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
