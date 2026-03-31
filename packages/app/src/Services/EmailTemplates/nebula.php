<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($postTitle, ENT_QUOTES) ?></title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#18181b;border-radius:12px 12px 0 0;padding:28px 36px;border-bottom:1px solid rgba(6,182,212,0.2);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:56px;vertical-align:middle;">
                    <?php if ($blogLogoUrl): ?>
                    <img src="<?= htmlspecialchars($blogLogoUrl, ENT_QUOTES) ?>" width="44" height="44"
                         style="border-radius:50%;object-fit:cover;display:block;border:1px solid rgba(6,182,212,0.4);"
                         alt="<?= htmlspecialchars($blogName, ENT_QUOTES) ?>">
                    <?php endif; ?>
                  </td>
                  <td style="vertical-align:middle;padding-left:<?= $blogLogoUrl ? '14px' : '0' ?>;">
                    <span style="color:#f4f4f5;font-size:18px;font-weight:600;letter-spacing:-0.2px;">
                      <?= htmlspecialchars($blogName, ENT_QUOTES) ?>
                    </span>
                    <p style="margin:2px 0 0;color:#06b6d4;font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:2px;">notification</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:#18181b;padding:32px 36px 28px;">
              <p style="margin:0 0 12px;color:#71717a;font-family:monospace;font-size:12px;">
                <?= htmlspecialchars(sprintf($t['greeting'], $subscriberName), ENT_QUOTES) ?>
              </p>

              <!-- Glow label -->
              <p style="margin:0 0 10px;color:#06b6d4;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;">
                <?= htmlspecialchars(sprintf($t['new_post'], $blogName), ENT_QUOTES) ?>
              </p>

              <h1 style="margin:0 0 18px;font-size:22px;font-weight:700;color:#f4f4f5;line-height:1.35;letter-spacing:-0.3px;">
                <?= htmlspecialchars($postTitle, ENT_QUOTES) ?>
              </h1>

              <!-- Subtle divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
                <tr>
                  <td style="height:1px;background:linear-gradient(to right, rgba(6,182,212,0.5), transparent);"></td>
                </tr>
              </table>

              <p style="margin:0 0 28px;color:#a1a1aa;font-size:14px;line-height:1.7;">
                <?= nl2br(htmlspecialchars($excerpt, ENT_QUOTES)) ?>
              </p>
              <a href="<?= htmlspecialchars($postUrl, ENT_QUOTES) ?>"
                 style="display:inline-block;background:transparent;color:#06b6d4;text-decoration:none;padding:11px 24px;border-radius:8px;border:1px solid rgba(6,182,212,0.5);font-size:13px;font-weight:600;font-family:monospace;">
                <?= htmlspecialchars($t['read_article'], ENT_QUOTES) ?>
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#18181b;border-radius:0 0 12px 12px;padding:18px 36px 26px;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0;color:#52525b;font-family:monospace;font-size:11px;line-height:1.6;">
                <?= htmlspecialchars(sprintf($t['subscribed_to'], $blogName), ENT_QUOTES) ?><br>
                <a href="<?= htmlspecialchars($unsubscribeUrl, ENT_QUOTES) ?>"
                   style="color:#06b6d4;text-decoration:underline;">
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
