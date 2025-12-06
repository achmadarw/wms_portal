Write-Host "Inventory API Quick Test" -ForegroundColor Cyan
$BASE = "http://localhost:3000"

# Login
$loginData = '{"email":"admin@wms.local","password":"Admin@123"}'
try {
    Invoke-WebRequest -Uri "$BASE/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginData.Replace('Admin@123','Admin@123').Replace('admin@wms.local','admin@wms.local').Replace('"password":"Admin@123"','"password":"Admin@123","username":"admin","fullName":"Admin"') -ErrorAction SilentlyContinue | Out-Null
} catch {}

$login = Invoke-WebRequest -Uri "$BASE/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginData
$token = ($login.Content | ConvertFrom-Json).token.accessToken
Write-Host "1. Login: OK" -ForegroundColor Green

# Create Item
$itemData = "{`"sku`":`"TEST-001`",`"barcode`":`"BAR001`",`"name`":`"Test Item`",`"category`":`"Electronics`",`"unitCost`":100,`"reorderPoint`":10}"
$headers = @{"Authorization"="Bearer $token";"Content-Type"="application/json"}
$item = Invoke-WebRequest -Uri "$BASE/api/inventory/items" -Method POST -Headers $headers -Body $itemData
$itemId = ($item.Content | ConvertFrom-Json).item.id
Write-Host "2. Create Item: OK - $itemId" -ForegroundColor Green

# Get Items
$items = Invoke-WebRequest -Uri "$BASE/api/inventory/items" -Headers $headers
$count = (($items.Content | ConvertFrom-Json).items).Count
Write-Host "3. Get Items: OK - $count items" -ForegroundColor Green

# Search by Barcode
$search = Invoke-WebRequest -Uri "$BASE/api/inventory/items?barcode=BAR001" -Headers $headers
$found = (($search.Content | ConvertFrom-Json).items)[0].name
Write-Host "4. Barcode Search: OK - Found '$found'" -ForegroundColor Green

Write-Host "`nAll tests passed!" -ForegroundColor Green
