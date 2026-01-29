# Setup script for Windows

Write-Host "🚀 Setting up development environment..." -ForegroundColor Blue

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Copy .env.example to .env if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
    }
    Write-Host "✅ .env file created. Please update it with your configuration." -ForegroundColor Green
}

# Build Docker images
Write-Host "🐳 Building Docker images..." -ForegroundColor Yellow
docker-compose build

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Services are running:"
Write-Host "  - Backend API: http://localhost:8000"
Write-Host "  - API Docs: http://localhost:8000/docs"
Write-Host "  - Flower: http://localhost:5555"
