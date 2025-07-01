#!/usr/bin/env python3
"""
FinLogix Backend Setup Script
This script helps set up the FinLogix backend application.
"""

import os
import sys
import subprocess
import getpass
from pathlib import Path

def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def create_env_file():
    """Create .env file with user input"""
    if os.path.exists('.env'):
        overwrite = input("📝 .env file already exists. Overwrite? (y/N): ").lower()
        if overwrite != 'y':
            print("⏭️  Skipping .env file creation")
            return True
    
    print("\n🔧 Setting up environment variables...")
    
    # Get database configuration
    print("\n📄 Database Configuration:")
    db_host = input("Database host (localhost): ") or "localhost"
    db_port = input("Database port (5432): ") or "5432"
    db_name = input("Database name (finlogix_dev): ") or "finlogix_dev"
    db_user = input("Database username: ")
    db_password = getpass.getpass("Database password: ")
    
    # Get security keys
    print("\n🔐 Security Configuration:")
    secret_key = input("Flask secret key (press Enter to generate): ")
    if not secret_key:
        import secrets
        secret_key = secrets.token_urlsafe(32)
    
    jwt_secret = input("JWT secret key (press Enter to generate): ")
    if not jwt_secret:
        import secrets
        jwt_secret = secrets.token_urlsafe(32)
    
    # Create .env content
    env_content = f"""# Flask Configuration
FLASK_ENV=development
FLASK_CONFIG=development
SECRET_KEY={secret_key}
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}
DEV_DATABASE_URL=postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}

# JWT Configuration
JWT_SECRET_KEY={jwt_secret}
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ .env file created successfully")
    return True

def setup_virtual_environment():
    """Set up Python virtual environment"""
    if os.path.exists('venv'):
        print("📁 Virtual environment already exists")
        return True
    
    print("🐍 Creating virtual environment...")
    if not run_command(f"{sys.executable} -m venv venv", "Creating virtual environment"):
        return False
    
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing dependencies...")
    
    # Determine pip command based on OS
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip.exe"
    else:  # Linux/Mac
        pip_cmd = "venv/bin/pip"
    
    if not run_command(f"{pip_cmd} install --upgrade pip", "Upgrading pip"):
        return False
    
    if not run_command(f"{pip_cmd} install -r requirements.txt", "Installing dependencies"):
        return False
    
    return True

def setup_database():
    """Set up database tables"""
    print("🗄️  Setting up database...")
    
    # Determine python command based on OS
    if os.name == 'nt':  # Windows
        python_cmd = "venv\\Scripts\\python.exe"
        flask_cmd = "venv\\Scripts\\flask.exe"
    else:  # Linux/Mac
        python_cmd = "venv/bin/python"
        flask_cmd = "venv/bin/flask"
    
    # Set environment variable for Flask app
    os.environ['FLASK_APP'] = 'main.py'
    
    if not run_command(f"{flask_cmd} init-db", "Initializing database"):
        print("⚠️  Database initialization failed. Make sure PostgreSQL is running and credentials are correct.")
        return False
    
    return True

def create_admin_user():
    """Create admin user"""
    create_admin = input("\n👤 Would you like to create an admin user? (Y/n): ").lower()
    if create_admin in ['', 'y', 'yes']:
        print("📝 Creating admin user...")
        
        # Determine flask command based on OS
        if os.name == 'nt':  # Windows
            flask_cmd = "venv\\Scripts\\flask.exe"
        else:  # Linux/Mac
            flask_cmd = "venv/bin/flask"
        
        os.environ['FLASK_APP'] = 'main.py'
        
        try:
            subprocess.run(f"{flask_cmd} create-admin", shell=True, check=True)
            print("✅ Admin user created successfully")
        except subprocess.CalledProcessError:
            print("⚠️  Admin user creation failed")
    
    return True

def main():
    """Main setup function"""
    print("🚀 Welcome to FinLogix Backend Setup!")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('requirements.txt'):
        print("❌ requirements.txt not found. Make sure you're in the backend directory.")
        sys.exit(1)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    
    steps = [
        ("Create .env file", create_env_file),
        ("Set up virtual environment", setup_virtual_environment),
        ("Install dependencies", install_dependencies),
        ("Set up database", setup_database),
        ("Create admin user", create_admin_user),
    ]
    
    print(f"\n📋 Setup will complete {len(steps)} steps:")
    for i, (step_name, _) in enumerate(steps, 1):
        print(f"  {i}. {step_name}")
    
    input("\nPress Enter to continue...")
    
    # Execute setup steps
    for step_name, step_function in steps:
        print(f"\n{'='*20} {step_name} {'='*20}")
        if not step_function():
            print(f"\n❌ Setup failed at step: {step_name}")
            sys.exit(1)
    
    print("\n" + "="*50)
    print("🎉 FinLogix Backend setup completed successfully!")
    print("\n📚 Next steps:")
    print("1. Make sure PostgreSQL is running")
    print("2. Activate virtual environment:")
    if os.name == 'nt':
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("3. Start the development server:")
    print("   python main.py")
    print("\n🌐 The API will be available at: http://localhost:5000")
    print("📖 Check README.md for API documentation")

if __name__ == "__main__":
    main()
