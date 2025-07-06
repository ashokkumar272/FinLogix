from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from enum import Enum
from sqlalchemy import Numeric

class UserRole(Enum):
    USER = "user"
    ADMIN = "admin"

class IncomeType(Enum):
    SALARY = "salary"
    FREELANCE = "freelance"
    BUSINESS = "business"
    INVESTMENT = "investment"
    OTHER = "other"

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), default=UserRole.USER, nullable=False)
    
    # New fields for account management and preferences
    income_type = db.Column(db.Enum(IncomeType), nullable=True)
    budget_goal = db.Column(Numeric(10, 2), nullable=True)  # Monthly budget goal
    profile_picture = db.Column(db.String(255), nullable=True)  # URL or path to profile picture
    phone_number = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)  # For soft delete
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with transactions
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def update_profile(self, name=None, email=None, phone_number=None, profile_picture=None):
        """Update user profile information"""
        if name:
            self.name = name
        if email:
            self.email = email
        if phone_number:
            self.phone_number = phone_number
        if profile_picture:
            self.profile_picture = profile_picture
        self.updated_at = datetime.utcnow()
    
    def update_preferences(self, income_type=None, budget_goal=None):
        """Update user preferences"""
        if income_type:
            self.income_type = income_type
        if budget_goal is not None:
            self.budget_goal = budget_goal
        self.updated_at = datetime.utcnow()
    
    def soft_delete(self):
        """Soft delete user account"""
        self.is_active = False
        self.updated_at = datetime.utcnow()
    
    def to_dict(self, include_sensitive=False):
        """Convert user object to dictionary"""
        user_dict = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role.value,
            'income_type': self.income_type.value if self.income_type else None,
            'budget_goal': float(self.budget_goal) if self.budget_goal else None,
            'profile_picture': self.profile_picture,
            'phone_number': self.phone_number,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        # Include sensitive information only if requested
        if include_sensitive:
            user_dict['password_hash'] = self.password_hash
            
        return user_dict
    
    def __repr__(self):
        return f'<User {self.email}>'
