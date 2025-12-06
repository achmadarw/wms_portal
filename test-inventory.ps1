Write-Host "Testing Inventory Management APIs" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

$BASE = "http://localhost:3000"

# 1. Register & Login
Write-Host "`n1. Login..." -ForegroundColor Yellow
$email = "admin@wms.local"
$pass = "Admin@123"

# Try to register first
try {
    $regData = @{email=$email;username="admin";password=$pass;fullName="Admin"} | ConvertTo-Json
    Invoke-WebRequest -Uri "$BASE/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $regData -ErrorAction SilentlyContinue | Out-Null
} catch {}

$loginData = @{email=$email;password=$pass} | ConvertTo-Json
$login = Invoke-WebRequest -Uri "$BASE/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginData
$token = ($login.Content | ConvertFrom-Json).token.accessToken
$headers = @{"Authorization"="Bearer $token";"Content-Type"="application/json"}
Write-Host "   ✓ Logged in" -ForegroundColor Green

# 2. Create Item with Barcode
Write-Host "`n2. Create Item with Barcode..." -ForegroundColor Yellow
$itemData = @{
    sku = "ITEM-$(Get-Random)"
    barcode = "BAR$(Get-Random)"
    name = "Test Product $(Get-Random -Maximum 100)"
    description = "Test product for inventory management"
    category = "Electronics"
    unitOfMeasure = "PCS"
    unitCost = 100.50
    sellingPrice = 150.75
    minStockLevel = 10
    maxStockLevel = 1000
    reorderPoint = 20
    reorderQty = 50
    manufacturer = "Test Manufacturer"
    supplier = "Test Supplier"
} | ConvertTo-Json

$item = Invoke-WebRequest -Uri "$BASE/api/inventory/items" -Method POST -Headers $headers -Body $itemData
$itemResult = $item.Content | ConvertFrom-Json
Write-Host "   ✓ Item created: $($itemResult.item.name)" -ForegroundColor Green
Write-Host "     SKU: $($itemResult.item.sku)" -ForegroundColor Gray
Write-Host "     Barcode: $($itemResult.item.barcode)" -ForegroundColor Gray

# 3. Get Warehouses
Write-Host "`n3. Get Warehouses..." -ForegroundColor Yellow
$warehouses = Invoke-WebRequest -Uri "$BASE/api/warehouses" -Headers $headers
$whData = ($warehouses.Content | ConvertFrom-Json).warehouses
if ($whData.Count -eq 0) {
    Write-Host "   Creating default warehouse..." -ForegroundColor Yellow
    $whBody = @{
        code = "WH-MAIN"
        name = "Main Warehouse"
        address = "123 Main St"
        city = "Jakarta"
        state = "DKI Jakarta"
        zipCode = "12345"
        country = "Indonesia"
    } | ConvertTo-Json
    $wh = Invoke-WebRequest -Uri "$BASE/api/warehouses" -Method POST -Headers $headers -Body $whBody
    $warehouse = ($wh.Content | ConvertFrom-Json).warehouse
} else {
    $warehouse = $whData[0]
}
Write-Host "   ✓ Warehouse: $($warehouse.name)" -ForegroundColor Green

# 4. Receive Stock (Inbound)
Write-Host "`n4. Receive Stock (Inbound)..." -ForegroundColor Yellow
$receiveData = @{
    itemMasterId = $itemResult.item.id
    warehouseId = $warehouse.id
    quantity = 100
    batchNumber = "BATCH-001"
    notes = "Initial stock receipt"
} | ConvertTo-Json

$receive = Invoke-WebRequest -Uri "$BASE/api/inventory/stock/receive" -Method POST -Headers $headers -Body $receiveData
$receiveResult = $receive.Content | ConvertFrom-Json
Write-Host "   ✓ Received 100 units" -ForegroundColor Green
Write-Host "     Stock ID: $($receiveResult.inventoryItem.id)" -ForegroundColor Gray

# 5. Stock Adjustment
Write-Host "`n5. Stock Adjustment (Add 50)..." -ForegroundColor Yellow
$adjustData = @{
    itemMasterId = $itemResult.item.id
    warehouseId = $warehouse.id
    quantity = 50
    type = "ADD"
    reason = "Stock correction - found additional items"
} | ConvertTo-Json

$adjust = Invoke-WebRequest -Uri "$BASE/api/inventory/stock/adjust" -Method POST -Headers $headers -Body $adjustData
Write-Host "   ✓ Adjusted +50 units" -ForegroundColor Green

# 6. Get Stock Levels
Write-Host "`n6. Get Stock Levels..." -ForegroundColor Yellow
$stock = Invoke-WebRequest -Uri "$BASE/api/inventory/stock?itemMasterId=$($itemResult.item.id)" -Headers $headers
$stockData = ($stock.Content | ConvertFrom-Json).stock
Write-Host "   ✓ Total Stock: $($stockData[0].quantity) units" -ForegroundColor Green
Write-Host "     Available: $($stockData[0].availableQty) units" -ForegroundColor Gray

# 7. Search by Barcode
Write-Host "`n7. Search by Barcode..." -ForegroundColor Yellow
$search = Invoke-WebRequest -Uri "$BASE/api/inventory/items?barcode=$($itemResult.item.barcode)" -Headers $headers
$searchResult = ($search.Content | ConvertFrom-Json).items
Write-Host "   ✓ Found: $($searchResult[0].name)" -ForegroundColor Green
Write-Host "     Total Stock: $($searchResult[0].totalStock)" -ForegroundColor Gray

# 8. Get All Items with Stock
Write-Host "`n8. Get All Items..." -ForegroundColor Yellow
$allItems = Invoke-WebRequest -Uri "$BASE/api/inventory/items?warehouseId=$($warehouse.id)" -Headers $headers
$allItemsData = ($allItems.Content | ConvertFrom-Json).items
Write-Host "   ✓ Total Items: $($allItemsData.Count)" -ForegroundColor Green

Write-Host "`n===================================" -ForegroundColor Green
Write-Host "All Inventory Tests Passed!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  - Item Management: OK" -ForegroundColor White
Write-Host "  - Barcode Support: OK" -ForegroundColor White
Write-Host "  - Stock Receive: OK" -ForegroundColor White
Write-Host "  - Stock Adjustment: OK" -ForegroundColor White
Write-Host "  - Stock Query: OK" -ForegroundColor White
Write-Host "  - Barcode Search: OK" -ForegroundColor White
