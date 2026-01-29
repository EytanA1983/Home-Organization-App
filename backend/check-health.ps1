# Check Backend Health Endpoint
Write-Host "=== Checking Health Endpoint ===" -ForegroundColor Green
Write-Host "URL: http://127.0.0.1:8000/health" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get -TimeoutSec 3
    Write-Host "`nSUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json
    Write-Host "`nBackend is healthy and running!" -ForegroundColor Green
} catch {
    Write-Host "`nFAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nMake sure the backend is running:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Cyan
    Write-Host "  .\start-server.ps1" -ForegroundColor Cyan
}
