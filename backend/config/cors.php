<?php

// docs/desain-v2.md B11. Same-origin in production, so no origins are allowed by default.
// For local development with a different origin, set CORS_ALLOWED_ORIGINS in backend/.env (comma separated).
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_filter(explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
