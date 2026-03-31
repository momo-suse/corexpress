<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($postTitle, ENT_QUOTES) ?></title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1c1917;border-radius:0;padding:28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:56px;vertical-align:middle;">
                    <?php if ($blogLogoUrl): ?>
                    <img src="<?= htmlspecialchars($blogLogoUrl, ENT_QUOTES) ?>" width="44" height="44"
                         style="border-radius:50%;object-fit:cover;display:block;filter:grayscale(30%);"
                         alt="<?= htmlspecialchars($blogName, ENT_QUOTES) ?>">
                    <?php endif; ?>
                  </td>
                  <td style="vertical-align:middle;padding-left:<?= $blogLogoUrl ? '14px' : '0' ?>;">
                    <span style="color:#fafaf9;font-family:Georgia,serif;font-size:20px;font-weight:400;letter-spacing:0.5px;">
                      <?= htmlspecialchars($blogName, ENT_QUOTES) ?>
                    </span>
                    <p style="margin:2px 0 0;color:#a8a29e;font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:2px;">Journal</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent strip -->
          <tr>
            <td style="background:#b45309;padding:3px 0;"></td>
          </tr>

          <!-- Label -->
          <tr>
            <td style="background:#fafaf9;padding:14px 36px 0;">
              <p style="margin:0;color:#a8a29e;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;">
                <?= htmlspecialchars(sprintf($t['new_post'], $blogName), ENT_QUOTES) ?>
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:#fafaf9;padding:20px 36px 28px;">
              <p style="margin:0 0 14px;color:#78716c;font-family:Georgia,serif;font-size:14px;font-style:italic;">
                <?= htmlspecialchars(sprintf($t['greeting'], $subscriberName), ENT_QUOTES) ?>
              </p>
              <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1c1917;line-height:1.35;letter-spacing:-0.3px;">
                <?= htmlspecialchars($postTitle, ENT_QUOTES) ?>
              </h1>
              <p style="margin:0 0 28px;color:#44403c;font-family:Georgia,serif;font-size:15px;line-height:1.75;">
                <?= nl2br(htmlspecialchars($excerpt, ENT_QUOTES)) ?>
              </p>
              <a href="<?= htmlspecialchars($postUrl, ENT_QUOTES) ?>"
                 style="display:inline-block;background:#b45309;color:#fafaf9;text-decoration:none;padding:12px 26px;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">
                <?= htmlspecialchars($t['read_article'], ENT_QUOTES) ?>
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafaf9;padding:20px 36px 28px;border-top:1px solid #e7e5e4;">
              <p style="margin:0;color:#a8a29e;font-family:monospace;font-size:11px;line-height:1.6;text-transform:uppercase;letter-spacing:0.5px;">
                <?= htmlspecialchars(sprintf($t['subscribed_to'], $blogName), ENT_QUOTES) ?><br>
                <a href="<?= htmlspecialchars($unsubscribeUrl, ENT_QUOTES) ?>"
                   style="color:#78716c;text-decoration:underline;">
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
