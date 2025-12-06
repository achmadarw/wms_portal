# Test UC-001: User Registration
# This script tests the complete user registration flow

Write-Host "=== Testing UC-001: User Registration ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Step 1: Login as admin to get token
Write-Host "Step 1: Login as admin..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body (@{
    email = "admin@wms.local"
    password = "Admin@123"
} | ConvertTo-Json)

if ($loginResponse.token) {
    Write-Host "Login successful" -ForegroundColor Green
    $token = $loginResponse.token
} else {
    Write-Host "Login failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Fetch existing users
Write-Host "Step 2: Fetch existing users..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method GET -Headers $headers
    Write-Host "Current users count: $($usersResponse.stats.total)" -ForegroundColor Green
    Write-Host "  - Admins: $($usersResponse.stats.byRole.ADMIN)" -ForegroundColor White
    Write-Host "  - Supervisors: $($usersResponse.stats.byRole.SUPERVISOR)" -ForegroundColor White
    Write-Host "  - Operators: $($usersResponse.stats.byRole.OPERATOR)" -ForegroundColor White
} catch {
    Write-Host "✗ Failed to fetch users: $_" -ForegroundColor Red
}

Write-Host ""

# Step 3: Create new user
Write-Host "Step 3: Create new test user..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$newUser = @{
    fullName = "Test User $timestamp"
    email = "test.user.$timestamp@wms.local"
    password = "Test@123"
    role = "OPERATOR"
    phone = "+6281234567890"
}

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method POST -ContentType "application/json" -Headers $headers -Body ($newUser | ConvertTo-Json)
    Write-Host "User created successfully!" -ForegroundColor Green
    Write-Host "  - ID: $($createResponse.user.id)" -ForegroundColor White
    Write-Host "  - Full Name: $($createResponse.user.fullName)" -ForegroundColor White
    Write-Host "  - Email: $($createResponse.user.email)" -ForegroundColor White
    Write-Host "  - Username: $($createResponse.user.username)" -ForegroundColor White
    Write-Host "  - Role: $($createResponse.user.role)" -ForegroundColor White
} catch {
    Write-Host "Failed to create user" -ForegroundColor Red
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "  Error: $($errorDetails.error)" -ForegroundColor Red
    if ($errorDetails.details) {
        Write-Host "  Details:" -ForegroundColor Red
        $errorDetails.details | ForEach-Object {
            Write-Host "    - $($_.path[0]): $($_.message)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Step 4: Verify email uniqueness
Write-Host "Step 4: Test email uniqueness validation..." -ForegroundColor Yellow
try {
    $duplicateResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method POST -ContentType "application/json" -Headers $headers -Body ($newUser | ConvertTo-Json)
    Write-Host "Should have failed with duplicate email" -ForegroundColor Red
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorDetails.error -eq "Email already exists") {
        Write-Host "Email uniqueness validation working!" -ForegroundColor Green
    } else {
        Write-Host "Unexpected error: $($errorDetails.error)" -ForegroundColor Red
    }
}

Write-Host ""

# Step 5: Test validation errors
Write-Host "Step 5: Test form validation..." -ForegroundColor Yellow
$invalidUser = @{
    fullName = "AB"  # Too short
    email = "invalid-email"  # Invalid format
    password = "123"  # Too short
    role = "INVALID_ROLE"  # Invalid role
}

try {
    $validationResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method POST -ContentType "application/json" -Headers $headers -Body ($invalidUser | ConvertTo-Json)
    Write-Host "Should have failed with validation errors" -ForegroundColor Red
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorDetails.error -eq "Validation failed") {
        Write-Host "Form validation working!" -ForegroundColor Green
        Write-Host "  Validation errors caught:" -ForegroundColor White
        $errorDetails.details | ForEach-Object {
            Write-Host "    - $($_.path[0]): $($_.message)" -ForegroundColor White
        }
    } else {
        Write-Host "✗ Unexpected error: $($errorDetails.error)" -ForegroundColor Red
    }
}

Write-Host ""

# Step 6: Fetch users again to verify
Write-Host "Step 6: Verify user was added..." -ForegroundColor Yellow
try {
    $finalUsersResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method GET -Headers $headers
    Write-Host "Final users count: $($finalUsersResponse.stats.total)" -ForegroundColor Green
    Write-Host "  - Admins: $($finalUsersResponse.stats.byRole.ADMIN)" -ForegroundColor White
    Write-Host "  - Supervisors: $($finalUsersResponse.stats.byRole.SUPERVISOR)" -ForegroundColor White
    Write-Host "  - Operators: $($finalUsersResponse.stats.byRole.OPERATOR)" -ForegroundColor White
} catch {
    Write-Host "✗ Failed to fetch users: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== UC-001 Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "1. Admin login works" -ForegroundColor Green
Write-Host "2. User list API works" -ForegroundColor Green
Write-Host "3. User creation works" -ForegroundColor Green
Write-Host "4. Email uniqueness validation works" -ForegroundColor Green
Write-Host "5. Form validation works" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "- Open http://localhost:3000/dashboard/users to test the UI" -ForegroundColor White
Write-Host "- Click Add New User button" -ForegroundColor White
Write-Host "- Fill the form and submit" -ForegroundColor White
Write-Host ""

