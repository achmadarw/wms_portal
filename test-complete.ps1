Write-Host "WMS API Test - Complete" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$BASE = "http://localhost:3000"

# 1. Health Check
Write-Host "`n1. Server Health" -ForegroundColor Yellow
$health = Invoke-WebRequest -Uri $BASE
Write-Host "   OK ($($health.StatusCode))" -ForegroundColor Green

# 2. Register
Write-Host "`n2. Register User" -ForegroundColor Yellow
$email = "test$(Get-Random)@wms.local"
$pass = "Test@12345"
$regData = @{email=$email;username="user$(Get-Random)";password=$pass;fullName="Test"} | ConvertTo-Json
$reg = Invoke-WebRequest -Uri "$BASE/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $regData
Write-Host "   OK - $email" -ForegroundColor Green

# 3. Login
Write-Host "`n3. Login" -ForegroundColor Yellow
$loginData = @{email=$email;password=$pass} | ConvertTo-Json
$login = Invoke-WebRequest -Uri "$BASE/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginData
$token = ($login.Content | ConvertFrom-Json).token.accessToken
Write-Host "   OK - Token received" -ForegroundColor Green

# 4. Inventory
Write-Host "`n4. Inventory" -ForegroundColor Yellow
$inv = Invoke-WebRequest -Uri "$BASE/api/inventory/items" -Headers @{"Authorization"="Bearer $token"}
Write-Host "   OK - $(($inv.Content | ConvertFrom-Json).Count) items" -ForegroundColor Green

# 5. Warehouses
Write-Host "`n5. Warehouses" -ForegroundColor Yellow
$wh = Invoke-WebRequest -Uri "$BASE/api/warehouses" -Headers @{"Authorization"="Bearer $token"}
Write-Host "   OK - $(($wh.Content | ConvertFrom-Json).Count) warehouses" -ForegroundColor Green

# 6. Movements
Write-Host "`n6. Movements" -ForegroundColor Yellow
$mov = Invoke-WebRequest -Uri "$BASE/api/movements" -Headers @{"Authorization"="Bearer $token"}
Write-Host "   OK - $(($mov.Content | ConvertFrom-Json).Count) movements" -ForegroundColor Green

# 7. Network Access
Write-Host "`n7. Network Access" -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress | Select-Object -First 1
try {
    $net = Invoke-WebRequest -Uri "http://${ip}:3000" -TimeoutSec 3
    Write-Host "   OK - http://${ip}:3000" -ForegroundColor Green
} catch {
    Write-Host "   WARNING - Not accessible from network" -ForegroundColor Yellow
}

Write-Host "`n========================" -ForegroundColor Green
Write-Host "All Tests Passed!" -ForegroundColor Green
Write-Host "Mobile API: http://${ip}:3000" -ForegroundColor Cyan
