<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_up_endpoint_returns_200(): void
    {
        $this->get('/up')->assertStatus(200);
    }
}
