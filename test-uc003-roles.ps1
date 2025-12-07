# UC-003 Manage User Roles & Permissions - Comprehensive Test Script
# Tests role management and permission updates

# Color output functions
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Error-Custom { Write-Host "✗ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Cyan }
function Write-Warning-Custom { Write-Host "⚠ $args" -ForegroundColor Yellow }
function Write-Test { Write-Host "`n▶ $args" -ForegroundColor Magenta }

# Configuration
$BASE_URL = "http://localhost:3000"
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$ADMIN_EMAIL = "admin_uc003_${TIMESTAMP}@wms.local"
$ADMIN_PASSWORD = "Admin@123"
$TEST_USER_EMAIL = "testuser_uc003_${TIMESTAMP}@wms.local"
$TEST_USER_PASSWORD = "TestUser@123"

Write-Host ""
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   UC-003: MANAGE USER ROLES & PERMISSIONS TEST SUITE" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Info "Base URL: $BASE_URL"
Write-Info "Admin Email: $ADMIN_EMAIL"
Write-Info "Test User Email: $TEST_USER_EMAIL"
Write-Info "Timestamp: $TIMESTAMP"
Write-Host ""

# Test counter
$totalTests = 0
$passedTests = 0
$failedTests = 0

# Helper function to test API endpoint
function Test-APIEndpoint {
    param(
        [string]$TestName,
        [string]$Endpoint,
        [string]$Method,
        [hashtable]$Body,
        [int]$ExpectedStatus,
        [string]$ExpectedMessage = $null,
        [hashtable]$Headers = @{"Content-Type"="application/json"}
    )
    
    $script:totalTests++
    Write-Test "TEST $totalTests`: $TestName"
    
    try {
        $bodyJson = if ($Body) { $Body | ConvertTo-Json } else { $null }
        
        $response = Invoke-WebRequest `
            -Uri "$BASE_URL$Endpoint" `
            -Method $Method `
            -Headers $Headers `
            -Body $bodyJson `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        $status = $response.StatusCode
        
        if ($status -eq $ExpectedStatus) {
            Write-Success "Status: $status (Expected: $ExpectedStatus)"
            
            if ($ExpectedMessage -and $data.message) {
                if ($data.message -like "*$ExpectedMessage*") {
                    Write-Success "Message: '$($data.message)'"
                }
            }
            
            $script:passedTests++
            return @{
                success = $true
                data = $data
                status = $status
            }
        } else {
            Write-Error-Custom "Status: $status (Expected: $ExpectedStatus)"
            $script:failedTests++
            return @{success = $false}
        }
    }
    catch {
        $errorResponse = $_.Exception.Response
        if ($errorResponse) {
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
            $status = [int]$errorResponse.StatusCode
            
            if ($status -eq $ExpectedStatus) {
                Write-Success "Status: $status (Expected: $ExpectedStatus)"
                
                if ($ExpectedMessage -and $errorBody.error) {
                    if ($errorBody.error -like "*$ExpectedMessage*") {
                        Write-Success "Error Message: '$($errorBody.error)'"
                    }
                }
                
                $script:passedTests++
                return @{
                    success = $true
                    data = $errorBody
                    status = $status
                }
            } else {
                Write-Error-Custom "Status: $status (Expected: $ExpectedStatus)"
                if ($errorBody.error) {
                    Write-Error-Custom "Error: $($errorBody.error)"
                }
                $script:failedTests++
                return @{success = $false}
            }
        } else {
            Write-Error-Custom "Request failed: $($_.Exception.Message)"
            $script:failedTests++
            return @{success = $false}
        }
    }
}

# ============================================
# SETUP: Create admin and test user
# ============================================

Write-Host ""
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host " SETUP: Creating Test Users" -ForegroundColor Yellow
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow

# Create admin user
Write-Info "Creating admin user..."
$adminRegister = Test-APIEndpoint `
    -TestName "Create Admin User" `
    -Endpoint "/api/auth/register" `
    -Method POST `
    -Body @{
        email = $ADMIN_EMAIL
        username = "admin_${TIMESTAMP}"
        password = $ADMIN_PASSWORD
        fullName = "Admin User UC003"
    } `
    -ExpectedStatus 201

if (-not $adminRegister.success) {
    Write-Error-Custom "Failed to create admin user. Aborting tests."
    exit 1
}

$adminId = $adminRegister.data.user.id

# Manually set admin role (in real scenario, this would be done via database or existing admin)
Write-Info "Note: Admin role needs to be set manually in database for first admin"

# Login as admin to get token
Write-Info "Logging in as admin..."
$adminLogin = Test-APIEndpoint `
    -TestName "Admin Login" `
    -Endpoint "/api/auth/login" `
    -Method POST `
    -Body @{
        email = $ADMIN_EMAIL
        password = $ADMIN_PASSWORD
    } `
    -ExpectedStatus 200

if (-not $adminLogin.success) {
    Write-Error-Custom "Failed to login as admin. Aborting tests."
    exit 1
}

$adminToken = $adminLogin.data.token.accessToken
Write-Success "Admin token obtained: $($adminToken.Substring(0, 30))..."

# Create test user as OPERATOR
Write-Info "Creating test user (OPERATOR)..."
$testUserCreate = Test-APIEndpoint `
    -TestName "Create Test User (OPERATOR)" `
    -Endpoint "/api/users" `
    -Method POST `
    -Body @{
        email = $TEST_USER_EMAIL
        fullName = "Test User UC003"
        password = $TEST_USER_PASSWORD
        role = "OPERATOR"
        phone = "+6281234567890"
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 201

if ($testUserCreate.success) {
    $testUserId = $testUserCreate.data.user.id
    Write-Success "Test user created with ID: $testUserId"
} else {
    Write-Error-Custom "Failed to create test user. Aborting tests."
    exit 1
}

# ============================================
# TEST 1: Update User Role
# ============================================

Write-Host ""
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host " SECTION 1: Role Management Tests" -ForegroundColor Yellow
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow

# Test 1.1: Promote OPERATOR to SUPERVISOR
$updateRole = Test-APIEndpoint `
    -TestName "Update Role: OPERATOR → SUPERVISOR" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        role = "SUPERVISOR"
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 200 `
    -ExpectedMessage "updated successfully"

if ($updateRole.success) {
    Write-Host "  Updated User Details:" -ForegroundColor Gray
    Write-Host "    Name: $($updateRole.data.user.fullName)" -ForegroundColor Gray
    Write-Host "    Email: $($updateRole.data.user.email)" -ForegroundColor Gray
    Write-Host "    Old Role: OPERATOR" -ForegroundColor Gray
    Write-Host "    New Role: $($updateRole.data.user.role)" -ForegroundColor Gray
}

# Test 1.2: Promote SUPERVISOR to ADMIN
Test-APIEndpoint `
    -TestName "Update Role: SUPERVISOR → ADMIN" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        role = "ADMIN"
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 200 | Out-Null

# Test 1.3: Demote ADMIN to OPERATOR
Test-APIEndpoint `
    -TestName "Update Role: ADMIN → OPERATOR" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        role = "OPERATOR"
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 200 | Out-Null

# ============================================
# TEST 2: Update User Information
# ============================================

Write-Host ""
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host " SECTION 2: User Information Update Tests" -ForegroundColor Yellow
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow

# Test 2.1: Update Full Name
Test-APIEndpoint `
    -TestName "Update Full Name" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        fullName = "Updated Test User Name"
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 200 | Out-Null

# Test 2.2: Update Email
$newEmail = "updated_${TIMESTAMP}@wms.local"
Test-APIEndpoint `
    -TestName "Update Email Address" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        email = $newEmail
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 200 | Out-Null

# Test 2.3: Update Phone
Test-APIEndpoint `
    -TestName "Update Phone Number" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        phone = "+6289876543210"
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 200 | Out-Null

# Test 2.4: Reset Password
Test-APIEndpoint `
    -TestName "Reset User Password" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        password = "NewPassword@456"
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 200 | Out-Null

# ============================================
# TEST 3: Validation Tests
# ============================================

Write-Host ""
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host " SECTION 3: Validation and Error Handling" -ForegroundColor Yellow
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow

# Test 3.1: Duplicate Email
Test-APIEndpoint `
    -TestName "Prevent Duplicate Email" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        email = $ADMIN_EMAIL
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 409 `
    -ExpectedMessage "Email already exists" | Out-Null

# Test 3.2: Invalid Role
Test-APIEndpoint `
    -TestName "Reject Invalid Role" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        role = "INVALID_ROLE"
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 400 | Out-Null

# Test 3.3: Invalid Email Format
Test-APIEndpoint `
    -TestName "Reject Invalid Email Format" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        email = "not-an-email"
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 400 | Out-Null

# Test 3.4: Non-Existent User
Test-APIEndpoint `
    -TestName "Update Non-Existent User" `
    -Endpoint "/api/users/nonexistent-id-12345" `
    -Method PUT `
    -Body @{
        role = "SUPERVISOR"
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 404 `
    -ExpectedMessage "not found" | Out-Null

# ============================================
# TEST 4: Access Control Tests
# ============================================

Write-Host ""
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host " SECTION 4: Role-Based Access Control (RBAC)" -ForegroundColor Yellow
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow

# Login as test user (OPERATOR) to get non-admin token
Write-Info "Logging in as test user (OPERATOR)..."
$testUserLogin = Test-APIEndpoint `
    -TestName "Test User Login" `
    -Endpoint "/api/auth/login" `
    -Method POST `
    -Body @{
        email = $newEmail
        password = "NewPassword@456"
    } `
    -ExpectedStatus 200

if ($testUserLogin.success) {
    $operatorToken = $testUserLogin.data.token.accessToken
    
    # Test 4.1: OPERATOR cannot update users
    Test-APIEndpoint `
        -TestName "OPERATOR Cannot Update User (403 Forbidden)" `
        -Endpoint "/api/users/$testUserId" `
        -Method PUT `
        -Body @{
            fullName = "Attempted Change"
        } `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $operatorToken"
        } `
        -ExpectedStatus 403 `
        -ExpectedMessage "Forbidden" | Out-Null
    
    # Test 4.2: OPERATOR cannot delete users
    Test-APIEndpoint `
        -TestName "OPERATOR Cannot Delete User (403 Forbidden)" `
        -Endpoint "/api/users/$adminId" `
        -Method DELETE `
        -Headers @{
            "Authorization" = "Bearer $operatorToken"
        } `
        -ExpectedStatus 403 | Out-Null
} else {
    Write-Warning-Custom "Skipping OPERATOR tests - login failed"
}

# Test 4.3: Unauthenticated request
Test-APIEndpoint `
    -TestName "Unauthenticated Request (401)" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        role = "ADMIN"
    } `
    -Headers @{
        "Content-Type" = "application/json"
    } `
    -ExpectedStatus 401 | Out-Null

# ============================================
# TEST 5: User Deactivation
# ============================================

Write-Host ""
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host " SECTION 5: User Deactivation Tests" -ForegroundColor Yellow
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow

# Test 5.1: Deactivate user (soft delete)
$deactivate = Test-APIEndpoint `
    -TestName "Deactivate User (Soft Delete)" `
    -Endpoint "/api/users/$testUserId" `
    -Method DELETE `
    -Headers @{
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 200 `
    -ExpectedMessage "deactivated"

if ($deactivate.success) {
    Write-Host "  Deactivated User:" -ForegroundColor Gray
    Write-Host "    Name: $($deactivate.data.user.fullName)" -ForegroundColor Gray
    Write-Host "    Active Status: $($deactivate.data.user.active)" -ForegroundColor Gray
}

# Test 5.2: Verify deactivated user cannot login
Test-APIEndpoint `
    -TestName "Deactivated User Cannot Login" `
    -Endpoint "/api/auth/login" `
    -Method POST `
    -Body @{
        email = $newEmail
        password = "NewPassword@456"
    } `
    -ExpectedStatus 403 `
    -ExpectedMessage "inactive" | Out-Null

# Test 5.3: Prevent self-deletion
Test-APIEndpoint `
    -TestName "Admin Cannot Delete Own Account" `
    -Endpoint "/api/users/$adminId" `
    -Method DELETE `
    -Headers @{
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 400 `
    -ExpectedMessage "Cannot delete your own account" | Out-Null

# ============================================
# TEST 6: Reactivation
# ============================================

Write-Host ""
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host " SECTION 6: User Reactivation" -ForegroundColor Yellow
Write-Host "──────────────────────────────────────────────────────────" -ForegroundColor Yellow

# Test 6.1: Reactivate deactivated user
$reactivate = Test-APIEndpoint `
    -TestName "Reactivate Deactivated User" `
    -Endpoint "/api/users/$testUserId" `
    -Method PUT `
    -Body @{
        active = $true
    } `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -ExpectedStatus 200

if ($reactivate.success) {
    Write-Host "  Reactivated User:" -ForegroundColor Gray
    Write-Host "    Active Status: $($reactivate.data.user.active)" -ForegroundColor Gray
}

# Test 6.2: Verify reactivated user can login
Test-APIEndpoint `
    -TestName "Reactivated User Can Login" `
    -Endpoint "/api/auth/login" `
    -Method POST `
    -Body @{
        email = $newEmail
        password = "NewPassword@456"
    } `
    -ExpectedStatus 200 | Out-Null

# ============================================
# TEST SUMMARY
# ============================================

Write-Host ""
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   TEST SUMMARY" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Success "Passed: $passedTests"
if ($failedTests -gt 0) {
    Write-Error-Custom "Failed: $failedTests"
} else {
    Write-Host "Failed: $failedTests" -ForegroundColor Green
}

$successRate = [math]::Round(($passedTests / $totalTests) * 100, 2)
Write-Host ""
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" })
Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "   ALL TESTS PASSED! UC-003 FULLY FUNCTIONAL" -ForegroundColor Green
    Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "   SOME TESTS FAILED - REVIEW REQUIRED" -ForegroundColor Red
    Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Red
}

Write-Host ""
$completionTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Info "Test completed at: $completionTime"
Write-Host ""

# Return exit code based on results
if ($failedTests -eq 0) {
    exit 0
} else {
    exit 1
}
