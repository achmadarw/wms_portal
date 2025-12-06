Write-Host "=== Testing Email Sending ===" -ForegroundColor Cyan
Write-Host ""
$baseUrl = "http://localhost:3000"
Write-Host "Step 1: Login..." -ForegroundColor Yellow
try {
    $loginBody = @{ email = "root@wms.com"; password = "kutukupret" } | ConvertTo-Json
    $loginResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $loginResp.token.accessToken
    Write-Host "  Login successful" -ForegroundColor Green
} catch { Write-Host "  Login failed: $_" -ForegroundColor Red; exit 1 }
Write-Host ""
Write-Host "Step 2: Creating user..." -ForegroundColor Yellow
$testEmail = "raybiwo6@gmail.com"
$newUser = @{ fullName = "Email Test User"; email = $testEmail; password = "Test@123456"; role = "OPERATOR"; phone = "+628123456789" } | ConvertTo-Json
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
try {
    $createResp = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method POST -Headers $headers -Body $newUser
    Write-Host "  User created!" -ForegroundColor Green
    Write-Host "  Email sent to: $testEmail" -ForegroundColor Yellow
    Write-Host "  Check your inbox!" -ForegroundColor Cyan
} catch { Write-Host "  Failed: $_" -ForegroundColor Red; exit 1 }
Write-Host "Test complete!" -ForegroundColor Green
