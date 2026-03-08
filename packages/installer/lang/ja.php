<?php

declare(strict_types=1);

/**
 * Corexpress Installer — Japanese strings.
 */
return [
    // Generic
    'back'                 => '← 戻る',
    'continue'             => '続ける',
    'optional'             => '任意',
    'errors.fix_following' => '以下の問題を修正してください：',

    // Welcome step
    'welcome.title'        => 'へようこそ',
    'welcome.sub'          => '最高の自動ブログインストーラー。',
    'welcome.get_started'  => '始める',
    'welcome.fix_issues'   => '続ける前に上の重大な問題を修正してください。',
    'welcome.badge_ok'     => 'すべて準備完了',
    'welcome.badge_warn'   => '要件を確認',

    // Requirements
    'req.php_version'       => 'PHPバージョン',
    'req.pdo'               => 'PDO',
    'req.pdo_mysql'         => 'PDO MySQL',
    'req.mbstring'          => 'マルチバイト文字列',
    'req.json'              => 'JSON',
    'req.session'           => 'セッション',
    'req.openssl'           => 'OpenSSL',
    'req.mod_rewrite'       => 'Apache mod_rewrite',
    'req.write_public'      => '書き込み権限: アプリルート (/var/www/html)',
    'req.ext_loaded'        => '拡張機能が読み込まれています',
    'req.ext_missing'       => "拡張機能 '{ext}' が利用できません",
    'req.php_ok'            => 'PHP {current} を検出しました',
    'req.php_fail'          => 'PHP {required}+ が必要ですが、{current} が見つかりました',
    'req.rewrite_ok'        => 'mod_rewrite が有効です',
    'req.rewrite_fail'      => 'Apache で mod_rewrite を有効にする必要があります',
    'req.writable_ok'       => 'ディレクトリに書き込み権限があります',
    'req.writable_warn'     => '書き込み権限がない可能性があります — インストール時に確認されます',

    // Database step
    'db.title'              => 'データベースの設定',
    'db.sub'                => 'ホスティングプロバイダーから提供されたMySQLの認証情報を入力してください。',
    'db.host'               => 'データベースホスト',
    'db.port'               => 'ポート',
    'db.name'               => 'データベース名',
    'db.user'               => 'ユーザー名',
    'db.password'           => 'パスワード',
    'db.test_btn'           => '接続をテスト',
    'db.testing'            => 'テスト中…',
    'db.test_ok'            => '✓ 接続成功',
    'db.test_fail'          => '✗ {error}',

    // Database validation errors
    'errors.db_host_required' => 'データベースホストは必須です。',
    'errors.db_name_required' => 'データベース名は必須です。',
    'errors.db_user_required' => 'データベースユーザーは必須です。',
    'errors.db_port_invalid'  => '無効なポート番号です。',
    'errors.db_connect_fail'  => '接続に失敗しました。',

    // Admin step
    'admin.title'           => '管理者アカウント',
    'admin.sub'             => 'ブログの管理者アカウントを作成してください。',
    'admin.email'           => 'メールアドレス',
    'admin.password'        => 'パスワード',
    'admin.password_hint'   => '最低8文字',
    'admin.confirm'         => 'パスワードの確認',

    // Admin validation errors
    'errors.email_invalid'     => '有効なメールアドレスが必要です。',
    'errors.password_short'    => 'パスワードは8文字以上必要です。',
    'errors.password_mismatch' => 'パスワードが一致しません。',

    // Settings step
    'settings.title'         => 'ブログ設定',
    'settings.sub'           => 'ブログをカスタマイズしてください。後で設定を変更できます。',
    'settings.blog_name'     => 'ブログ名',
    'settings.description'   => '説明',
    'settings.theme'         => 'インストーラーテーマ',
    'settings.theme_hint'    => 'ダッシュボードのスタイル',
    'settings.language'      => 'アプリの言語',
    'settings.language_hint' => 'ブログの訪問者に表示される言語',

    // Settings validation errors
    'errors.name_required'   => 'ブログ名は必須です。',
    'errors.name_too_long'   => 'ブログ名は100文字以下にしてください。',

    // Review step
    'review.title'           => 'インストールの準備完了',
    'review.sub'             => '設定を確認してから <strong>Corexpressをインストール</strong> をクリックしてください。',
    'review.database'        => 'データベース',
    'review.host'            => 'ホスト',
    'review.db_name'         => 'データベース',
    'review.db_user'         => 'ユーザー',
    'review.admin'           => '管理者アカウント',
    'review.email'           => 'メール',
    'review.password'        => 'パスワード',
    'review.blog'            => 'ブログ',
    'review.name'            => '名前',
    'review.description_lbl' => '説明',
    'review.theme_lbl'       => 'テーマ',
    'review.language_lbl'    => '言語',
    'review.install_btn'     => 'Corexpressをインストール',
    'review.working'         => 'ブログを準備中…',
    'review.working_sub'     => '数秒かかる場合があります。',
    'review.done'            => '完了！Corexpressがインストールされました。',
    'review.done_sub'        => 'ブログの設定を続けるためにサインインしてください。',
    'review.go_admin'        => '管理設定へ →',
    'review.install_failed'  => 'インストール失敗: ',
    'review.request_failed'  => 'リクエスト失敗: ',

    // Already installed
    'installed.title'  => 'インストール済み',
    'installed.sub'    => 'Corexpressはすでにこのサーバーに設定されています。',
    'installed.hint'   => '再インストールするには、アプリルートから <code>config.php</code> を削除してこのページに戻ってください。',
    'installed.go_btn' => '管理者へ →',

    // Security error
    'security.error' => 'セキュリティエラー',
    'security.csrf'  => 'CSRFトークンが無効または期限切れです。戻って再試行してください。',
    'security.start_over' => '← 最初からやり直す',

    // Session
    'session.expired' => 'セッションが期限切れです。最初からやり直してください。',
];
