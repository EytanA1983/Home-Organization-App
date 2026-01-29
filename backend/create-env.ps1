# Create .env file for backend
$envContent = @"
SECRET_KEY=dev-secret-key-change-in-production
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/eli_maor
REDIS_URL=redis://localhost:6379/0
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY
"@

if (Test-Path .env) {
    Write-Host ".env file already exists" -ForegroundColor Yellow
} else {
    $envContent | Out-File -FilePath .env -Encoding utf8
    Write-Host ".env file created successfully!" -ForegroundColor Green
}
