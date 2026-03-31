<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($postTitle, ENT_QUOTES) ?></title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#4f46e5;border-radius:12px 12px 0 0;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:52px;vertical-align:middle;">
                    <?php if ($blogLogoUrl): ?>
                    <img src="<?= htmlspecialchars($blogLogoUrl, ENT_QUOTES) ?>" width="44" height="44"
                         style="border-radius:50%;object-fit:cover;display:block;border:2px solid rgba(255,255,255,0.3);"
                         alt="<?= htmlspecialchars($blogName, ENT_QUOTES) ?>">
                    <?php endif; ?>
                  </td>
                  <td style="vertical-align:middle;padding-left:<?= $blogLogoUrl ? '12px' : '0' ?>;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">
                      <?= htmlspecialchars($blogName, ENT_QUOTES) ?>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Label -->
          <tr>
            <td style="background:#eef2ff;padding:10px 32px;">
              <p style="margin:0;color:#6366f1;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;">
                <?= htmlspecialchars(sprintf($t['new_post'], $blogName), ENT_QUOTES) ?>
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:#ffffff;padding:32px 32px 24px;">
              <p style="margin:0 0 12px;color:#6b7280;font-size:14px;">
                <?= htmlspecialchars(sprintf($t['greeting'], $subscriberName), ENT_QUOTES) ?>
              </p>
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;line-height:1.3;">
                <?= htmlspecialchars($postTitle, ENT_QUOTES) ?>
              </h1>
              <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.7;">
                <?= nl2br(htmlspecialchars($excerpt, ENT_QUOTES)) ?>
              </p>
              <a href="<?= htmlspecialchars($postUrl, ENT_QUOTES) ?>"
                 style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                <?= htmlspecialchars($t['read_article'], ENT_QUOTES) ?>
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 12px 12px;padding:20px 32px 28px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                <?= htmlspecialchars(sprintf($t['subscribed_to'], $blogName), ENT_QUOTES) ?><br>
                <a href="<?= htmlspecialchars($unsubscribeUrl, ENT_QUOTES) ?>"
                   style="color:#6366f1;text-decoration:underline;">
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
