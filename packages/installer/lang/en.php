<?php

declare(strict_types=1);

/**
 * Corexpress Installer — English strings.
 * Keys use dot-notation converted to underscores for PHP array keys.
 */
return [
    // Generic
    'back'                 => '← Back',
    'continue'             => 'Continue',
    'optional'             => 'optional',
    'errors.fix_following' => 'Please fix the following:',

    // Welcome step
    'welcome.title'        => 'Welcome to',
    'welcome.sub'          => 'The best automated blog installer.',
    'welcome.get_started'  => 'Get Started',
    'welcome.fix_issues'   => 'Fix the critical issues above before continuing.',
    'welcome.badge_ok'     => 'All systems ready',
    'welcome.badge_warn'   => 'Review requirements',

    // Requirements
    'req.php_version'       => 'PHP Version',
    'req.pdo'               => 'PDO',
    'req.pdo_mysql'         => 'PDO MySQL',
    'req.mbstring'          => 'Multibyte String',
    'req.json'              => 'JSON',
    'req.session'           => 'Sessions',
    'req.openssl'           => 'OpenSSL',
    'req.mod_rewrite'       => 'Apache mod_rewrite',
    'req.write_public'      => 'Write permission: App root (/var/www/html)',
    'req.ext_loaded'        => 'Extension loaded',
    'req.ext_missing'       => "Extension '{ext}' is not available",
    'req.php_ok'            => 'PHP {current} detected',
    'req.php_fail'          => 'PHP {required}+ required, {current} found',
    'req.rewrite_ok'        => 'mod_rewrite is enabled',
    'req.rewrite_fail'      => 'mod_rewrite must be enabled in Apache',
    'req.writable_ok'       => 'Directory is writable',
    'req.writable_warn'     => 'May not be writable — will be verified at install time',

    // Database step
    'db.title'              => 'Database Configuration',
    'db.sub'                => 'Enter the MySQL credentials provided by your hosting provider.',
    'db.host'               => 'Database Host',
    'db.port'               => 'Port',
    'db.name'               => 'Database Name',
    'db.user'               => 'Username',
    'db.password'           => 'Password',
    'db.test_btn'           => 'Test Connection',
    'db.testing'            => 'Testing…',
    'db.test_ok'            => '✓ Connection successful',
    'db.test_fail'          => '✗ {error}',

    // Database validation errors
    'errors.db_host_required' => 'Database host is required.',
    'errors.db_name_required' => 'Database name is required.',
    'errors.db_user_required' => 'Database user is required.',
    'errors.db_port_invalid'  => 'Invalid port number.',
    'errors.db_connect_fail'  => 'Connection failed.',

    // Admin step
    'admin.title'           => 'Admin Account',
    'admin.sub'             => 'Create the administrator account for your blog.',
    'admin.email'           => 'Email Address',
    'admin.password'        => 'Password',
    'admin.password_hint'   => 'minimum 8 characters',
    'admin.confirm'         => 'Confirm Password',

    // Admin validation errors
    'errors.email_invalid'     => 'A valid email address is required.',
    'errors.password_short'    => 'Password must be at least 8 characters.',
    'errors.password_mismatch' => 'Passwords do not match.',

    // Settings step
    'settings.title'         => 'Blog Settings',
    'settings.sub'           => 'Personalize your blog. You can change these settings later.',
    'settings.blog_name'     => 'Blog Name',
    'settings.description'   => 'Description',
    'settings.theme'         => 'Installer Theme',
    'settings.theme_hint'    => 'dashboard style',
    'settings.language'      => 'App Language',
    'settings.language_hint' => 'Language shown to blog visitors',

    // Settings validation errors
    'errors.name_required'   => 'Blog name is required.',
    'errors.name_too_long'   => 'Blog name must be 100 characters or less.',

    // Review step
    'review.title'           => 'Ready to Install',
    'review.sub'             => 'Review your settings, then click <strong>Install Corexpress</strong>.',
    'review.database'        => 'Database',
    'review.host'            => 'Host',
    'review.db_name'         => 'Database',
    'review.db_user'         => 'User',
    'review.admin'           => 'Admin Account',
    'review.email'           => 'Email',
    'review.password'        => 'Password',
    'review.blog'            => 'Blog',
    'review.name'            => 'Name',
    'review.description_lbl' => 'Description',
    'review.theme_lbl'       => 'Theme',
    'review.language_lbl'    => 'Language',
    'review.install_btn'     => 'Install Corexpress',
    'review.working'         => 'Working on your blog…',
    'review.working_sub'     => 'This may take a few seconds.',
    'review.done'            => 'All done! Corexpress is installed.',
    'review.done_sub'        => 'Sign in to continue with your blog setup.',
    'review.go_admin'        => 'Go to Admin Setup →',
    'review.install_failed'  => 'Installation failed: ',
    'review.request_failed'  => 'Request failed: ',

    // Already installed
    'installed.title'  => 'Already Installed',
    'installed.sub'    => 'Corexpress is already configured on this server.',
    'installed.hint'   => 'To reinstall, remove <code>config.php</code> from the app root and return to this page.',
    'installed.go_btn' => 'Go to Admin →',

    // Security error
    'security.error' => 'Security error',
    'security.csrf'  => 'Invalid or expired CSRF token. Please go back and try again.',
    'security.start_over' => '← Start Over',

    // Session
    'session.expired' => 'Session expired. Please start over.',
];
