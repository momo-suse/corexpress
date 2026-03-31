<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($postTitle, ENT_QUOTES) ?></title>
</head>
<body style="margin:0;padding:0;background:#EDEAE3;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDEAE3;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#F7F5F0;border-radius:8px 8px 0 0;padding:28px 40px;border-bottom:1px solid #E8E2D5;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:56px;vertical-align:middle;">
                    <?php if ($blogLogoUrl): ?>
                    <img src="<?= htmlspecialchars($blogLogoUrl, ENT_QUOTES) ?>" width="44" height="44"
                         style="border-radius:50%;object-fit:cover;display:block;border:1px solid #E8E2D5;"
                         alt="<?= htmlspecialchars($blogName, ENT_QUOTES) ?>">
                    <?php endif; ?>
                  </td>
                  <td style="vertical-align:middle;padding-left:<?= $blogLogoUrl ? '14px' : '0' ?>;">
                    <span style="color:#2D2B2A;font-family:Georgia,serif;font-size:22px;font-weight:400;letter-spacing:0.3px;">
                      <?= htmlspecialchars($blogName, ENT_QUOTES) ?>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:#F7F5F0;padding:32px 40px 28px;">
              <p style="margin:0 0 8px;color:#8A857E;font-family:sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:2px;">
                <?= htmlspecialchars(sprintf($t['new_post'], $blogName), ENT_QUOTES) ?>
              </p>
              <p style="margin:0 0 16px;color:#8A857E;font-family:Georgia,serif;font-size:14px;font-style:italic;">
                <?= htmlspecialchars(sprintf($t['greeting'], $subscriberName), ENT_QUOTES) ?>
              </p>

              <!-- Thin accent line -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="width:40px;height:1px;background:#A8624A;"></td>
                  <td style="height:1px;background:#E8E2D5;"></td>
                </tr>
              </table>

              <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#2D2B2A;line-height:1.4;letter-spacing:0.2px;">
                <?= htmlspecialchars($postTitle, ENT_QUOTES) ?>
              </h1>
              <p style="margin:0 0 30px;color:#57534e;font-family:Georgia,serif;font-size:15px;line-height:1.8;">
                <?= nl2br(htmlspecialchars($excerpt, ENT_QUOTES)) ?>
              </p>
              <a href="<?= htmlspecialchars($postUrl, ENT_QUOTES) ?>"
                 style="display:inline-block;background:#A8624A;color:#F7F5F0;text-decoration:none;padding:12px 28px;border-radius:4px;font-family:sans-serif;font-size:13px;font-weight:500;letter-spacing:0.3px;">
                <?= htmlspecialchars($t['read_article'], ENT_QUOTES) ?>
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F7F5F0;border-radius:0 0 8px 8px;padding:18px 40px 26px;border-top:1px solid #E8E2D5;">
              <p style="margin:0;color:#8A857E;font-family:sans-serif;font-size:11px;line-height:1.6;">
                <?= htmlspecialchars(sprintf($t['subscribed_to'], $blogName), ENT_QUOTES) ?><br>
                <a href="<?= htmlspecialchars($unsubscribeUrl, ENT_QUOTES) ?>"
                   style="color:#A8624A;text-decoration:underline;">
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
