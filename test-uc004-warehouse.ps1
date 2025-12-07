# ========================================
# UC-004: Create Warehouse - Test Suite
# ========================================
# Purpose: Automated testing for warehouse creation functionality
# Author: WMS Development Team
# Date: December 7, 2025
# Status: Production Ready
# ========================================

# Configuration
$baseUrl = "http://localhost:3000"
$testPassed = 0
$testFailed = 0
$testTotal = 0

# Colors for output
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

# Test helper function
function Test-APIEndpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus,
        [string]$ExpectedMessage = $null
    )
    
    $script:testTotal++
    Write-Test "$Name"
    
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        try {
            $response = Invoke-WebRequest @params -ErrorAction Stop
            $statusCode = $response.StatusCode
            $content = $response.Content | ConvertFrom-Json
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.Value__
            $content = $_.ErrorDetails.Message | ConvertFrom-Json
        }
        
        # Check status code
        if ($statusCode -eq $ExpectedStatus) {
            Write-Success "Status code: $statusCode (expected $ExpectedStatus)"
            
            # Check message if provided
            if ($ExpectedMessage) {
                if ($content.error -like "*$ExpectedMessage*" -or $content.message -like "*$ExpectedMessage*") {
                    Write-Success "Message contains: '$ExpectedMessage'"
                    $script:testPassed++
                    return $content
                } else {
                    $actualMessage = if ($content.error) { $content.error } else { $content.message }
                    Write-Error-Custom "Expected message containing '$ExpectedMessage', got: $actualMessage"
                    $script:testFailed++
                    return $null
                }
            } else {
                $script:testPassed++
                return $content
            }
        } else {
            Write-Error-Custom "Status code: $statusCode (expected $ExpectedStatus)"
            Write-Error-Custom "Response: $($content | ConvertTo-Json -Compress)"
            $script:testFailed++
            return $null
        }
    } catch {
        Write-Error-Custom "Request failed: $_"
        $script:testFailed++
        return $null
    }
}

# ========================================
# SETUP: Create Admin User and Login
# ========================================

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "UC-004: CREATE WAREHOUSE - TEST SUITE" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

Write-Info "Setting up test environment..."

# Generate unique test email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$adminEmail = "admin-uc004-$timestamp@wms.local"
$testUserEmail = "operator-uc004-$timestamp@wms.local"
$supervisorEmail = "supervisor-uc004-$timestamp@wms.local"

# Create admin user
Write-Info "Creating admin user: $adminEmail"
$adminData = @{
    email = $adminEmail
    password = "Admin@123"
    fullName = "Admin UC-004 Test"
    role = "ADMIN"
} | ConvertTo-Json

$adminResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
    -Method POST `
    -Body $adminData `
    -ContentType "application/json"

if ($adminResult.user) {
    Write-Success "Admin user created: $($adminResult.user.id)"
} else {
    Write-Error-Custom "Failed to create admin user"
    exit 1
}

# Login as admin
Write-Info "Logging in as admin..."
$loginData = @{
    email = $adminEmail
    password = "Admin@123"
} | ConvertTo-Json

$loginResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -Body $loginData `
    -ContentType "application/json"

if ($loginResult.token) {
    $adminToken = $loginResult.token
    Write-Success "Admin logged in successfully"
} else {
    Write-Error-Custom "Failed to login as admin"
    exit 1
}

$adminHeaders = @{
    "Authorization" = "Bearer $adminToken"
}

# Create OPERATOR user for RBAC tests
Write-Info "Creating operator user: $testUserEmail"
$operatorData = @{
    email = $testUserEmail
    password = "Operator@123"
    fullName = "Operator UC-004 Test"
    role = "OPERATOR"
} | ConvertTo-Json

$operatorResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
    -Method POST `
    -Body $operatorData `
    -ContentType "application/json"

# Login as operator
$operatorLogin = @{
    email = $testUserEmail
    password = "Operator@123"
} | ConvertTo-Json

$operatorLoginResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -Body $operatorLogin `
    -ContentType "application/json"

$operatorToken = $operatorLoginResult.token
$operatorHeaders = @{
    "Authorization" = "Bearer $operatorToken"
}

# Create SUPERVISOR user for RBAC tests
Write-Info "Creating supervisor user: $supervisorEmail"
$supervisorData = @{
    email = $supervisorEmail
    password = "Supervisor@123"
    fullName = "Supervisor UC-004 Test"
    role = "SUPERVISOR"
} | ConvertTo-Json

$supervisorResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
    -Method POST `
    -Body $supervisorData `
    -ContentType "application/json"

# Login as supervisor
$supervisorLogin = @{
    email = $supervisorEmail
    password = "Supervisor@123"
} | ConvertTo-Json

$supervisorLoginResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -Body $supervisorLogin `
    -ContentType "application/json"

$supervisorToken = $supervisorLoginResult.token
$supervisorHeaders = @{
    "Authorization" = "Bearer $supervisorToken"
}

Write-Success "Test environment setup complete`n"

# ========================================
# SECTION 1: CREATE WAREHOUSE (HAPPY PATH)
# ========================================

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "SECTION 1: CREATE WAREHOUSE (HAPPY PATH)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Test 1: Create warehouse with all required fields
$warehouseCode1 = "WH-UC004-001"
$warehouse1Body = @{
    code = $warehouseCode1
    name = "Main Warehouse UC-004"
    description = "Primary distribution center for testing"
    address = "123 Industrial Park Road"
    city = "Jakarta"
    state = "DKI Jakarta"
    zipCode = "12345"
    country = "Indonesia"
} | ConvertTo-Json

$result1 = Test-APIEndpoint -Name "Create warehouse with all required fields" `
    -Method "POST" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $adminHeaders `
    -Body $warehouse1Body `
    -ExpectedStatus 201

if ($result1 -and $result1.warehouse) {
    Write-Info "Warehouse created: $($result1.warehouse.code) - $($result1.warehouse.name)"
    Write-Info "ID: $($result1.warehouse.id)"
    Write-Info "Location: $($result1.warehouse.city), $($result1.warehouse.state)"
    $warehouse1Id = $result1.warehouse.id
}

# Test 2: Create warehouse with optional description
$warehouseCode2 = "WH-UC004-002"
$warehouse2Body = @{
    code = $warehouseCode2
    name = "Regional Warehouse Jakarta"
    description = "Secondary warehouse for regional distribution"
    address = "456 Regional Street"
    city = "Jakarta"
    state = "DKI Jakarta"
    zipCode = "54321"
    country = "Indonesia"
} | ConvertTo-Json

$result2 = Test-APIEndpoint -Name "Create warehouse with optional description" `
    -Method "POST" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $adminHeaders `
    -Body $warehouse2Body `
    -ExpectedStatus 201

if ($result2 -and $result2.warehouse) {
    Write-Info "Warehouse created with description: $($result2.warehouse.description)"
}

# Test 3: Create warehouse with manager assignment
$warehouseCode3 = "WH-UC004-003"
$warehouse3Body = @{
    code = $warehouseCode3
    name = "Surabaya Distribution Center"
    description = "Warehouse with assigned manager"
    address = "789 Warehouse Boulevard"
    city = "Surabaya"
    state = "Jawa Timur"
    zipCode = "60123"
    country = "Indonesia"
    managerId = $supervisorResult.user.id
} | ConvertTo-Json

$result3 = Test-APIEndpoint -Name "Create warehouse with manager assignment" `
    -Method "POST" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $adminHeaders `
    -Body $warehouse3Body `
    -ExpectedStatus 201

if ($result3 -and $result3.warehouse) {
    Write-Info "Warehouse created with manager: $($supervisorResult.user.fullName)"
    Write-Info "Manager ID: $($result3.warehouse.managerId)"
}

# ========================================
# SECTION 2: VALIDATION TESTS
# ========================================

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "SECTION 2: VALIDATION TESTS" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Test 4: Duplicate warehouse code validation
$duplicateBody = @{
    code = $warehouseCode1  # Reuse first warehouse code
    name = "Duplicate Warehouse"
    address = "999 Duplicate Street"
    city = "Jakarta"
    state = "DKI Jakarta"
    zipCode = "99999"
    country = "Indonesia"
} | ConvertTo-Json

$result4 = Test-APIEndpoint -Name "Prevent duplicate warehouse code" `
    -Method "POST" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $adminHeaders `
    -Body $duplicateBody `
    -ExpectedStatus 409 `
    -ExpectedMessage "already exists"

# Test 5: Missing required field - code
$missingCodeBody = @{
    name = "Warehouse Without Code"
    address = "123 Street"
    city = "Jakarta"
    state = "DKI Jakarta"
    zipCode = "12345"
    country = "Indonesia"
} | ConvertTo-Json

$result5 = Test-APIEndpoint -Name "Reject warehouse without code" `
    -Method "POST" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $adminHeaders `
    -Body $missingCodeBody `
    -ExpectedStatus 400 `
    -ExpectedMessage "required"

# Test 6: Missing required field - name
$missingNameBody = @{
    code = "WH-UC004-999"
    address = "123 Street"
    city = "Jakarta"
    state = "DKI Jakarta"
    zipCode = "12345"
    country = "Indonesia"
} | ConvertTo-Json

$result6 = Test-APIEndpoint -Name "Reject warehouse without name" `
    -Method "POST" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $adminHeaders `
    -Body $missingNameBody `
    -ExpectedStatus 400 `
    -ExpectedMessage "required"

# Test 7: Missing required field - address
$missingAddressBody = @{
    code = "WH-UC004-998"
    name = "Warehouse Without Address"
    city = "Jakarta"
    state = "DKI Jakarta"
    zipCode = "12345"
    country = "Indonesia"
} | ConvertTo-Json

$result7 = Test-APIEndpoint -Name "Reject warehouse without address" `
    -Method "POST" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $adminHeaders `
    -Body $missingAddressBody `
    -ExpectedStatus 400 `
    -ExpectedMessage "required"

# Test 8: Missing required field - city
$missingCityBody = @{
    code = "WH-UC004-997"
    name = "Warehouse Without City"
    address = "123 Street"
    state = "DKI Jakarta"
    zipCode = "12345"
    country = "Indonesia"
} | ConvertTo-Json

$result8 = Test-APIEndpoint -Name "Reject warehouse without city" `
    -Method "POST" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $adminHeaders `
    -Body $missingCityBody `
    -ExpectedStatus 400 `
    -ExpectedMessage "required"

# ========================================
# SECTION 3: RBAC TESTS
# ========================================

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "SECTION 3: RBAC TESTS" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Test 9: OPERATOR cannot create warehouse
$operatorWarehouseBody = @{
    code = "WH-OPERATOR-001"
    name = "Operator Warehouse Attempt"
    address = "123 Street"
    city = "Jakarta"
    state = "DKI Jakarta"
    zipCode = "12345"
    country = "Indonesia"
} | ConvertTo-Json

$result9 = Test-APIEndpoint -Name "OPERATOR cannot create warehouse (403)" `
    -Method "POST" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $operatorHeaders `
    -Body $operatorWarehouseBody `
    -ExpectedStatus 403 `
    -ExpectedMessage "permissions"

# Test 10: SUPERVISOR cannot create warehouse
$supervisorWarehouseBody = @{
    code = "WH-SUPERVISOR-001"
    name = "Supervisor Warehouse Attempt"
    address = "123 Street"
    city = "Jakarta"
    state = "DKI Jakarta"
    zipCode = "12345"
    country = "Indonesia"
} | ConvertTo-Json

$result10 = Test-APIEndpoint -Name "SUPERVISOR cannot create warehouse (403)" `
    -Method "POST" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $supervisorHeaders `
    -Body $supervisorWarehouseBody `
    -ExpectedStatus 403 `
    -ExpectedMessage "permissions"

# Test 11: Unauthenticated request denied
$unauthWarehouseBody = @{
    code = "WH-UNAUTH-001"
    name = "Unauthorized Warehouse"
    address = "123 Street"
    city = "Jakarta"
    state = "DKI Jakarta"
    zipCode = "12345"
    country = "Indonesia"
} | ConvertTo-Json

$result11 = Test-APIEndpoint -Name "Unauthenticated request denied (401)" `
    -Method "POST" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers @{} `
    -Body $unauthWarehouseBody `
    -ExpectedStatus 401 `
    -ExpectedMessage "Unauthorized"

# ========================================
# SECTION 4: GET WAREHOUSES
# ========================================

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "SECTION 4: GET WAREHOUSES" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Test 12: Get warehouses list
$result12 = Test-APIEndpoint -Name "Get warehouses list (authenticated)" `
    -Method "GET" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $adminHeaders `
    -ExpectedStatus 200

if ($result12 -and $result12.warehouses) {
    Write-Info "Found $($result12.warehouses.Count) warehouses"
    foreach ($wh in $result12.warehouses) {
        Write-Info "  - $($wh.code): $($wh.name) ($($wh.city), $($wh.state))"
    }
}

# Test 13: OPERATOR can view warehouses
$result13 = Test-APIEndpoint -Name "OPERATOR can view warehouses (200)" `
    -Method "GET" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $operatorHeaders `
    -ExpectedStatus 200

# Test 14: SUPERVISOR can view warehouses
$result14 = Test-APIEndpoint -Name "SUPERVISOR can view warehouses (200)" `
    -Method "GET" `
    -Uri "$baseUrl/api/warehouses" `
    -Headers $supervisorHeaders `
    -ExpectedStatus 200

# ========================================
# SECTION 5: WAREHOUSE CODE FORMAT
# ========================================

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "SECTION 5: WAREHOUSE CODE FORMAT" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Test 15: Create warehouse with different code formats
$formats = @(
    @{code = "WH-FORMAT-001"; name = "Standard format"},
    @{code = "WAREHOUSE-MAIN"; name = "Descriptive format"},
    @{code = "JKT-DC-001"; name = "Location-based format"}
)

foreach ($format in $formats) {
    $formatBody = @{
        code = $format.code
        name = "$($format.name) warehouse"
        address = "123 Test Street"
        city = "Jakarta"
        state = "DKI Jakarta"
        zipCode = "12345"
        country = "Indonesia"
    } | ConvertTo-Json
    
    $formatResult = Test-APIEndpoint -Name "Create warehouse with $($format.name)" `
        -Method "POST" `
        -Uri "$baseUrl/api/warehouses" `
        -Headers $adminHeaders `
        -Body $formatBody `
        -ExpectedStatus 201
    
    if ($formatResult) {
        Write-Info "Accepted code format: $($format.code)"
    }
}

# ========================================
# TEST SUMMARY
# ========================================

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "TEST SUMMARY" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

Write-Host "`nTotal Tests: $testTotal" -ForegroundColor White
Write-Host "Passed: $testPassed" -ForegroundColor Green
Write-Host "Failed: $testFailed" -ForegroundColor $(if ($testFailed -eq 0) { "Green" } else { "Red" })

$passRate = [math]::Round(($testPassed / $testTotal) * 100, 2)
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -eq 100) { "Green" } else { "Yellow" })

if ($testFailed -eq 0) {
    Write-Host ""
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "UC-004: Create Warehouse is working correctly." -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "Please review the failed tests above." -ForegroundColor Red
    exit 1
}
