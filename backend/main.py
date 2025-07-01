from app import create_app, socketio, db
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = create_app()

@app.cli.command()
def init_db():
    """Initialize the database."""
    db.create_all()
    print("Database initialized!")

@app.cli.command()
def create_admin():
    """Create an admin user."""
    from app.models.user import User, UserRole
    
    name = input("Enter admin name: ")
    email = input("Enter admin email: ")
    password = input("Enter admin password: ")
    
    # Check if admin already exists
    if User.query.filter_by(email=email).first():
        print("User with this email already exists!")
        return
    
    admin = User(
        name=name,
        email=email,
        role=UserRole.ADMIN
    )
    admin.set_password(password)
    
    db.session.add(admin)
    db.session.commit()
    
    print(f"Admin user {email} created successfully!")

if __name__ == '__main__':
    # Run with SocketIO support
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )
