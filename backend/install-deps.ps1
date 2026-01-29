# Install Backend Dependencies
Write-Host "=== Installing Backend Dependencies ===" -ForegroundColor Green

# Check if Poetry is available
if (Get-Command poetry -ErrorAction SilentlyContinue) {
    Write-Host "Using Poetry..." -ForegroundColor Cyan
    poetry install
} elseif (Test-Path "requirements.txt") {
    Write-Host "Using pip with requirements.txt..." -ForegroundColor Cyan
    pip install -r requirements.txt
} else {
    Write-Host "ERROR: No requirements.txt found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Installation Complete ===" -ForegroundColor Green
