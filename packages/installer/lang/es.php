<?php

declare(strict_types=1);

/**
 * Corexpress Installer — Spanish strings.
 */
return [
    // Generic
    'back'                 => '← Atrás',
    'continue'             => 'Continuar',
    'optional'             => 'opcional',
    'errors.fix_following' => 'Por favor corrige lo siguiente:',

    // Welcome step
    'welcome.title'        => 'Bienvenido a',
    'welcome.sub'          => 'El mejor instalador automático de blogs.',
    'welcome.get_started'  => 'Comenzar',
    'welcome.fix_issues'   => 'Soluciona los problemas críticos anteriores antes de continuar.',
    'welcome.badge_ok'     => 'Todo listo',
    'welcome.badge_warn'   => 'Revisar requisitos',

    // Requirements
    'req.php_version'       => 'Versión de PHP',
    'req.pdo'               => 'PDO',
    'req.pdo_mysql'         => 'PDO MySQL',
    'req.mbstring'          => 'Multibyte String',
    'req.json'              => 'JSON',
    'req.session'           => 'Sesiones',
    'req.openssl'           => 'OpenSSL',
    'req.mod_rewrite'       => 'Apache mod_rewrite',
    'req.write_public'      => 'Permiso de escritura: raíz de la app (/var/www/html)',
    'req.ext_loaded'        => 'Extensión cargada',
    'req.ext_missing'       => "La extensión '{ext}' no está disponible",
    'req.php_ok'            => 'PHP {current} detectado',
    'req.php_fail'          => 'Se requiere PHP {required}+, se encontró {current}',
    'req.rewrite_ok'        => 'mod_rewrite está habilitado',
    'req.rewrite_fail'      => 'mod_rewrite debe estar habilitado en Apache',
    'req.writable_ok'       => 'El directorio tiene permisos de escritura',
    'req.writable_warn'     => 'Puede no tener permisos de escritura — se verificará al instalar',

    // Database step
    'db.title'              => 'Configuración de la base de datos',
    'db.sub'                => 'Ingresa las credenciales de MySQL proporcionadas por tu hosting.',
    'db.host'               => 'Host de la base de datos',
    'db.port'               => 'Puerto',
    'db.name'               => 'Nombre de la base de datos',
    'db.user'               => 'Usuario',
    'db.password'           => 'Contraseña',
    'db.test_btn'           => 'Probar conexión',
    'db.testing'            => 'Probando…',
    'db.test_ok'            => '✓ Conexión exitosa',
    'db.test_fail'          => '✗ {error}',

    // Database validation errors
    'errors.db_host_required' => 'El host de la base de datos es obligatorio.',
    'errors.db_name_required' => 'El nombre de la base de datos es obligatorio.',
    'errors.db_user_required' => 'El usuario de la base de datos es obligatorio.',
    'errors.db_port_invalid'  => 'Número de puerto inválido.',
    'errors.db_connect_fail'  => 'No se pudo conectar.',

    // Admin step
    'admin.title'           => 'Cuenta de administrador',
    'admin.sub'             => 'Crea la cuenta de administrador para tu blog.',
    'admin.email'           => 'Correo electrónico',
    'admin.password'        => 'Contraseña',
    'admin.password_hint'   => 'mínimo 8 caracteres',
    'admin.confirm'         => 'Confirmar contraseña',

    // Admin validation errors
    'errors.email_invalid'     => 'Se requiere una dirección de correo válida.',
    'errors.password_short'    => 'La contraseña debe tener al menos 8 caracteres.',
    'errors.password_mismatch' => 'Las contraseñas no coinciden.',

    // Settings step
    'settings.title'         => 'Configuración del blog',
    'settings.sub'           => 'Personaliza tu blog. Puedes cambiar estos ajustes después.',
    'settings.blog_name'     => 'Nombre del blog',
    'settings.description'   => 'Descripción',
    'settings.theme'         => 'Tema del instalador',
    'settings.theme_hint'    => 'estilo del dashboard',
    'settings.language'      => 'Idioma de la app',
    'settings.language_hint' => 'Idioma que verán los visitantes del blog',

    // Settings validation errors
    'errors.name_required'   => 'El nombre del blog es obligatorio.',
    'errors.name_too_long'   => 'El nombre del blog debe tener 100 caracteres o menos.',

    // Review step
    'review.title'           => 'Listo para instalar',
    'review.sub'             => 'Revisa tu configuración y haz clic en <strong>Instalar Corexpress</strong>.',
    'review.database'        => 'Base de datos',
    'review.host'            => 'Host',
    'review.db_name'         => 'Base de datos',
    'review.db_user'         => 'Usuario',
    'review.admin'           => 'Cuenta de administrador',
    'review.email'           => 'Correo',
    'review.password'        => 'Contraseña',
    'review.blog'            => 'Blog',
    'review.name'            => 'Nombre',
    'review.description_lbl' => 'Descripción',
    'review.theme_lbl'       => 'Tema',
    'review.language_lbl'    => 'Idioma',
    'review.install_btn'     => 'Instalar Corexpress',
    'review.working'         => 'Preparando tu blog…',
    'review.working_sub'     => 'Esto puede tardar unos segundos.',
    'review.done'            => '¡Todo listo! Corexpress está instalado.',
    'review.done_sub'        => 'Inicia sesión para continuar con la configuración de tu blog.',
    'review.go_admin'        => 'Ir a la configuración de administración →',
    'review.install_failed'  => 'Error en la instalación: ',
    'review.request_failed'  => 'Error en la solicitud: ',

    // Already installed
    'installed.title'  => 'Ya instalado',
    'installed.sub'    => 'Corexpress ya está configurado en este servidor.',
    'installed.hint'   => 'Para reinstalar, elimina <code>config.php</code> de la raíz de la app y vuelve a esta página.',
    'installed.go_btn' => 'Ir al admin →',

    // Security error
    'security.error' => 'Error de seguridad',
    'security.csrf'  => 'Token CSRF inválido o expirado. Regresa e intenta de nuevo.',
    'security.start_over' => '← Volver al inicio',

    // Session
    'session.expired' => 'Sesión expirada. Por favor, empieza de nuevo.',
];
