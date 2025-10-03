# PowerShell script to activate virtual environment
Write-Host "Activating BrandBloom Insights virtual environment..." -ForegroundColor Green

# Activate the virtual environment
& ".\venv\Scripts\Activate.ps1"

Write-Host "Virtual environment activated!" -ForegroundColor Green
Write-Host ""
Write-Host "To install dependencies, run: pip install -r requirements.txt" -ForegroundColor Yellow
Write-Host "To start the API server, run: python main.py" -ForegroundColor Yellow
Write-Host ""