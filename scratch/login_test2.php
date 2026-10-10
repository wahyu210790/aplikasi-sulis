<?php
// Test login against Laravel dev server (port 8000)
$url = 'http://127.0.0.1:8000/api/v1/auth/login';
$data = ['email'=>'owner@example.com','password'=>'password'];
$payload = json_encode($data);
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if (curl_errno($ch)) {
    echo 'Curl error: '.curl_error($ch)."\n";
}
curl_close($ch);

echo "Status: $httpCode\n";
echo "Response: $response\n";
?>
