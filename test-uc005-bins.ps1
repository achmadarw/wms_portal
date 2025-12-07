# ============================================================================
# UC-005: Create Storage Bins/Locations - Automated Test Suite
# ============================================================================
# Purpose: Test bin creation, validation, RBAC, and business rules
# Status: Ready for execution
# Requirements: Dev server running on http://localhost:3000
# ============================================================================

# Configuration
$baseUrl = "http://localhost:3000"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

# Test results tracking
$testsPassed = 0
$testsFailed = 0
$testsTotal = 0

# ============================================================================
# Helper Functions
# ============================================================================

function Write-Success {
    param([string]$message)
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

function Write-Info {
    param([string]$message)
    Write-Host "[INFO] $message" -ForegroundColor Cyan
}

function Write-Test {
    param([string]$message)
    Write-Host "`n[TEST] $message" -ForegroundColor Yellow
}

function Test-Result {
    param(
        [string]$testName,
        [bool]$condition,
        [string]$successMessage,
        [string]$errorMessage
    )
    
    $script:testsTotal++
    
    if ($condition) {
        $script:testsPassed++
        Write-Success "$testName - $successMessage"
        return $true
    } else {
        $script:testsFailed++
        Write-Error-Custom "$testName - $errorMessage"
        return $false
    }
}

# ============================================================================
# Setup Test Environment
# ============================================================================

Write-Info "Setting up test environment..."
Write-Info "Base URL: $baseUrl"
Write-Info "Timestamp: $timestamp"

# Test users
$adminEmail = "admin-uc005-$timestamp@wms.local"
$supervisorEmail = "supervisor-uc005-$timestamp@wms.local"
$operatorEmail = "operator-uc005-$timestamp@wms.local"

$adminToken = $null
$supervisorToken = $null
$operatorToken = $null

$warehouseId1 = $null
$warehouseId2 = $null

# ============================================================================
# Test 0: Create Test Users
# ============================================================================

Write-Test "Creating test users (Admin, Supervisor, Operator)"

# Create Admin user
try {
    $adminData = @{
        email = $adminEmail
        password = "Admin@123"
        username = "adminuc005$timestamp"
        fullName = "Admin UC-005 Test"
        role = "ADMIN"
    } | ConvertTo-Json
    
    Write-Info "Creating admin user: $adminEmail"
    $adminResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
        -Method POST `
        -Body $adminData `
        -ContentType "application/json"
    
    if ($adminResult.success -and $adminResult.token) {
        $adminToken = $adminResult.token
        Write-Success "Admin user created successfully"
    } else {
        Write-Error-Custom "Failed to create admin user"
        exit 1
    }
} catch {
    Write-Error-Custom "Failed to create admin user"
    Write-Host $_.Exception.Message
    exit 1
}

# Create Supervisor user
try {
    $supervisorData = @{
        email = $supervisorEmail
        password = "Supervisor@123"
        username = "supervisoruc005$timestamp"
        fullName = "Supervisor UC-005 Test"
        role = "SUPERVISOR"
    } | ConvertTo-Json
    
    Write-Info "Creating supervisor user: $supervisorEmail"
    $supervisorResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
        -Method POST `
        -Body $supervisorData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    
    if ($supervisorResult.success -and $supervisorResult.token) {
        $supervisorToken = $supervisorResult.token
        Write-Success "Supervisor user created successfully"
    } else {
        Write-Error-Custom "Failed to create supervisor user"
        exit 1
    }
} catch {
    Write-Error-Custom "Failed to create supervisor user"
    Write-Host $_.Exception.Message
    exit 1
}

# Create Operator user
try {
    $operatorData = @{
        email = $operatorEmail
        password = "Operator@123"
        username = "operatoruc005$timestamp"
        fullName = "Operator UC-005 Test"
        role = "OPERATOR"
    } | ConvertTo-Json
    
    Write-Info "Creating operator user: $operatorEmail"
    $operatorResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
        -Method POST `
        -Body $operatorData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    
    if ($operatorResult.success -and $operatorResult.token) {
        $operatorToken = $operatorResult.token
        Write-Success "Operator user created successfully"
    } else {
        Write-Error-Custom "Failed to create operator user"
        exit 1
    }
} catch {
    Write-Error-Custom "Failed to create operator user"
    Write-Host $_.Exception.Message
    exit 1
}

# ============================================================================
# Test 0b: Create Test Warehouses
# ============================================================================

Write-Test "Creating test warehouses"

# Create Warehouse 1
try {
    $warehouseData1 = @{
        code = "WH-UC005-01-$timestamp"
        name = "UC-005 Test Warehouse 1"
        address = "123 Test Street"
        city = "Jakarta"
        state = "DKI Jakarta"
        zipCode = "12345"
        country = "Indonesia"
    } | ConvertTo-Json
    
    Write-Info "Creating warehouse 1"
    $warehouseResult1 = Invoke-RestMethod -Uri "$baseUrl/api/warehouses" `
        -Method POST `
        -Body $warehouseData1 `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    
    if ($warehouseResult1.success -and $warehouseResult1.warehouse) {
        $warehouseId1 = $warehouseResult1.warehouse.id
        Write-Success "Warehouse 1 created: $warehouseId1"
    } else {
        Write-Error-Custom "Failed to create warehouse 1"
        exit 1
    }
} catch {
    Write-Error-Custom "Failed to create warehouse 1"
    Write-Host $_.Exception.Message
    exit 1
}

# Create Warehouse 2 (for testing same bin code in different warehouses)
try {
    $warehouseData2 = @{
        code = "WH-UC005-02-$timestamp"
        name = "UC-005 Test Warehouse 2"
        address = "456 Test Avenue"
        city = "Surabaya"
        state = "Jawa Timur"
        zipCode = "67890"
        country = "Indonesia"
    } | ConvertTo-Json
    
    Write-Info "Creating warehouse 2"
    $warehouseResult2 = Invoke-RestMethod -Uri "$baseUrl/api/warehouses" `
        -Method POST `
        -Body $warehouseData2 `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    
    if ($warehouseResult2.success -and $warehouseResult2.warehouse) {
        $warehouseId2 = $warehouseResult2.warehouse.id
        Write-Success "Warehouse 2 created: $warehouseId2"
    } else {
        Write-Error-Custom "Failed to create warehouse 2"
        exit 1
    }
} catch {
    Write-Error-Custom "Failed to create warehouse 2"
    Write-Host $_.Exception.Message
    exit 1
}

Write-Success "Test environment setup complete"
Write-Host ""

# ============================================================================
# SECTION 1: Create Bin - Happy Path
# ============================================================================

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "SECTION 1: Create Bin - Happy Path" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Test 1: Create bin with all required fields
Write-Test "Test 1: Create bin with all required fields"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "A-01-01"
        name = "Aisle A, Rack 01, Level 01"
        row = 1
        column = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    $condition = $binResult.success -eq $true -and 
                 $binResult.bin.code -eq "A-01-01" -and
                 $binResult.bin.row -eq 1 -and
                 $binResult.bin.column -eq 1 -and
                 $binResult.bin.level -eq 1 -and
                 $binResult.bin.maxCapacity -eq 100 -and
                 $binResult.bin.currentQty -eq 0 -and
                 $binResult.bin.active -eq $true
    
    Test-Result -testName "Test 1" `
        -condition $condition `
        -successMessage "Bin created with default capacity 100" `
        -errorMessage "Failed to create bin or wrong default values"
} catch {
    Test-Result -testName "Test 1" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Exception: $($_.Exception.Message)"
}

# Test 2: Create bin with custom capacity
Write-Test "Test 2: Create bin with custom maxCapacity"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "A-01-02"
        name = "Aisle A, Rack 01, Level 02"
        row = 1
        column = 1
        level = 2
        maxCapacity = 500
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    $condition = $binResult.success -eq $true -and 
                 $binResult.bin.code -eq "A-01-02" -and
                 $binResult.bin.maxCapacity -eq 500
    
    Test-Result -testName "Test 2" `
        -condition $condition `
        -successMessage "Bin created with custom capacity 500" `
        -errorMessage "Failed to create bin with custom capacity"
} catch {
    Test-Result -testName "Test 2" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Exception: $($_.Exception.Message)"
}

# Test 3: Create bin with different coordinate combinations
Write-Test "Test 3: Create bins with various coordinates"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "B-05-03"
        name = "Aisle B, Rack 05, Level 03"
        row = 5
        column = 10
        level = 3
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    $condition = $binResult.success -eq $true -and 
                 $binResult.bin.row -eq 5 -and
                 $binResult.bin.column -eq 10 -and
                 $binResult.bin.level -eq 3
    
    Test-Result -testName "Test 3" `
        -condition $condition `
        -successMessage "Bin created with coordinates (5, 10, 3)" `
        -errorMessage "Failed to create bin with various coordinates"
} catch {
    Test-Result -testName "Test 3" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Exception: $($_.Exception.Message)"
}

# ============================================================================
# SECTION 2: Validation Tests
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "SECTION 2: Validation Tests" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Test 4: Duplicate bin code in same warehouse
Write-Test "Test 4: Reject duplicate bin code in same warehouse"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "A-01-01"
        name = "Duplicate Bin"
        row = 1
        column = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    Test-Result -testName "Test 4" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Should have rejected duplicate bin code (expected 409)"
} catch {
    $actualMessage = if ($_.ErrorDetails.Message) {
        $content = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($content.error) { $content.error } else { $content.message }
    } else {
        $_.Exception.Message
    }
    
    $condition = $_.Exception.Response.StatusCode -eq 'Conflict' -or
                 $actualMessage -like "*already exists*"
    
    Test-Result -testName "Test 4" `
        -condition $condition `
        -successMessage "Correctly rejected duplicate code (409 Conflict)" `
        -errorMessage "Wrong error: $actualMessage"
}

# Test 5: Same bin code in different warehouses (allowed)
Write-Test "Test 5: Allow same bin code in different warehouses"

try {
    $binData = @{
        warehouseId = $warehouseId2
        code = "A-01-01"
        name = "Aisle A in Warehouse 2"
        row = 1
        column = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    $condition = $binResult.success -eq $true -and 
                 $binResult.bin.code -eq "A-01-01" -and
                 $binResult.bin.warehouseId -eq $warehouseId2
    
    Test-Result -testName "Test 5" `
        -condition $condition `
        -successMessage "Same code allowed in different warehouse" `
        -errorMessage "Failed to create bin with same code in different warehouse"
} catch {
    Test-Result -testName "Test 5" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Exception: $($_.Exception.Message)"
}

# Test 6: Missing warehouseId
Write-Test "Test 6: Reject missing warehouseId"

try {
    $binData = @{
        code = "MISSING-WH"
        name = "Missing Warehouse ID"
        row = 1
        column = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    Test-Result -testName "Test 6" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Should have rejected missing warehouseId (expected 400)"
} catch {
    $actualMessage = if ($_.ErrorDetails.Message) {
        $content = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($content.error) { $content.error } else { $content.message }
    } else {
        $_.Exception.Message
    }
    
    $condition = $_.Exception.Response.StatusCode -eq 'BadRequest' -or
                 $actualMessage -like "*required*"
    
    Test-Result -testName "Test 6" `
        -condition $condition `
        -successMessage "Correctly rejected missing warehouseId (400)" `
        -errorMessage "Wrong error: $actualMessage"
}

# Test 7: Missing code
Write-Test "Test 7: Reject missing bin code"

try {
    $binData = @{
        warehouseId = $warehouseId1
        name = "Missing Code"
        row = 1
        column = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    Test-Result -testName "Test 7" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Should have rejected missing code (expected 400)"
} catch {
    $actualMessage = if ($_.ErrorDetails.Message) {
        $content = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($content.error) { $content.error } else { $content.message }
    } else {
        $_.Exception.Message
    }
    
    $condition = $_.Exception.Response.StatusCode -eq 'BadRequest' -or
                 $actualMessage -like "*required*"
    
    Test-Result -testName "Test 7" `
        -condition $condition `
        -successMessage "Correctly rejected missing code (400)" `
        -errorMessage "Wrong error: $actualMessage"
}

# Test 8: Missing name
Write-Test "Test 8: Reject missing bin name"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "MISSING-NAME"
        row = 1
        column = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    Test-Result -testName "Test 8" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Should have rejected missing name (expected 400)"
} catch {
    $actualMessage = if ($_.ErrorDetails.Message) {
        $content = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($content.error) { $content.error } else { $content.message }
    } else {
        $_.Exception.Message
    }
    
    $condition = $_.Exception.Response.StatusCode -eq 'BadRequest' -or
                 $actualMessage -like "*required*"
    
    Test-Result -testName "Test 8" `
        -condition $condition `
        -successMessage "Correctly rejected missing name (400)" `
        -errorMessage "Wrong error: $actualMessage"
}

# Test 9: Missing row
Write-Test "Test 9: Reject missing row coordinate"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "MISSING-ROW"
        name = "Missing Row"
        column = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    Test-Result -testName "Test 9" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Should have rejected missing row (expected 400)"
} catch {
    $actualMessage = if ($_.ErrorDetails.Message) {
        $content = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($content.error) { $content.error } else { $content.message }
    } else {
        $_.Exception.Message
    }
    
    $condition = $_.Exception.Response.StatusCode -eq 'BadRequest' -or
                 $actualMessage -like "*required*"
    
    Test-Result -testName "Test 9" `
        -condition $condition `
        -successMessage "Correctly rejected missing row (400)" `
        -errorMessage "Wrong error: $actualMessage"
}

# Test 10: Missing column
Write-Test "Test 10: Reject missing column coordinate"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "MISSING-COL"
        name = "Missing Column"
        row = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    Test-Result -testName "Test 10" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Should have rejected missing column (expected 400)"
} catch {
    $actualMessage = if ($_.ErrorDetails.Message) {
        $content = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($content.error) { $content.error } else { $content.message }
    } else {
        $_.Exception.Message
    }
    
    $condition = $_.Exception.Response.StatusCode -eq 'BadRequest' -or
                 $actualMessage -like "*required*"
    
    Test-Result -testName "Test 10" `
        -condition $condition `
        -successMessage "Correctly rejected missing column (400)" `
        -errorMessage "Wrong error: $actualMessage"
}

# Test 11: Missing level
Write-Test "Test 11: Reject missing level coordinate"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "MISSING-LEVEL"
        name = "Missing Level"
        row = 1
        column = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    Test-Result -testName "Test 11" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Should have rejected missing level (expected 400)"
} catch {
    $actualMessage = if ($_.ErrorDetails.Message) {
        $content = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($content.error) { $content.error } else { $content.message }
    } else {
        $_.Exception.Message
    }
    
    $condition = $_.Exception.Response.StatusCode -eq 'BadRequest' -or
                 $actualMessage -like "*required*"
    
    Test-Result -testName "Test 11" `
        -condition $condition `
        -successMessage "Correctly rejected missing level (400)" `
        -errorMessage "Wrong error: $actualMessage"
}

# ============================================================================
# SECTION 3: RBAC Tests
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "SECTION 3: RBAC Tests" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Test 12: SUPERVISOR can create bin
Write-Test "Test 12: SUPERVISOR can create bin"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "SUPERVISOR-BIN"
        name = "Bin created by Supervisor"
        row = 2
        column = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $supervisorToken" }
    
    $condition = $binResult.success -eq $true -and 
                 $binResult.bin.code -eq "SUPERVISOR-BIN"
    
    Test-Result -testName "Test 12" `
        -condition $condition `
        -successMessage "SUPERVISOR can create bin" `
        -errorMessage "SUPERVISOR should be able to create bin"
} catch {
    Test-Result -testName "Test 12" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Exception: $($_.Exception.Message)"
}

# Test 13: ADMIN can create bin
Write-Test "Test 13: ADMIN can create bin"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "ADMIN-BIN"
        name = "Bin created by Admin"
        row = 3
        column = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    
    $condition = $binResult.success -eq $true -and 
                 $binResult.bin.code -eq "ADMIN-BIN"
    
    Test-Result -testName "Test 13" `
        -condition $condition `
        -successMessage "ADMIN can create bin" `
        -errorMessage "ADMIN should be able to create bin"
} catch {
    Test-Result -testName "Test 13" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Exception: $($_.Exception.Message)"
}

# Test 14: OPERATOR cannot create bin
Write-Test "Test 14: OPERATOR cannot create bin (403)"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "OPERATOR-BIN"
        name = "Bin attempt by Operator"
        row = 4
        column = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $operatorToken" }
    
    Test-Result -testName "Test 14" `
        -condition $false `
        -successMessage "" `
        -errorMessage "OPERATOR should NOT be able to create bin (expected 403)"
} catch {
    $actualMessage = if ($_.ErrorDetails.Message) {
        $content = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($content.error) { $content.error } else { $content.message }
    } else {
        $_.Exception.Message
    }
    
    $condition = $_.Exception.Response.StatusCode -eq 'Forbidden' -or
                 $actualMessage -like "*permission*" -or
                 $actualMessage -like "*Insufficient*"
    
    Test-Result -testName "Test 14" `
        -condition $condition `
        -successMessage "OPERATOR correctly denied (403 Forbidden)" `
        -errorMessage "Wrong error: $actualMessage"
}

# Test 15: Unauthenticated request denied
Write-Test "Test 15: Unauthenticated request denied (401)"

try {
    $binData = @{
        warehouseId = $warehouseId1
        code = "UNAUTH-BIN"
        name = "Unauthenticated attempt"
        row = 5
        column = 1
        level = 1
    } | ConvertTo-Json
    
    $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
        -Method POST `
        -Body $binData `
        -ContentType "application/json"
    
    Test-Result -testName "Test 15" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Should have rejected unauthenticated request (expected 401)"
} catch {
    $condition = $_.Exception.Response.StatusCode -eq 'Unauthorized'
    
    Test-Result -testName "Test 15" `
        -condition $condition `
        -successMessage "Unauthenticated request correctly denied (401)" `
        -errorMessage "Wrong status code: $($_.Exception.Response.StatusCode)"
}

# ============================================================================
# SECTION 4: Advanced Scenarios
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "SECTION 4: Advanced Scenarios" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Test 16: Create multiple bins in same warehouse
Write-Test "Test 16: Create multiple bins in sequence"

try {
    $success = $true
    
    for ($i = 1; $i -le 5; $i++) {
        $binData = @{
            warehouseId = $warehouseId1
            code = "SEQ-$i"
            name = "Sequential Bin $i"
            row = $i
            column = 1
            level = 1
        } | ConvertTo-Json
        
        $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
            -Method POST `
            -Body $binData `
            -ContentType "application/json" `
            -Headers @{ "Authorization" = "Bearer $supervisorToken" }
        
        if (-not ($binResult.success -and $binResult.bin.code -eq "SEQ-$i")) {
            $success = $false
            break
        }
    }
    
    Test-Result -testName "Test 16" `
        -condition $success `
        -successMessage "Created 5 sequential bins successfully" `
        -errorMessage "Failed to create sequential bins"
} catch {
    Test-Result -testName "Test 16" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Exception: $($_.Exception.Message)"
}

# Test 17: Various coordinate combinations
Write-Test "Test 17: Create bins with edge case coordinates"

try {
    $success = $true
    $testCases = @(
        @{ code = "EDGE-1"; row = 0; column = 0; level = 0 },
        @{ code = "EDGE-2"; row = 10; column = 20; level = 5 },
        @{ code = "EDGE-3"; row = 1; column = 100; level = 1 }
    )
    
    foreach ($testCase in $testCases) {
        $binData = @{
            warehouseId = $warehouseId1
            code = $testCase.code
            name = "Edge Case Bin"
            row = $testCase.row
            column = $testCase.column
            level = $testCase.level
        } | ConvertTo-Json
        
        $binResult = Invoke-RestMethod -Uri "$baseUrl/api/warehouses/bins" `
            -Method POST `
            -Body $binData `
            -ContentType "application/json" `
            -Headers @{ "Authorization" = "Bearer $supervisorToken" }
        
        if (-not ($binResult.success -and 
                  $binResult.bin.row -eq $testCase.row -and
                  $binResult.bin.column -eq $testCase.column -and
                  $binResult.bin.level -eq $testCase.level)) {
            $success = $false
            break
        }
    }
    
    Test-Result -testName "Test 17" `
        -condition $success `
        -successMessage "Edge case coordinates handled correctly" `
        -errorMessage "Failed with edge case coordinates"
} catch {
    Test-Result -testName "Test 17" `
        -condition $false `
        -successMessage "" `
        -errorMessage "Exception: $($_.Exception.Message)"
}

# ============================================================================
# Test Summary
# ============================================================================

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Total Tests: $testsTotal" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "Success Rate: $([math]::Round(($testsPassed / $testsTotal) * 100, 2))%" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Yellow" })
Write-Host "============================================" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
    Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSOME TESTS FAILED!" -ForegroundColor Red
    exit 1
}
