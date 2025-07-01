from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app import db, socketio
from app.models.transaction import Transaction, TransactionType, TransactionCategory
from app.models.user import User
from app.utils.auth_utils import token_required, get_current_user
from datetime import datetime
from decimal import Decimal, InvalidOperation
from sqlalchemy import desc, and_, func, extract

transaction_bp = Blueprint('transaction', __name__)

@transaction_bp.route('', methods=['GET'])
@token_required
def get_transactions():
    """Get user's transactions with pagination and filtering"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        transaction_type = request.args.get('type')
        category = request.args.get('category')
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        
        # Build query
        query = Transaction.query.filter_by(user_id=user.id)
        
        # Apply filters
        if transaction_type:
            try:
                type_enum = TransactionType(transaction_type)
                query = query.filter_by(type=type_enum)
            except ValueError:
                return jsonify({'error': 'Invalid transaction type'}), 400
        
        if category:
            try:
                category_enum = TransactionCategory(category)
                query = query.filter_by(category=category_enum)
            except ValueError:
                return jsonify({'error': 'Invalid category'}), 400
        
        if year:
            query = query.filter(extract('year', Transaction.created_at) == year)
        
        if month:
            query = query.filter(extract('month', Transaction.created_at) == month)
        
        # Order by most recent first
        query = query.order_by(desc(Transaction.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        transactions = [transaction.to_dict() for transaction in pagination.items]
        
        return jsonify({
            'transactions': transactions,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@transaction_bp.route('', methods=['POST'])
@token_required
def create_transaction():
    """Create a new transaction"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'category', 'type']
        errors = []
        
        for field in required_fields:
            if field not in data:
                errors.append(f'{field} is required')
        
        if errors:
            return jsonify({'error': 'Validation failed', 'details': errors}), 400
        
        # Validate and convert amount
        try:
            amount = Decimal(str(data['amount']))
            if amount <= 0:
                return jsonify({'error': 'Amount must be positive'}), 400
        except (InvalidOperation, ValueError):
            return jsonify({'error': 'Invalid amount format'}), 400
        
        # Validate transaction type
        try:
            transaction_type = TransactionType(data['type'])
        except ValueError:
            return jsonify({'error': 'Invalid transaction type'}), 400
        
        # Validate category
        try:
            category = TransactionCategory(data['category'])
        except ValueError:
            return jsonify({'error': 'Invalid category'}), 400
        
        # Validate category matches transaction type
        valid_categories = Transaction.get_categories_by_type(transaction_type)
        if category not in valid_categories:
            return jsonify({'error': f'Category {category.value} is not valid for {transaction_type.value} transactions'}), 400
        
        # Create transaction
        transaction = Transaction(
            user_id=user.id,
            amount=amount,
            category=category,
            type=transaction_type,
            note=data.get('note', '').strip()
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        # Emit real-time update
        socketio.emit('transaction_created', {
            'transaction': transaction.to_dict(),
            'user_id': user.id
        }, room=f'user_{user.id}')
        
        return jsonify({
            'message': 'Transaction created successfully',
            'transaction': transaction.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@transaction_bp.route('/<int:transaction_id>', methods=['GET'])
@token_required
def get_transaction(transaction_id):
    """Get a specific transaction"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        transaction = Transaction.query.filter_by(
            id=transaction_id, 
            user_id=user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        return jsonify({
            'transaction': transaction.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@transaction_bp.route('/<int:transaction_id>', methods=['PUT'])
@token_required
def update_transaction(transaction_id):
    """Update a transaction"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        transaction = Transaction.query.filter_by(
            id=transaction_id, 
            user_id=user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'amount' in data:
            try:
                amount = Decimal(str(data['amount']))
                if amount <= 0:
                    return jsonify({'error': 'Amount must be positive'}), 400
                transaction.amount = amount
            except (InvalidOperation, ValueError):
                return jsonify({'error': 'Invalid amount format'}), 400
        
        if 'type' in data:
            try:
                transaction_type = TransactionType(data['type'])
                transaction.type = transaction_type
            except ValueError:
                return jsonify({'error': 'Invalid transaction type'}), 400
        
        if 'category' in data:
            try:
                category = TransactionCategory(data['category'])
                # Validate category matches transaction type
                valid_categories = Transaction.get_categories_by_type(transaction.type)
                if category not in valid_categories:
                    return jsonify({'error': f'Category {category.value} is not valid for {transaction.type.value} transactions'}), 400
                transaction.category = category
            except ValueError:
                return jsonify({'error': 'Invalid category'}), 400
        
        if 'note' in data:
            transaction.note = data['note'].strip()
        
        transaction.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Emit real-time update
        socketio.emit('transaction_updated', {
            'transaction': transaction.to_dict(),
            'user_id': user.id
        }, room=f'user_{user.id}')
        
        return jsonify({
            'message': 'Transaction updated successfully',
            'transaction': transaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@transaction_bp.route('/<int:transaction_id>', methods=['DELETE'])
@token_required
def delete_transaction(transaction_id):
    """Delete a transaction"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        transaction = Transaction.query.filter_by(
            id=transaction_id, 
            user_id=user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        db.session.delete(transaction)
        db.session.commit()
        
        # Emit real-time update
        socketio.emit('transaction_deleted', {
            'transaction_id': transaction_id,
            'user_id': user.id
        }, room=f'user_{user.id}')
        
        return jsonify({
            'message': 'Transaction deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@transaction_bp.route('/categories', methods=['GET'])
@token_required
def get_categories():
    """Get available categories for transactions"""
    try:
        transaction_type = request.args.get('type')
        
        if transaction_type:
            try:
                type_enum = TransactionType(transaction_type)
                categories = Transaction.get_categories_by_type(type_enum)
                return jsonify({
                    'categories': [cat.value for cat in categories]
                }), 200
            except ValueError:
                return jsonify({'error': 'Invalid transaction type'}), 400
        else:
            # Return all categories grouped by type
            return jsonify({
                'income_categories': [cat.value for cat in Transaction.get_categories_by_type(TransactionType.INCOME)],
                'expense_categories': [cat.value for cat in Transaction.get_categories_by_type(TransactionType.EXPENSE)]
            }), 200
            
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500
