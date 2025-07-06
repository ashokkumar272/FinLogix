from app import db
from datetime import datetime
from enum import Enum
from sqlalchemy import DECIMAL

class TransactionType(Enum):
    INCOME = "income"
    EXPENSE = "expense"

class TransactionCategory(Enum):
    # Income categories
    SALARY = "salary"
    FREELANCE = "freelance"
    BUSINESS = "business"
    INVESTMENT = "investment"
    OTHER_INCOME = "other_income"
    
    # Expense categories
    FOOD = "food"
    TRANSPORTATION = "transportation"
    HOUSING = "housing"
    UTILITIES = "utilities"
    HEALTHCARE = "healthcare"
    ENTERTAINMENT = "entertainment"
    SHOPPING = "shopping"
    EDUCATION = "education"
    TRAVEL = "travel"
    OTHER_EXPENSE = "other_expense"

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    amount = db.Column(DECIMAL(10, 2), nullable=False)
    category = db.Column(db.Enum(TransactionCategory), nullable=False)
    type = db.Column(db.Enum(TransactionType), nullable=False)
    note = db.Column(db.Text)
    audio_memo_filename = db.Column(db.String(255), nullable=True)  # Store filename of audio memo
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert transaction object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': float(self.amount),
            'category': self.category.value,
            'type': self.type.value,
            'note': self.note,
            'audio_memo_filename': self.audio_memo_filename,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @staticmethod
    def get_categories_by_type(transaction_type):
        """Get categories for a specific transaction type"""
        if transaction_type == TransactionType.INCOME:
            return [
                TransactionCategory.SALARY,
                TransactionCategory.FREELANCE,
                TransactionCategory.BUSINESS,
                TransactionCategory.INVESTMENT,
                TransactionCategory.OTHER_INCOME
            ]
        else:
            return [
                TransactionCategory.FOOD,
                TransactionCategory.TRANSPORTATION,
                TransactionCategory.HOUSING,
                TransactionCategory.UTILITIES,
                TransactionCategory.HEALTHCARE,
                TransactionCategory.ENTERTAINMENT,
                TransactionCategory.SHOPPING,
                TransactionCategory.EDUCATION,
                TransactionCategory.TRAVEL,
                TransactionCategory.OTHER_EXPENSE
            ]
    
    def __repr__(self):
        return f'<Transaction {self.id}: {self.type.value} ${self.amount}>'
