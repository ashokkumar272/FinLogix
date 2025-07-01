# FinLogix Backend Setup Script for Windows
# This script sets up the FinLogix backend on Windows systems

Write-Host "🚀 FinLogix Backend Setup for Windows" -ForegroundColor Green
Write-Host "=====================================`n" -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+ from https://python.org" -ForegroundColor Red
    exit 1
}

# Check if we're in the correct directory
if (!(Test-Path "requirements.txt")) {
    Write-Host "❌ requirements.txt not found. Please run this script from the backend directory." -ForegroundColor Red
    exit 1
}

# Create virtual environment
Write-Host "🐍 Creating virtual environment..."
if (Test-Path "venv") {
    Write-Host "📁 Virtual environment already exists" -ForegroundColor Yellow
} else {
    python -m venv venv
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Virtual environment created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
}

# Activate virtual environment and install dependencies
Write-Host "`n📦 Installing dependencies..."
& "venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "`n📝 Creating .env file..."
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created from template" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env file with your database credentials" -ForegroundColor Yellow
} else {
    Write-Host "`n📝 .env file already exists" -ForegroundColor Yellow
}

# Instructions for database setup
Write-Host "`n🗄️  Database Setup Instructions:" -ForegroundColor Cyan
Write-Host "1. Make sure PostgreSQL is installed and running"
Write-Host "2. Create a database named 'finlogix_dev'"
Write-Host "3. Update the DATABASE_URL in .env file with your credentials"
Write-Host "4. Run 'flask init-db' to initialize the database"
Write-Host "5. Run 'flask create-admin' to create an admin user"

# Final instructions
Write-Host "`n🎉 Setup completed!" -ForegroundColor Green
Write-Host "`n📚 Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your database credentials"
Write-Host "2. Activate virtual environment: venv\Scripts\Activate.ps1"
Write-Host "3. Initialize database: flask init-db"
Write-Host "4. Create admin user: flask create-admin"
Write-Host "5. Start the server: python main.py"
Write-Host "`n🌐 The API will be available at: http://localhost:5000"

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
