from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User, UserRole
from app.models.transaction import Transaction, TransactionType
from app.utils.auth_utils import admin_required, get_current_user
from sqlalchemy import func, desc, and_, extract
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Get all users (admin only)"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '').strip()
        role_filter = request.args.get('role')
        
        # Build query
        query = User.query
        
        # Apply search filter
        if search:
            query = query.filter(
                User.name.ilike(f'%{search}%') | 
                User.email.ilike(f'%{search}%')
            )
        
        # Apply role filter
        if role_filter:
            try:
                role_enum = UserRole(role_filter)
                query = query.filter_by(role=role_enum)
            except ValueError:
                return jsonify({'error': 'Invalid role filter'}), 400
        
        # Order by creation date (newest first)
        query = query.order_by(desc(User.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        users_data = []
        for user in pagination.items:
            user_dict = user.to_dict()
            # Add transaction count
            user_dict['transaction_count'] = Transaction.query.filter_by(user_id=user.id).count()
            users_data.append(user_dict)
        
        return jsonify({
            'users': users_data,
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

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user_details(user_id):
    """Get detailed information about a specific user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's financial summary
        total_income = Transaction.query.filter_by(
            user_id=user.id, 
            type=TransactionType.INCOME
        ).with_entities(func.sum(Transaction.amount)).scalar() or 0
        
        total_expenses = Transaction.query.filter_by(
            user_id=user.id,
            type=TransactionType.EXPENSE
        ).with_entities(func.sum(Transaction.amount)).scalar() or 0
        
        transaction_count = Transaction.query.filter_by(user_id=user.id).count()
        
        # Get recent transactions
        recent_transactions = Transaction.query.filter_by(user_id=user.id)\
            .order_by(desc(Transaction.created_at)).limit(10).all()
        
        user_dict = user.to_dict()
        user_dict.update({
            'financial_summary': {
                'total_income': float(total_income),
                'total_expenses': float(total_expenses),
                'balance': float(total_income - total_expenses),
                'transaction_count': transaction_count
            },
            'recent_transactions': [t.to_dict() for t in recent_transactions]
        })
        
        return jsonify({'user': user_dict}), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(user_id):
    """Update a user's role"""
    try:
        current_admin = get_current_user()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent admin from changing their own role
        if user.id == current_admin.id:
            return jsonify({'error': 'Cannot change your own role'}), 403
        
        data = request.get_json()
        new_role = data.get('role')
        
        if not new_role:
            return jsonify({'error': 'Role is required'}), 400
        
        try:
            role_enum = UserRole(new_role)
        except ValueError:
            return jsonify({'error': 'Invalid role'}), 400
        
        user.role = role_enum
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'User role updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_admin_dashboard():
    """Get admin dashboard statistics"""
    try:
        # Total users
        total_users = User.query.count()
        admin_users = User.query.filter_by(role=UserRole.ADMIN).count()
        regular_users = User.query.filter_by(role=UserRole.USER).count()
        
        # New users this month
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_users_this_month = User.query.filter(User.created_at >= current_month_start).count()
        
        # Transaction statistics
        total_transactions = Transaction.query.count()
        total_income = Transaction.query.filter_by(type=TransactionType.INCOME)\
            .with_entities(func.sum(Transaction.amount)).scalar() or 0
        total_expenses = Transaction.query.filter_by(type=TransactionType.EXPENSE)\
            .with_entities(func.sum(Transaction.amount)).scalar() or 0
        
        # Transactions this month
        transactions_this_month = Transaction.query.filter(
            Transaction.created_at >= current_month_start
        ).count()
        
        # Most active users (by transaction count)
        most_active_users = db.session.query(
            User.id,
            User.name,
            User.email,
            func.count(Transaction.id).label('transaction_count')
        ).join(Transaction).group_by(User.id, User.name, User.email)\
         .order_by(desc('transaction_count')).limit(5).all()
        
        # Monthly user growth (last 6 months)
        monthly_growth = []
        for i in range(5, -1, -1):
            month_start = (datetime.now().replace(day=1) - timedelta(days=i*30)).replace(day=1)
            if i > 0:
                month_end = (datetime.now().replace(day=1) - timedelta(days=(i-1)*30)).replace(day=1)
            else:
                month_end = datetime.now()
            
            new_users = User.query.filter(
                and_(User.created_at >= month_start, User.created_at < month_end)
            ).count()
            
            monthly_growth.append({
                'month': month_start.strftime('%B %Y'),
                'new_users': new_users
            })
        
        # Platform activity summary
        activity_summary = db.session.query(
            func.date(Transaction.created_at).label('date'),
            func.count(Transaction.id).label('transaction_count'),
            func.count(func.distinct(Transaction.user_id)).label('active_users')
        ).filter(
            Transaction.created_at >= datetime.now() - timedelta(days=7)
        ).group_by(func.date(Transaction.created_at)).all()
        
        return jsonify({
            'overview': {
                'total_users': total_users,
                'admin_users': admin_users,
                'regular_users': regular_users,
                'new_users_this_month': new_users_this_month,
                'total_transactions': total_transactions,
                'transactions_this_month': transactions_this_month
            },
            'financial_overview': {
                'total_income': float(total_income),
                'total_expenses': float(total_expenses),
                'platform_volume': float(total_income + total_expenses)
            },
            'most_active_users': [
                {
                    'id': user_id,
                    'name': name,
                    'email': email,
                    'transaction_count': count
                }
                for user_id, name, email, count in most_active_users
            ],
            'monthly_growth': monthly_growth,
            'recent_activity': [
                {
                    'date': activity.date.isoformat(),
                    'transaction_count': activity.transaction_count,
                    'active_users': activity.active_users
                }
                for activity in activity_summary
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/transactions', methods=['GET'])
@admin_required
def get_all_transactions():
    """Get all transactions across the platform (admin only)"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        user_id = request.args.get('user_id', type=int)
        transaction_type = request.args.get('type')
        
        # Build query
        query = Transaction.query.join(User)
        
        # Apply filters
        if user_id:
            query = query.filter(Transaction.user_id == user_id)
        
        if transaction_type:
            try:
                type_enum = TransactionType(transaction_type)
                query = query.filter(Transaction.type == type_enum)
            except ValueError:
                return jsonify({'error': 'Invalid transaction type'}), 400
        
        # Order by most recent first
        query = query.order_by(desc(Transaction.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        transactions_data = []
        for transaction in pagination.items:
            transaction_dict = transaction.to_dict()
            # Add user information
            transaction_dict['user'] = {
                'id': transaction.user.id,
                'name': transaction.user.name,
                'email': transaction.user.email
            }
            transactions_data.append(transaction_dict)
        
        return jsonify({
            'transactions': transactions_data,
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
