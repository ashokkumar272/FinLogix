from flask import Blueprint, request, jsonify, send_file
from app import db, socketio
from app.models.transaction import Transaction, TransactionType, TransactionCategory
from app.utils.auth_utils import token_required, get_current_user
from datetime import datetime
from decimal import Decimal, InvalidOperation
from sqlalchemy import desc
import os
import uuid
from werkzeug.utils import secure_filename

transaction_bp = Blueprint('transaction', __name__)

# Audio memo configuration
AUDIO_UPLOAD_FOLDER = 'audio_memos'
ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'ogg', 'webm', 'm4a'}
MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10MB limit

def allowed_audio_file(filename):
    """Check if uploaded file is an allowed audio format"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_AUDIO_EXTENSIONS

def save_audio_memo(audio_file, user_id):
    """Save audio memo file and return filename"""
    if not audio_file or not allowed_audio_file(audio_file.filename):
        return None
    
    # Create audio upload directory if it doesn't exist
    upload_dir = os.path.join(os.getcwd(), AUDIO_UPLOAD_FOLDER)
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = audio_file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{user_id}_{uuid.uuid4().hex}.{file_extension}"
    
    # Save file
    file_path = os.path.join(upload_dir, unique_filename)
    audio_file.save(file_path)
    
    return unique_filename

def delete_audio_memo(filename):
    """Delete audio memo file"""
    if filename:
        file_path = os.path.join(os.getcwd(), AUDIO_UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            os.remove(file_path)

def validate_transaction_data(data, is_update=False):
    """Centralized validation for transaction data"""
    errors = []
    
    # Required fields for creation
    if not is_update:
        required_fields = ['amount', 'category', 'type']
        for field in required_fields:
            if field not in data:
                errors.append(f'{field} is required')
    
    # Validate amount if provided
    if 'amount' in data:
        try:
            amount = Decimal(str(data['amount']))
            if amount <= 0:
                errors.append('Amount must be positive')
        except (InvalidOperation, ValueError):
            errors.append('Invalid amount format')
    
    # Validate transaction type if provided
    transaction_type = None
    if 'type' in data:
        try:
            transaction_type = TransactionType(data['type'])
        except ValueError:
            errors.append('Invalid transaction type')
    
    # Validate category if provided
    category = None
    if 'category' in data:
        try:
            category = TransactionCategory(data['category'])
            # Validate category matches transaction type
            if transaction_type:
                valid_categories = Transaction.get_categories_by_type(transaction_type)
                if category not in valid_categories:
                    errors.append(f'Category {category.value} is not valid for {transaction_type.value} transactions')
        except ValueError:
            errors.append('Invalid category')
    
    return errors, {'amount': amount if 'amount' in data else None, 
                   'type': transaction_type, 'category': category}

def emit_transaction_event(event_type, data, user_id):
    """Centralized socket emission"""
    socketio.emit(event_type, data, room=f'user_{user_id}')

def handle_transaction_error(e):
    """Centralized error handling"""
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

@transaction_bp.route('', methods=['GET'])
@token_required
def get_transactions():
    """Get user's transactions"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        transactions = Transaction.query.filter_by(user_id=user.id)\
            .order_by(desc(Transaction.created_at)).all()
        
        return jsonify({
            'transactions': [transaction.to_dict() for transaction in transactions]
        }), 200
        
    except Exception as e:
        return handle_transaction_error(e)

@transaction_bp.route('', methods=['POST'])
@token_required
def create_transaction():
    """Create a new transaction"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
            audio_file = None
        else:
            data = request.form.to_dict()
            audio_file = request.files.get('audio_memo')
        
        errors, validated_data = validate_transaction_data(data)
        
        if errors:
            return jsonify({'error': 'Validation failed', 'details': errors}), 400
        
        # Handle audio memo upload
        audio_filename = None
        if audio_file:
            audio_filename = save_audio_memo(audio_file, user.id)
            if not audio_filename:
                return jsonify({'error': 'Invalid audio file format'}), 400
        
        transaction = Transaction(
            user_id=user.id,
            amount=validated_data['amount'],
            category=validated_data['category'],
            type=validated_data['type'],
            note=data.get('note', '').strip(),
            audio_memo_filename=audio_filename
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        emit_transaction_event('transaction_created', {
            'transaction': transaction.to_dict(),
            'user_id': user.id
        }, user.id)
        
        return jsonify({
            'message': 'Transaction created successfully',
            'transaction': transaction.to_dict()
        }), 201
        
    except Exception as e:
        return handle_transaction_error(e)

@transaction_bp.route('/<int:transaction_id>', methods=['GET'])
@token_required
def get_transaction(transaction_id):
    """Get a specific transaction"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        transaction = Transaction.query.filter_by(
            id=transaction_id, user_id=user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        return jsonify({'transaction': transaction.to_dict()}), 200
        
    except Exception as e:
        return handle_transaction_error(e)

@transaction_bp.route('/<int:transaction_id>', methods=['PUT'])
@token_required
def update_transaction(transaction_id):
    """Update a transaction"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        transaction = Transaction.query.filter_by(
            id=transaction_id, user_id=user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
            audio_file = None
        else:
            data = request.form.to_dict()
            audio_file = request.files.get('audio_memo')
        
        errors, validated_data = validate_transaction_data(data, is_update=True)
        
        if errors:
            return jsonify({'error': 'Validation failed', 'details': errors}), 400
        
        # Handle audio memo upload
        if audio_file:
            # Delete old audio memo if exists
            if transaction.audio_memo_filename:
                delete_audio_memo(transaction.audio_memo_filename)
            
            # Save new audio memo
            audio_filename = save_audio_memo(audio_file, user.id)
            if not audio_filename:
                return jsonify({'error': 'Invalid audio file format'}), 400
            transaction.audio_memo_filename = audio_filename
        
        # Update fields
        for field, value in validated_data.items():
            if value is not None:
                setattr(transaction, field, value)
        
        if 'note' in data:
            transaction.note = data['note'].strip()
        
        transaction.updated_at = datetime.utcnow()
        db.session.commit()
        
        emit_transaction_event('transaction_updated', {
            'transaction': transaction.to_dict(),
            'user_id': user.id
        }, user.id)
        
        return jsonify({
            'message': 'Transaction updated successfully',
            'transaction': transaction.to_dict()
        }), 200
        
    except Exception as e:
        return handle_transaction_error(e)

@transaction_bp.route('/<int:transaction_id>', methods=['DELETE'])
@token_required
def delete_transaction(transaction_id):
    """Delete a transaction"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        transaction = Transaction.query.filter_by(
            id=transaction_id, user_id=user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Delete audio memo file if exists
        if transaction.audio_memo_filename:
            delete_audio_memo(transaction.audio_memo_filename)
        
        db.session.delete(transaction)
        db.session.commit()
        
        emit_transaction_event('transaction_deleted', {
            'transaction_id': transaction_id,
            'user_id': user.id
        }, user.id)
        
        return jsonify({'message': 'Transaction deleted successfully'}), 200
        
    except Exception as e:
        return handle_transaction_error(e)

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
                return jsonify({'categories': [cat.value for cat in categories]}), 200
            except ValueError:
                return jsonify({'error': 'Invalid transaction type'}), 400
        else:
            return jsonify({
                'income_categories': [cat.value for cat in Transaction.get_categories_by_type(TransactionType.INCOME)],
                'expense_categories': [cat.value for cat in Transaction.get_categories_by_type(TransactionType.EXPENSE)]
            }), 200
            
    except Exception as e:
        return handle_transaction_error(e)

@transaction_bp.route('/<int:transaction_id>/audio', methods=['GET'])
@token_required
def get_audio_memo(transaction_id):
    """Get audio memo for a transaction"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        transaction = Transaction.query.filter_by(
            id=transaction_id, user_id=user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        if not transaction.audio_memo_filename:
            return jsonify({'error': 'No audio memo found'}), 404
        
        file_path = os.path.join(os.getcwd(), AUDIO_UPLOAD_FOLDER, transaction.audio_memo_filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Audio file not found'}), 404
        
        return send_file(file_path, as_attachment=False)
        
    except Exception as e:
        return handle_transaction_error(e)

@transaction_bp.route('/<int:transaction_id>/audio', methods=['DELETE'])
@token_required
def delete_audio_memo_route(transaction_id):
    """Delete audio memo for a transaction"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        transaction = Transaction.query.filter_by(
            id=transaction_id, user_id=user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        if not transaction.audio_memo_filename:
            return jsonify({'error': 'No audio memo found'}), 404
        
        # Delete the audio file
        delete_audio_memo(transaction.audio_memo_filename)
        
        # Update the transaction record
        transaction.audio_memo_filename = None
        transaction.updated_at = datetime.utcnow()
        db.session.commit()
        
        emit_transaction_event('transaction_updated', {
            'transaction': transaction.to_dict(),
            'user_id': user.id
        }, user.id)
        
        return jsonify({'message': 'Audio memo deleted successfully'}), 200
        
    except Exception as e:
        return handle_transaction_error(e)