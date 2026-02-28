<?php

declare(strict_types=1);

namespace Corexpress\Bootstrap;

use Illuminate\Container\Container;
use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Events\Dispatcher;
use RuntimeException;

final class Database
{
    /**
     * Boot the Eloquent ORM using config.php from the app root.
     *
     * @throws RuntimeException if config.php is missing or the connection cannot be established
     */
    public static function boot(): void
    {
        // config.php lives two directories above src/Bootstrap/ → packages/app/config.php
        $configPath = dirname(__DIR__, 2) . '/config.php';

        if (!file_exists($configPath)) {
            throw new RuntimeException('config.php not found. Run the installer at /setup first.');
        }

        /** @var array{db: array{host: string, port: int, name: string, user: string, password: string}} $config */
        $config = require $configPath;

        $capsule = new Capsule();
        $capsule->addConnection([
            'driver'    => 'mysql',
            'host'      => $config['db']['host'],
            'port'      => (int) $config['db']['port'],
            'database'  => $config['db']['name'],
            'username'  => $config['db']['user'],
            'password'  => $config['db']['password'],
            'charset'   => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix'    => '',
            'strict'    => true,
            'engine'    => 'InnoDB',
        ]);

        // Wire the event dispatcher so model observers and Eloquent events work
        $capsule->setEventDispatcher(new Dispatcher(new Container()));

        // Make this the global Capsule instance (enables DB:: facade and static calls)
        $capsule->setAsGlobal();

        // Boot Eloquent ORM
        $capsule->bootEloquent();
    }
}
