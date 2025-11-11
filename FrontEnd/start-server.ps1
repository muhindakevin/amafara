# UMURENGE WALLET - Quick Start Script
Write-Host "🚀 Starting UMURENGE WALLET..." -ForegroundColor Cyan

# Add Node.js to PATH
$env:PATH += ";C:\Program Files\nodejs"

# Check if Node.js is available
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js not found in PATH" -ForegroundColor Red
    Write-Host "Please ensure Node.js is installed at: C:\Program Files\nodejs" -ForegroundColor Yellow
    exit
}

Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

# Navigate to FrontEnd directory
Set-Location $PSScriptRoot

# Clear Vite cache
Write-Host "🧹 Clearing Vite cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# Start development server
Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Once you see 'Local: http://localhost:XXXX/'," -ForegroundColor Yellow
Write-Host "Open that URL in your browser!" -ForegroundColor Yellow
Write-Host ""

npm run dev

