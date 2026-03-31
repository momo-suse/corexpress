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

          <!-- Top accent bar -->
          <tr>
            <td style="background:linear-gradient(to right, #d946ef, #22d3ee);height:3px;border-radius:0;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:24px 36px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:56px;vertical-align:middle;">
                    <?php if ($blogLogoUrl): ?>
                    <img src="<?= htmlspecialchars($blogLogoUrl, ENT_QUOTES) ?>" width="44" height="44"
                         style="border-radius:50%;object-fit:cover;display:block;filter:grayscale(20%);"
                         alt="<?= htmlspecialchars($blogName, ENT_QUOTES) ?>">
                    <?php endif; ?>
                  </td>
                  <td style="vertical-align:middle;padding-left:<?= $blogLogoUrl ? '14px' : '0' ?>;">
                    <span style="color:#fafafa;font-size:20px;font-weight:900;text-transform:uppercase;letter-spacing:-1px;">
                      <?= htmlspecialchars($blogName, ENT_QUOTES) ?>.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:#18181b;padding:8px 36px 28px;">
              <p style="margin:0 0 8px;color:#d946ef;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:3px;">
                <?= htmlspecialchars(sprintf($t['new_post'], ''), ENT_QUOTES) ?>
              </p>
              <p style="margin:0 0 16px;color:#71717a;font-size:13px;">
                <?= htmlspecialchars(sprintf($t['greeting'], $subscriberName), ENT_QUOTES) ?>
              </p>
              <h1 style="margin:0 0 20px;font-size:26px;font-weight:900;color:#fafafa;line-height:1.2;text-transform:uppercase;letter-spacing:-0.5px;">
                <?= htmlspecialchars($postTitle, ENT_QUOTES) ?>
              </h1>
              <p style="margin:0 0 28px;color:#a1a1aa;font-size:14px;line-height:1.65;">
                <?= nl2br(htmlspecialchars($excerpt, ENT_QUOTES)) ?>
              </p>
              <a href="<?= htmlspecialchars($postUrl, ENT_QUOTES) ?>"
                 style="display:inline-block;background:#d946ef;color:#ffffff;text-decoration:none;padding:13px 28px;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;">
                <?= htmlspecialchars($t['read_article'], ENT_QUOTES) ?>
              </a>
            </td>
          </tr>

          <!-- Bottom accent bar -->
          <tr>
            <td style="background:linear-gradient(to right, #22d3ee, #d946ef);height:2px;"></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#09090b;border-radius:0 0 4px 4px;padding:18px 36px 24px;">
              <p style="margin:0;color:#3f3f46;font-size:11px;line-height:1.6;text-transform:uppercase;letter-spacing:0.5px;">
                <?= htmlspecialchars(sprintf($t['subscribed_to'], $blogName), ENT_QUOTES) ?><br>
                <a href="<?= htmlspecialchars($unsubscribeUrl, ENT_QUOTES) ?>"
                   style="color:#71717a;text-decoration:underline;">
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
