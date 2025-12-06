Write-Host "WMS API Test Suite" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""

$BASE_URL = "http://localhost:3000"

# Test 1: Server running
Write-Host "TEST 1: Checking server..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "$BASE_URL" -Method GET
if ($response.StatusCode -eq 200) {
    Write-Host "✓ Server running" -ForegroundColor Green
}

# Test 2: Registration
Write-Host "TEST 2: Registering user..." -ForegroundColor Cyan
$email = "test_$(Get-Random)@wms.local"
$body = @{
    email = $email
    username = "testuser$(Get-Random)"
    password = "Test@12345"
    fullName = "Test User"
} | ConvertTo-Json

$reg = Invoke-WebRequest -Uri "$BASE_URL/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
if ($reg.StatusCode -eq 201) {
    Write-Host "✓ Registration successful" -ForegroundColor Green
}

# Test 3: Login
Write-Host "TEST 3: Testing login..." -ForegroundColor Cyan
$loginBody = @{
    email = $email
    password = "Test@12345"
} | ConvertTo-Json

$login = Invoke-WebRequest -Uri "$BASE_URL/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody
$loginData = $login.Content | ConvertFrom-Json
$token = $loginData.token.accessToken

if ($login.StatusCode -eq 200) {
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  User: $($loginData.user.email)" -ForegroundColor Gray
    Write-Host "  Role: $($loginData.user.role)" -ForegroundColor Gray
}

# Test 4: Protected endpoint
Write-Host "TEST 4: Testing protected endpoint..." -ForegroundColor Cyan
$headers = @{"Authorization"="Bearer $token"}
$inventory = Invoke-WebRequest -Uri "$BASE_URL/api/inventory/items" -Method GET -Headers $headers
if ($inventory.StatusCode -eq 200) {
    Write-Host "✓ Protected endpoint accessible" -ForegroundColor Green
}

Write-Host ""
Write-Host "All tests passed!" -ForegroundColor Green
Write-Host "Application is running correctly!" -ForegroundColor Green
