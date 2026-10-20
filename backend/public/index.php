<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
// When routed from a monorepo parent directory (e.g. /backend/public/index.php),
// normalize SCRIPT_NAME / PHP_SELF to '/index.php' so Symfony Request resolves
// the full pathinfo (/api/v1/...) instead of stripping it as a baseUrl prefix.
if (isset($_SERVER['SCRIPT_NAME'], $_SERVER['REQUEST_URI'])
    && str_ends_with(str_replace('\\', '/', $_SERVER['SCRIPT_NAME']), '/backend/public/index.php')
    && !str_starts_with($_SERVER['REQUEST_URI'], '/backend/public/')
) {
    $_SERVER['SCRIPT_NAME'] = '/index.php';
    $_SERVER['PHP_SELF'] = '/index.php';
}

/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
