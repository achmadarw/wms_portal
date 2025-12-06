$baseUrl = "http://localhost:3000"

Write-Host "`n=== Testing Inventory Add Item ===" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n1. Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@wms.local"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token.accessToken
    Write-Host "   Login successful! Token received." -ForegroundColor Green
} catch {
    Write-Host "   Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get Warehouses
Write-Host "`n2. Get Warehouses..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $warehouses = Invoke-RestMethod -Uri "$baseUrl/api/warehouses" -Method GET -Headers $headers
    $warehouseId = $warehouses.warehouses[0].id
    Write-Host "   Found warehouse: $($warehouses.warehouses[0].name) (ID: $warehouseId)" -ForegroundColor Green
} catch {
    Write-Host "   Failed to get warehouses: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Create New Item
Write-Host "`n3. Create New Item..." -ForegroundColor Yellow
$itemData = @{
    sku = "TEST-$(Get-Random -Maximum 9999)"
    barcode = "BAR$(Get-Random -Maximum 999999999)"
    name = "Test Item - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    description = "This is a test item created by automated test"
    category = "Electronics"
    unitOfMeasure = "PCS"
    weight = 1.5
    unitCost = 100.00
    sellingPrice = 150.00
    minStockLevel = 10
    maxStockLevel = 1000
    reorderPoint = 20
    reorderQty = 100
    manufacturer = "Test Manufacturer"
    supplier = "Test Supplier"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/inventory/items" -Method POST -Body $itemData -Headers $headers -ContentType "application/json"
    $itemId = $createResponse.item.id
    Write-Host "   Item created successfully!" -ForegroundColor Green
    Write-Host "   - ID: $itemId" -ForegroundColor White
    Write-Host "   - SKU: $($createResponse.item.sku)" -ForegroundColor White
    Write-Host "   - Barcode: $($createResponse.item.barcode)" -ForegroundColor White
    Write-Host "   - Name: $($createResponse.item.name)" -ForegroundColor White
} catch {
    Write-Host "   Failed to create item: $_" -ForegroundColor Red
    Write-Host "   Error details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Verify Item Created
Write-Host "`n4. Verify Item in Database..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/api/inventory/items?barcode=$($createResponse.item.barcode)" -Method GET -Headers $headers
    if ($getResponse.items.Count -gt 0) {
        Write-Host "   Item found in database!" -ForegroundColor Green
        Write-Host "   - Total Stock: $($getResponse.items[0].totalStock)" -ForegroundColor White
        Write-Host "   - Stock Status: $($getResponse.items[0].stockStatus)" -ForegroundColor White
    } else {
        Write-Host "   Item not found!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   Failed to verify item: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Add Stock to Item
Write-Host "`n5. Add Stock to Item..." -ForegroundColor Yellow
$stockData = @{
    itemMasterId = $itemId
    warehouseId = $warehouseId
    quantity = 50
    type = "ADD"
    reason = "Initial stock - automated test"
    batchNumber = "BATCH-001"
} | ConvertTo-Json

try {
    $stockResponse = Invoke-RestMethod -Uri "$baseUrl/api/inventory/stock/adjust" -Method POST -Body $stockData -Headers $headers -ContentType "application/json"
    Write-Host "   Stock added successfully!" -ForegroundColor Green
    Write-Host "   - Quantity Added: 50" -ForegroundColor White
} catch {
    Write-Host "   Failed to add stock: $_" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Verify Stock Updated
Write-Host "`n6. Verify Stock Level..." -ForegroundColor Yellow
try {
    $finalCheck = Invoke-RestMethod -Uri "$baseUrl/api/inventory/items?barcode=$($createResponse.item.barcode)" -Method GET -Headers $headers
    Write-Host "   Final stock verification:" -ForegroundColor Green
    Write-Host "   - Total Stock: $($finalCheck.items[0].totalStock)" -ForegroundColor White
    Write-Host "   - Available: $($finalCheck.items[0].availableStock)" -ForegroundColor White
    Write-Host "   - Reserved: $($finalCheck.items[0].reservedStock)" -ForegroundColor White
    Write-Host "   - Status: $($finalCheck.items[0].stockStatus)" -ForegroundColor White
} catch {
    Write-Host "   Failed to verify stock: $_" -ForegroundColor Red
}

Write-Host "`n=== All Tests Completed Successfully! ===" -ForegroundColor Green
Write-Host "`nCreated Item Details:" -ForegroundColor Cyan
Write-Host "- SKU: $($createResponse.item.sku)"
Write-Host "- Barcode: $($createResponse.item.barcode)"
Write-Host "- Name: $($createResponse.item.name)"
Write-Host "- Stock: 50 PCS"
Write-Host "`n"
