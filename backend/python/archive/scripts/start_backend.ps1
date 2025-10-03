# Start BrandBloom Insights Backend
# This script activates the virtual environment and starts the FastAPI server

Write-Host "🚀 Starting BrandBloom Insights Backend..." -ForegroundColor Green
Write-Host "📁 Activating virtual environment..." -ForegroundColor Cyan

# Activate virtual environment (from backend/python directory)
& "..\..\..\venv\Scripts\Activate.ps1"

Write-Host "✅ Virtual environment activated" -ForegroundColor Green
Write-Host "🔧 Starting FastAPI server..." -ForegroundColor Cyan

# Change to backend/python directory and start the server
Set-Location ".."
python main.py

Write-Host "🛑 Server stopped" -ForegroundColor Yellow