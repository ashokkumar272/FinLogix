"""
Development utilities for FinLogix Backend
Contains functions for seeding database with sample data and testing
"""

from app import create_app, db
from app.models.user import User, UserRole
from app.models.transaction import Transaction, TransactionType, TransactionCategory
from datetime import datetime, timedelta
from decimal import Decimal
import random

def create_sample_users():
    """Create sample users for development"""
    sample_users = [
        {
            'name': 'John Doe',
            'email': 'john@example.com',
            'password': 'Password123',
            'role': UserRole.USER
        },
        {
            'name': 'Jane Smith',
            'email': 'jane@example.com',
            'password': 'Password123',
            'role': UserRole.USER
        },
        {
            'name': 'Admin User',
            'email': 'admin@finlogix.com',
            'password': 'AdminPass123',
            'role': UserRole.ADMIN
        }
    ]
    
    created_users = []
    for user_data in sample_users:
        # Check if user already exists
        existing_user = User.query.filter_by(email=user_data['email']).first()
        if existing_user:
            print(f"User {user_data['email']} already exists, skipping...")
            created_users.append(existing_user)
            continue
        
        user = User(
            name=user_data['name'],
            email=user_data['email'],
            role=user_data['role']
        )
        user.set_password(user_data['password'])
        
        db.session.add(user)
        created_users.append(user)
    
    db.session.commit()
    print(f"Created {len(created_users)} sample users")
    return created_users

def create_sample_transactions(users, num_transactions=50):
    """Create sample transactions for development"""
    
    # Sample transaction data
    income_data = [
        ('Salary', TransactionCategory.SALARY, 3000, 5000),
        ('Freelance Work', TransactionCategory.FREELANCE, 500, 2000),
        ('Investment Returns', TransactionCategory.INVESTMENT, 100, 800),
        ('Business Income', TransactionCategory.BUSINESS, 1000, 3000),
    ]
    
    expense_data = [
        ('Grocery Shopping', TransactionCategory.FOOD, 50, 200),
        ('Restaurant', TransactionCategory.FOOD, 25, 150),
        ('Gas', TransactionCategory.TRANSPORTATION, 40, 80),
        ('Uber/Taxi', TransactionCategory.TRANSPORTATION, 15, 50),
        ('Rent', TransactionCategory.HOUSING, 1200, 2000),
        ('Electricity Bill', TransactionCategory.UTILITIES, 80, 150),
        ('Internet Bill', TransactionCategory.UTILITIES, 50, 100),
        ('Doctor Visit', TransactionCategory.HEALTHCARE, 100, 300),
        ('Movie Tickets', TransactionCategory.ENTERTAINMENT, 20, 50),
        ('Shopping', TransactionCategory.SHOPPING, 30, 200),
        ('Coffee', TransactionCategory.FOOD, 5, 15),
        ('Gym Membership', TransactionCategory.HEALTHCARE, 50, 100),
    ]
    
    created_transactions = []
    
    # Create transactions for each user
    for user in users:
        if user.role == UserRole.ADMIN:
            continue  # Skip admin user for transactions
            
        user_transactions = num_transactions // len([u for u in users if u.role != UserRole.ADMIN])
        
        for _ in range(user_transactions):
            # Random date within last 6 months
            days_ago = random.randint(0, 180)
            transaction_date = datetime.now() - timedelta(days=days_ago)
            
            # Decide if income or expense (80% expense, 20% income)
            is_income = random.random() < 0.2
            
            if is_income:
                note, category, min_amount, max_amount = random.choice(income_data)
                transaction_type = TransactionType.INCOME
            else:
                note, category, min_amount, max_amount = random.choice(expense_data)
                transaction_type = TransactionType.EXPENSE
            
            # Random amount within range
            amount = Decimal(str(round(random.uniform(min_amount, max_amount), 2)))
            
            transaction = Transaction(
                user_id=user.id,
                amount=amount,
                category=category,
                type=transaction_type,
                note=note,
                created_at=transaction_date,
                updated_at=transaction_date
            )
            
            db.session.add(transaction)
            created_transactions.append(transaction)
    
    db.session.commit()
    print(f"Created {len(created_transactions)} sample transactions")
    return created_transactions

def seed_database():
    """Seed database with sample data"""
    print("🌱 Seeding database with sample data...")
    
    # Create sample users
    users = create_sample_users()
    
    # Create sample transactions
    transactions = create_sample_transactions(users, 100)
    
    print("✅ Database seeding completed!")
    print(f"   - Users: {len(users)}")
    print(f"   - Transactions: {len(transactions)}")

def clear_database():
    """Clear all data from database (use with caution!)"""
    confirm = input("⚠️  This will delete all data. Are you sure? (type 'YES' to confirm): ")
    if confirm != 'YES':
        print("❌ Database clear cancelled")
        return
    
    print("🗑️  Clearing database...")
    
    # Delete in correct order due to foreign key constraints
    Transaction.query.delete()
    User.query.delete()
    
    db.session.commit()
    print("✅ Database cleared successfully")

def print_database_stats():
    """Print current database statistics"""
    print("📊 Database Statistics:")
    print("=" * 30)
    
    # User statistics
    total_users = User.query.count()
    admin_users = User.query.filter_by(role=UserRole.ADMIN).count()
    regular_users = User.query.filter_by(role=UserRole.USER).count()
    
    print(f"👥 Users:")
    print(f"   Total: {total_users}")
    print(f"   Admins: {admin_users}")
    print(f"   Regular: {regular_users}")
    
    # Transaction statistics
    total_transactions = Transaction.query.count()
    income_transactions = Transaction.query.filter_by(type=TransactionType.INCOME).count()
    expense_transactions = Transaction.query.filter_by(type=TransactionType.EXPENSE).count()
    
    print(f"\n💳 Transactions:")
    print(f"   Total: {total_transactions}")
    print(f"   Income: {income_transactions}")
    print(f"   Expenses: {expense_transactions}")
    
    # Financial statistics
    if total_transactions > 0:
        total_income = db.session.query(db.func.sum(Transaction.amount))\
            .filter_by(type=TransactionType.INCOME).scalar() or 0
        total_expenses = db.session.query(db.func.sum(Transaction.amount))\
            .filter_by(type=TransactionType.EXPENSE).scalar() or 0
        
        print(f"\n💰 Financial Summary:")
        print(f"   Total Income: ${total_income:,.2f}")
        print(f"   Total Expenses: ${total_expenses:,.2f}")
        print(f"   Net Balance: ${total_income - total_expenses:,.2f}")

def main():
    """Main function for development utilities"""
    app = create_app()
    
    with app.app_context():
        print("🔧 FinLogix Development Utilities")
        print("=" * 40)
        
        while True:
            print("\nOptions:")
            print("1. Seed database with sample data")
            print("2. Clear database (⚠️  WARNING)")
            print("3. Show database statistics")
            print("4. Exit")
            
            choice = input("\nEnter your choice (1-4): ").strip()
            
            if choice == '1':
                seed_database()
            elif choice == '2':
                clear_database()
            elif choice == '3':
                print_database_stats()
            elif choice == '4':
                print("👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice. Please try again.")

if __name__ == '__main__':
    main()
