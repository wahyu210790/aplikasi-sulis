<?php
return [
    // Paths that should be reachable via CORS.
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Allowed HTTP methods.
    'allowed_methods' => ['*'],

    // Explicitly allow the frontend origin.
    'allowed_origins' => ['http://127.0.0.1:8080'],

    // No regex patterns needed.
    'allowed_origins_patterns' => [],

    // Allow any request headers.
    'allowed_headers' => ['*'],

    // No special exposed headers.
    'exposed_headers' => [],

    // Max age for pre‑flight cache.
    'max_age' => 0,

    // Important: allow credentials (cookies, Authorization header).
    'supports_credentials' => true,
];
