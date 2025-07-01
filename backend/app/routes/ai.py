from flask import Blueprint, request, jsonify
from app import db
from app.models.transaction import Transaction, TransactionType, TransactionCategory
from app.models.user import User
from app.utils.auth_utils import token_required, get_current_user
from sqlalchemy import func, extract, and_, desc
from datetime import datetime, timedelta
from decimal import Decimal
import calendar

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/insights', methods=['GET'])
@token_required
def get_insights():
    """Generate AI-powered financial insights"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        insights = []
        
        # Get current month data
        now = datetime.now()
        current_month = now.month
        current_year = now.year
        
        # This month's spending analysis
        this_month_expenses = Transaction.query.filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.type == TransactionType.EXPENSE,
                extract('year', Transaction.created_at) == current_year,
                extract('month', Transaction.created_at) == current_month
            )
        ).with_entities(func.sum(Transaction.amount)).scalar() or Decimal('0')
        
        # Last month's spending
        last_month = current_month - 1 if current_month > 1 else 12
        last_month_year = current_year if current_month > 1 else current_year - 1
        
        last_month_expenses = Transaction.query.filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.type == TransactionType.EXPENSE,
                extract('year', Transaction.created_at) == last_month_year,
                extract('month', Transaction.created_at) == last_month
            )
        ).with_entities(func.sum(Transaction.amount)).scalar() or Decimal('0')
        
        # Spending trend insight
        if last_month_expenses > 0:
            spending_change = ((this_month_expenses - last_month_expenses) / last_month_expenses) * 100
            if spending_change > 20:
                insights.append({
                    'type': 'warning',
                    'title': 'High Spending Alert',
                    'message': f'Your spending has increased by {spending_change:.1f}% compared to last month.',
                    'recommendation': 'Consider reviewing your recent expenses and identifying areas to cut back.'
                })
            elif spending_change < -20:
                insights.append({
                    'type': 'success',
                    'title': 'Great Job!',
                    'message': f'You\'ve reduced your spending by {abs(spending_change):.1f}% compared to last month.',
                    'recommendation': 'Keep up the good work with mindful spending!'
                })
        
        # Category spending analysis
        category_spending = db.session.query(
            Transaction.category,
            func.sum(Transaction.amount).label('total')
        ).filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.type == TransactionType.EXPENSE,
                extract('year', Transaction.created_at) == current_year,
                extract('month', Transaction.created_at) == current_month
            )
        ).group_by(Transaction.category).order_by(desc('total')).all()
        
        if category_spending:
            top_category = category_spending[0]
            total_expenses = sum(amount for _, amount in category_spending)
            if total_expenses > 0:
                percentage = (top_category.total / total_expenses) * 100
                if percentage > 40:
                    insights.append({
                        'type': 'info',
                        'title': 'Category Concentration',
                        'message': f'Your {top_category.category.value} expenses account for {percentage:.1f}% of your total spending.',
                        'recommendation': f'Consider diversifying your spending or finding ways to reduce {top_category.category.value} costs.'
                    })
        
        # Income vs Expense analysis
        this_month_income = Transaction.query.filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.type == TransactionType.INCOME,
                extract('year', Transaction.created_at) == current_year,
                extract('month', Transaction.created_at) == current_month
            )
        ).with_entities(func.sum(Transaction.amount)).scalar() or Decimal('0')
        
        if this_month_income > 0:
            expense_ratio = (this_month_expenses / this_month_income) * 100
            if expense_ratio > 90:
                insights.append({
                    'type': 'warning',
                    'title': 'High Expense Ratio',
                    'message': f'You\'re spending {expense_ratio:.1f}% of your income this month.',
                    'recommendation': 'Try to aim for spending less than 80% of your income to build savings.'
                })
            elif expense_ratio < 60:
                insights.append({
                    'type': 'success',
                    'title': 'Excellent Savings Rate',
                    'message': f'You\'re only spending {expense_ratio:.1f}% of your income.',
                    'recommendation': 'Great job saving! Consider investing your surplus for long-term growth.'
                })
        
        # Frequency analysis
        frequent_small_transactions = Transaction.query.filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.type == TransactionType.EXPENSE,
                Transaction.amount < 20,
                extract('year', Transaction.created_at) == current_year,
                extract('month', Transaction.created_at) == current_month
            )
        ).count()
        
        if frequent_small_transactions > 20:
            insights.append({
                'type': 'info',
                'title': 'Frequent Small Purchases',
                'message': f'You made {frequent_small_transactions} small purchases (under $20) this month.',
                'recommendation': 'These small expenses can add up. Consider tracking them more carefully.'
            })
        
        return jsonify({
            'insights': insights,
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@ai_bp.route('/budget-suggestions', methods=['POST'])
@token_required
def get_budget_suggestions():
    """Generate budget suggestions based on spending patterns"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        target_savings_rate = data.get('target_savings_rate', 20)  # Default 20%
        
        # Get last 3 months of data for analysis
        three_months_ago = datetime.now() - timedelta(days=90)
        
        # Calculate average monthly income and expenses
        monthly_data = db.session.query(
            extract('year', Transaction.created_at).label('year'),
            extract('month', Transaction.created_at).label('month'),
            Transaction.type,
            func.sum(Transaction.amount).label('total')
        ).filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.created_at >= three_months_ago
            )
        ).group_by(
            extract('year', Transaction.created_at),
            extract('month', Transaction.created_at),
            Transaction.type
        ).all()
        
        # Calculate averages
        monthly_incomes = []
        monthly_expenses = []
        
        for year, month, transaction_type, total in monthly_data:
            if transaction_type == TransactionType.INCOME:
                monthly_incomes.append(float(total))
            else:
                monthly_expenses.append(float(total))
        
        avg_monthly_income = sum(monthly_incomes) / len(monthly_incomes) if monthly_incomes else 0
        avg_monthly_expenses = sum(monthly_expenses) / len(monthly_expenses) if monthly_expenses else 0
        
        # Calculate category averages
        category_averages = db.session.query(
            Transaction.category,
            func.avg(func.sum(Transaction.amount)).label('avg_amount')
        ).filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.type == TransactionType.EXPENSE,
                Transaction.created_at >= three_months_ago
            )
        ).group_by(
            Transaction.category,
            extract('year', Transaction.created_at),
            extract('month', Transaction.created_at)
        ).group_by(Transaction.category).all()
        
        # Calculate target budget
        target_total_expenses = avg_monthly_income * (100 - target_savings_rate) / 100
        
        suggestions = []
        category_budgets = {}
        
        if avg_monthly_expenses > target_total_expenses:
            # Need to reduce spending
            reduction_needed = avg_monthly_expenses - target_total_expenses
            suggestions.append({
                'type': 'budget_overview',
                'message': f'To achieve {target_savings_rate}% savings rate, you need to reduce spending by ${reduction_needed:.2f} per month.',
                'current_expenses': avg_monthly_expenses,
                'target_expenses': target_total_expenses,
                'reduction_needed': reduction_needed
            })
            
            # Suggest category-wise reductions
            total_category_spending = sum(avg for _, avg in category_averages)
            for category, avg_amount in category_averages:
                proportion = avg_amount / total_category_spending if total_category_spending > 0 else 0
                suggested_budget = target_total_expenses * proportion
                category_budgets[category.value] = suggested_budget
                
                if avg_amount > suggested_budget:
                    reduction = avg_amount - suggested_budget
                    suggestions.append({
                        'type': 'category_reduction',
                        'category': category.value,
                        'current_average': avg_amount,
                        'suggested_budget': suggested_budget,
                        'reduction_needed': reduction,
                        'message': f'Consider reducing {category.value} spending by ${reduction:.2f} per month.'
                    })
        else:
            # Already meeting savings goal
            current_savings_rate = ((avg_monthly_income - avg_monthly_expenses) / avg_monthly_income) * 100
            suggestions.append({
                'type': 'success',
                'message': f'Great job! You\'re already saving {current_savings_rate:.1f}% of your income.',
                'current_savings_rate': current_savings_rate
            })
            
            # Provide maintenance budgets
            for category, avg_amount in category_averages:
                category_budgets[category.value] = avg_amount * 1.1  # 10% buffer
        
        return jsonify({
            'suggestions': suggestions,
            'category_budgets': category_budgets,
            'target_savings_rate': target_savings_rate,
            'analysis_period': '3 months',
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@ai_bp.route('/spending-forecast', methods=['GET'])
@token_required
def get_spending_forecast():
    """Forecast spending for the rest of the month"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        days_passed = now.day
        days_in_month = calendar.monthrange(current_year, current_month)[1]
        days_remaining = days_in_month - days_passed
        
        # Get current month's spending so far
        current_month_expenses = Transaction.query.filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.type == TransactionType.EXPENSE,
                extract('year', Transaction.created_at) == current_year,
                extract('month', Transaction.created_at) == current_month
            )
        ).with_entities(func.sum(Transaction.amount)).scalar() or Decimal('0')
        
        # Get daily average from current month
        daily_average_current = float(current_month_expenses) / days_passed if days_passed > 0 else 0
        
        # Get historical daily average (last 3 months)
        three_months_ago = datetime.now() - timedelta(days=90)
        historical_expenses = Transaction.query.filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.type == TransactionType.EXPENSE,
                Transaction.created_at >= three_months_ago,
                Transaction.created_at < datetime(current_year, current_month, 1)
            )
        ).with_entities(func.sum(Transaction.amount)).scalar() or Decimal('0')
        
        historical_days = 90 - days_passed  # Approximate
        daily_average_historical = float(historical_expenses) / historical_days if historical_days > 0 else 0
        
        # Create different forecasting scenarios
        forecasts = []
        
        # Scenario 1: Continue current month's trend
        projected_remaining_current = daily_average_current * days_remaining
        projected_total_current = float(current_month_expenses) + projected_remaining_current
        
        forecasts.append({
            'scenario': 'Current Trend',
            'description': 'Based on your spending pattern this month',
            'projected_remaining': projected_remaining_current,
            'projected_total': projected_total_current,
            'confidence': 'High' if days_passed >= 7 else 'Medium'
        })
        
        # Scenario 2: Historical average
        projected_remaining_historical = daily_average_historical * days_remaining
        projected_total_historical = float(current_month_expenses) + projected_remaining_historical
        
        forecasts.append({
            'scenario': 'Historical Average',
            'description': 'Based on your average daily spending over the last 3 months',
            'projected_remaining': projected_remaining_historical,
            'projected_total': projected_total_historical,
            'confidence': 'Medium'
        })
        
        # Scenario 3: Conservative (20% higher than current trend)
        projected_remaining_conservative = projected_remaining_current * 1.2
        projected_total_conservative = float(current_month_expenses) + projected_remaining_conservative
        
        forecasts.append({
            'scenario': 'Conservative',
            'description': '20% higher than current trend (for budgeting buffer)',
            'projected_remaining': projected_remaining_conservative,
            'projected_total': projected_total_conservative,
            'confidence': 'High'
        })
        
        # Get category breakdown for current month
        category_spending = db.session.query(
            Transaction.category,
            func.sum(Transaction.amount).label('total')
        ).filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.type == TransactionType.EXPENSE,
                extract('year', Transaction.created_at) == current_year,
                extract('month', Transaction.created_at) == current_month
            )
        ).group_by(Transaction.category).all()
        
        category_forecasts = []
        for category, amount in category_spending:
            daily_avg = float(amount) / days_passed if days_passed > 0 else 0
            projected_remaining = daily_avg * days_remaining
            projected_total = float(amount) + projected_remaining
            
            category_forecasts.append({
                'category': category.value,
                'current_spending': float(amount),
                'projected_remaining': projected_remaining,
                'projected_total': projected_total
            })
        
        return jsonify({
            'forecasts': forecasts,
            'category_forecasts': category_forecasts,
            'current_spending': float(current_month_expenses),
            'days_passed': days_passed,
            'days_remaining': days_remaining,
            'daily_averages': {
                'current_month': daily_average_current,
                'historical': daily_average_historical
            },
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500
