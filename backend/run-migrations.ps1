# Run Alembic Migrations
Write-Host "=== Running Alembic Migrations ===" -ForegroundColor Green

# Check if Poetry is available
if (Get-Command poetry -ErrorAction SilentlyContinue) {
    Write-Host "Using Poetry..." -ForegroundColor Cyan
    poetry run alembic upgrade head
} else {
    Write-Host "Poetry not found. Using alembic directly..." -ForegroundColor Yellow
    # Try to run alembic
    if (Get-Command alembic -ErrorAction SilentlyContinue) {
        alembic upgrade head
    } else {
        Write-Host "ERROR: alembic not found!" -ForegroundColor Red
        Write-Host "Please install dependencies first:" -ForegroundColor Yellow
        Write-Host "  pip install -r requirements.txt" -ForegroundColor Cyan
        Write-Host "  OR" -ForegroundColor Gray
        Write-Host "  poetry install" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host "`n=== Migrations Complete ===" -ForegroundColor Green
