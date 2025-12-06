# WMS Application Startup Script for Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Warehouse Management System" -ForegroundColor Cyan
Write-Host "Application Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set database URL
$env:DATABASE_URL = "file:./prisma/dev.db"

Write-Host "Setting up environment..." -ForegroundColor Yellow
Write-Host "Database: SQLite (./prisma/dev.db)" -ForegroundColor White
Write-Host ""

# Navigate to project directory
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📍 Application will be available at:" -ForegroundColor Green
Write-Host "   Web:              http://localhost:3000" -ForegroundColor White
Write-Host "   Register:         http://localhost:3000/register" -ForegroundColor White
Write-Host "   Login:            http://localhost:3000/login" -ForegroundColor White
Write-Host "   Dashboard:        http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "   Getting Started:  http://localhost:3000/getting-started" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start development server
npm run dev
