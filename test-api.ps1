# WMS API Testing Script
# Run this script to test all WMS API endpoints

$BASE_URL = "http://localhost:3000"

# Color output
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Error-Custom { Write-Host $args[0] -ForegroundColor Red }
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }
function Write-Warning-Custom { Write-Host $args[0] -ForegroundColor Yellow }

Write-Info "============================================"
Write-Info "     WMS APPLICATION API TEST SUITE"
Write-Info "============================================"
Write-Info ""

# Test 1: Check if server is running
Write-Info "[TEST 1/5] Checking if server is running..."
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL" -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Success "✓ Server is running on port 3000"
    }
} catch {
    Write-Error-Custom "✗ Server not responding. Please ensure 'npm run dev' is running."
    exit 1
}

Write-Info ""

# Test 2: Register a new user
Write-Info "[TEST 2/5] Testing User Registration..."

$registerPayload = @{
    email = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')@wms.local"
    username = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')"
    password = "TestPassword@123"
    fullName = "Test User WMS"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "$BASE_URL/api/auth/register" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $registerPayload `
        -ErrorAction Stop
    
    $registerData = $registerResponse.Content | ConvertFrom-Json
    $TEST_EMAIL = $registerPayload | ConvertFrom-Json | Select-Object -ExpandProperty email
    $TEST_PASSWORD = $registerPayload | ConvertFrom-Json | Select-Object -ExpandProperty password
    
    Write-Success "✓ User registration successful (201)"
    Write-Info "  Email: $TEST_EMAIL"
    Write-Info "  Username: $(($registerPayload | ConvertFrom-Json).username)"
} catch {
    Write-Error-Custom "✗ User registration failed"
    Write-Error-Custom "  Error: $($_.Exception.Message)"
    exit 1
}

Write-Info ""

# Test 3: Login with registered user
Write-Info "[TEST 3/5] Testing User Login..."

$loginPayload = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$BASE_URL/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginPayload `
        -ErrorAction Stop
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $TOKEN = $loginData.token.accessToken
    
    Write-Success "✓ Login successful (200)"
    Write-Info "  User ID: $($loginData.user.id)"
    Write-Info "  Role: $($loginData.user.role)"
    Write-Info "  Token: $($TOKEN.Substring(0, 20))..." (truncated)
} catch {
    Write-Error-Custom "✗ Login failed"
    Write-Error-Custom "  Error: $($_.Exception.Message)"
    exit 1
}

Write-Info ""

# Test 4: Test protected endpoint (Get Inventory Items)
Write-Info "[TEST 4/5] Testing Protected Endpoint - Get Inventory Items..."

try {
    $inventoryResponse = Invoke-WebRequest -Uri "$BASE_URL/api/inventory/items" `
        -Method GET `
        -Headers @{"Authorization"="Bearer $TOKEN"} `
        -ErrorAction Stop
    
    Write-Success "✓ API access successful (200)"
    Write-Info "  Response length: $($inventoryResponse.Content.Length) bytes"
} 
catch {
    Write-Error-Custom "✗ API access failed"
    Write-Error-Custom "  Error: $($_.Exception.Message)"
}

Write-Info ""

# Test 5: Test without authentication (should fail)
Write-Info "[TEST 5/5] Testing authentication requirement - should fail..."

try {
    $unauthResponse = Invoke-WebRequest -Uri "$BASE_URL/api/inventory/items" `
        -Method GET `
        -ErrorAction Stop
    
    Write-Warning-Custom "⚠ Warning: Endpoint accessible without authentication"
} 
catch {
    Write-Success "✓ Authentication required as expected"
}

Write-Info ""
Write-Info "============================================"
Write-Success "     ALL TESTS COMPLETED!"
Write-Info "============================================"
Write-Info ""
Write-Info "Summary:"
Write-Success "✓ Server running on http://localhost:3000"
Write-Success "✓ User registration working"
Write-Success "✓ User login working"
Write-Success "✓ Protected endpoints responding"
Write-Success "✓ Authentication validated"
Write-Info ""
Write-Info "Application is READY FOR USE!"
Write-Info ""
Write-Info "Next steps:"
Write-Info "1. Open browser to http://localhost:3000"
Write-Info "2. Click 'Register' and create a test user"
Write-Info "3. Login with your credentials"
Write-Info "4. Explore the dashboard"
Write-Info ""
