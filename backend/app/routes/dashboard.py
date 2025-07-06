from flask import Blueprint, request, jsonify
from app import db
from app.models.transaction import Transaction, TransactionType, TransactionCategory
from app.models.user import User
from app.utils.auth_utils import token_required, get_current_user
from sqlalchemy import func, extract, and_
from datetime import datetime, timedelta
from decimal import Decimal

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary', methods=['GET'])
@token_required
def get_summary():
    """Get financial summary for the user"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters for date filtering
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Base query for user's transactions
        base_query = Transaction.query.filter_by(user_id=user.id)
        
        # Apply date range filters if provided (takes precedence over month/year)
        if start_date and end_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                # Include the entire end date by adding 1 day and using less than
                end_date_obj = end_date_obj + timedelta(days=1)
                base_query = base_query.filter(
                    and_(
                        Transaction.created_at >= start_date_obj,
                        Transaction.created_at < end_date_obj
                    )
                )
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        elif start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                base_query = base_query.filter(Transaction.created_at >= start_date_obj)
            except ValueError:
                return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
        elif end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                # Include the entire end date by adding 1 day and using less than
                end_date_obj = end_date_obj + timedelta(days=1)
                base_query = base_query.filter(Transaction.created_at < end_date_obj)
            except ValueError:
                return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
        # Apply traditional month/year filters if no date range is provided
        elif year:
            base_query = base_query.filter(extract('year', Transaction.created_at) == year)
            if month:
                base_query = base_query.filter(extract('month', Transaction.created_at) == month)
        
        # Calculate total income
        total_income = base_query.filter_by(type=TransactionType.INCOME).with_entities(
            func.coalesce(func.sum(Transaction.amount), Decimal('0'))
        ).scalar()
        
        # Calculate total expenses
        total_expenses = base_query.filter_by(type=TransactionType.EXPENSE).with_entities(
            func.coalesce(func.sum(Transaction.amount), Decimal('0'))
        ).scalar()
        
        # Calculate balance
        balance = total_income - total_expenses
        
        # Get transaction count
        transaction_count = base_query.count()
        
        # Get recent transactions (last 5)
        recent_transactions = base_query.order_by(Transaction.created_at.desc()).limit(5).all()
        
        return jsonify({
            'summary': {
                'total_income': float(total_income),
                'total_expenses': float(total_expenses),
                'balance': float(balance),
                'transaction_count': transaction_count
            },
            'recent_transactions': [t.to_dict() for t in recent_transactions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@dashboard_bp.route('/category-breakdown', methods=['GET'])
@token_required
def get_category_breakdown():
    """Get spending breakdown by category"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        transaction_type = request.args.get('type', 'expense')  # Default to expenses
        
        # Validate transaction type
        try:
            type_enum = TransactionType(transaction_type)
        except ValueError:
            return jsonify({'error': 'Invalid transaction type'}), 400
        
        # Base query
        query = Transaction.query.filter_by(user_id=user.id, type=type_enum)
        
        # Apply date range filters if provided (takes precedence over month/year)
        if start_date and end_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                # Include the entire end date by adding 1 day and using less than
                end_date_obj = end_date_obj + timedelta(days=1)
                query = query.filter(
                    and_(
                        Transaction.created_at >= start_date_obj,
                        Transaction.created_at < end_date_obj
                    )
                )
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        elif start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(Transaction.created_at >= start_date_obj)
            except ValueError:
                return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
        elif end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                # Include the entire end date by adding 1 day and using less than
                end_date_obj = end_date_obj + timedelta(days=1)
                query = query.filter(Transaction.created_at < end_date_obj)
            except ValueError:
                return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
        # Apply traditional month/year filters if no date range is provided
        elif year:
            query = query.filter(extract('year', Transaction.created_at) == year)
            if month:
                query = query.filter(extract('month', Transaction.created_at) == month)
        
        # Group by category and sum amounts
        category_data = query.with_entities(
            Transaction.category,
            func.sum(Transaction.amount).label('total')
        ).group_by(Transaction.category).all()
        
        # Format response
        breakdown = []
        total_amount = Decimal('0')
        
        for category, amount in category_data:
            breakdown.append({
                'category': category.value,
                'amount': float(amount),
                'percentage': 0  # Will calculate after getting total
            })
            total_amount += amount
        
        # Calculate percentages
        if total_amount > 0:
            for item in breakdown:
                item['percentage'] = round((item['amount'] / float(total_amount)) * 100, 2)
        
        # Sort by amount descending
        breakdown.sort(key=lambda x: x['amount'], reverse=True)
        
        return jsonify({
            'breakdown': breakdown,
            'total_amount': float(total_amount),
            'type': transaction_type
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@dashboard_bp.route('/monthly-trends', methods=['GET'])
@token_required
def get_monthly_trends():
    """Get monthly income and expense trends"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters for date filtering
        year = request.args.get('year', datetime.now().year, type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Base filter conditions
        filter_conditions = [Transaction.user_id == user.id]
        
        # Apply date range filters if provided (takes precedence over year)
        if start_date and end_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                # Include the entire end date by adding 1 day and using less than
                end_date_obj = end_date_obj + timedelta(days=1)
                filter_conditions.extend([
                    Transaction.created_at >= start_date_obj,
                    Transaction.created_at < end_date_obj
                ])
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        elif start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                filter_conditions.append(Transaction.created_at >= start_date_obj)
            except ValueError:
                return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
        elif end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                # Include the entire end date by adding 1 day and using less than
                end_date_obj = end_date_obj + timedelta(days=1)
                filter_conditions.append(Transaction.created_at < end_date_obj)
            except ValueError:
                return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
        # Apply traditional year filter if no date range is provided
        elif year:
            filter_conditions.append(extract('year', Transaction.created_at) == year)
        
        # Query for monthly data
        monthly_data = db.session.query(
            extract('month', Transaction.created_at).label('month'),
            Transaction.type,
            func.sum(Transaction.amount).label('total')
        ).filter(
            and_(*filter_conditions)
        ).group_by(
            extract('month', Transaction.created_at),
            Transaction.type
        ).all()
        
        # Initialize data structure for 12 months
        trends = []
        for month in range(1, 13):
            month_data = {
                'month': month,
                'month_name': datetime(year, month, 1).strftime('%B'),
                'income': 0,
                'expenses': 0,
                'balance': 0
            }
            trends.append(month_data)
        
        # Populate with actual data
        for month_num, transaction_type, total in monthly_data:
            month_index = int(month_num) - 1  # Convert to 0-based index
            if transaction_type == TransactionType.INCOME:
                trends[month_index]['income'] = float(total)
            else:
                trends[month_index]['expenses'] = float(total)
        
        # Calculate balance for each month
        for month_data in trends:
            month_data['balance'] = month_data['income'] - month_data['expenses']
        
        return jsonify({
            'trends': trends,
            'year': year
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@dashboard_bp.route('/stats', methods=['GET'])
@token_required
def get_stats():
    """Get various statistics about user's finances"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters for date filtering
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Get current month and year
        now = datetime.now()
        current_month = now.month
        current_year = now.year
        
        # If date range is provided, use it instead of current/last month comparison
        if start_date and end_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                # Include the entire end date by adding 1 day and using less than
                end_date_obj = end_date_obj + timedelta(days=1)
                
                # Query for the specified date range
                date_range_query = Transaction.query.filter(
                    and_(
                        Transaction.user_id == user.id,
                        Transaction.created_at >= start_date_obj,
                        Transaction.created_at < end_date_obj
                    )
                )
                
                # Calculate stats for the date range
                range_income = date_range_query.filter_by(type=TransactionType.INCOME).with_entities(
                    func.coalesce(func.sum(Transaction.amount), Decimal('0'))
                ).scalar()
                
                range_expenses = date_range_query.filter_by(type=TransactionType.EXPENSE).with_entities(
                    func.coalesce(func.sum(Transaction.amount), Decimal('0'))
                ).scalar()
                
                # Get highest expense category in the date range
                highest_expense_category = date_range_query.filter_by(type=TransactionType.EXPENSE).with_entities(
                    Transaction.category,
                    func.sum(Transaction.amount).label('total')
                ).group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).first()
                
                # Get average transaction amount in the date range
                avg_transaction = date_range_query.with_entities(
                    func.avg(Transaction.amount)
                ).scalar()
                
                return jsonify({
                    'stats': {
                        'date_range': {
                            'start_date': start_date,
                            'end_date': end_date,
                            'income': float(range_income),
                            'expenses': float(range_expenses),
                            'balance': float(range_income - range_expenses)
                        },
                        'insights': {
                            'highest_expense_category': highest_expense_category[0].value if highest_expense_category else None,
                            'highest_expense_amount': float(highest_expense_category[1]) if highest_expense_category else 0,
                            'average_transaction_amount': float(avg_transaction) if avg_transaction else 0
                        }
                    }
                }), 200
                
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Default behavior: current month vs last month comparison
        # This month's transactions
        this_month_query = Transaction.query.filter(
            and_(
                Transaction.user_id == user.id,
                extract('year', Transaction.created_at) == current_year,
                extract('month', Transaction.created_at) == current_month
            )
        )
        
        # Last month's transactions
        last_month = current_month - 1 if current_month > 1 else 12
        last_month_year = current_year if current_month > 1 else current_year - 1
        
        last_month_query = Transaction.query.filter(
            and_(
                Transaction.user_id == user.id,
                extract('year', Transaction.created_at) == last_month_year,
                extract('month', Transaction.created_at) == last_month
            )
        )
        
        # Calculate this month's stats
        this_month_income = this_month_query.filter_by(type=TransactionType.INCOME).with_entities(
            func.coalesce(func.sum(Transaction.amount), Decimal('0'))
        ).scalar()
        
        this_month_expenses = this_month_query.filter_by(type=TransactionType.EXPENSE).with_entities(
            func.coalesce(func.sum(Transaction.amount), Decimal('0'))
        ).scalar()
        
        # Calculate last month's stats
        last_month_income = last_month_query.filter_by(type=TransactionType.INCOME).with_entities(
            func.coalesce(func.sum(Transaction.amount), Decimal('0'))
        ).scalar()
        
        last_month_expenses = last_month_query.filter_by(type=TransactionType.EXPENSE).with_entities(
            func.coalesce(func.sum(Transaction.amount), Decimal('0'))
        ).scalar()
        
        # Calculate percentage changes
        def calculate_percentage_change(current, previous):
            if previous == 0:
                return 100 if current > 0 else 0
            return round(((current - previous) / previous) * 100, 2)
        
        income_change = calculate_percentage_change(this_month_income, last_month_income)
        expense_change = calculate_percentage_change(this_month_expenses, last_month_expenses)
        
        # Get highest expense category this month
        highest_expense_category = this_month_query.filter_by(type=TransactionType.EXPENSE).with_entities(
            Transaction.category,
            func.sum(Transaction.amount).label('total')
        ).group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).first()
        
        # Get average transaction amount
        avg_transaction = Transaction.query.filter_by(user_id=user.id).with_entities(
            func.avg(Transaction.amount)
        ).scalar()
        
        return jsonify({
            'stats': {
                'this_month': {
                    'income': float(this_month_income),
                    'expenses': float(this_month_expenses),
                    'balance': float(this_month_income - this_month_expenses)
                },
                'last_month': {
                    'income': float(last_month_income),
                    'expenses': float(last_month_expenses),
                    'balance': float(last_month_income - last_month_expenses)
                },
                'changes': {
                    'income_change': income_change,
                    'expense_change': expense_change
                },
                'insights': {
                    'highest_expense_category': highest_expense_category[0].value if highest_expense_category else None,
                    'highest_expense_amount': float(highest_expense_category[1]) if highest_expense_category else 0,
                    'average_transaction_amount': float(avg_transaction) if avg_transaction else 0
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@dashboard_bp.route('/transactions', methods=['GET'])
@token_required
def get_transactions():
    """Get transactions with optional date range filtering"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Base query
        query = Transaction.query.filter_by(user_id=user.id)
        
        # Apply date range filter if provided
        if start_date and end_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                # Include the entire end date by adding 1 day and using less than
                end_date_obj = end_date_obj + timedelta(days=1)
                query = query.filter(
                    and_(
                        Transaction.updated_at >= start_date_obj,
                        Transaction.updated_at < end_date_obj
                    )
                )
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Get transactions ordered by date (newest first)
        transactions = query.order_by(Transaction.updated_at.desc()).all()
        
        return jsonify({
            'transactions': [t.to_dict() for t in transactions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500
