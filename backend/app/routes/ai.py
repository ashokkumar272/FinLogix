from flask import Blueprint, request, jsonify
from app import db
from app.models.transaction import Transaction, TransactionType, TransactionCategory
from app.models.user import User
from app.utils.auth_utils import token_required, get_current_user
from sqlalchemy import func, extract, and_, desc
from datetime import datetime, timedelta
from decimal import Decimal
import calendar
import requests
import json
import os

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
            func.avg(func.sum(Transaction.amount)).label('avg_amount'
        )).filter(
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

@ai_bp.route('/personalized-advice', methods=['POST'])
@token_required
def get_personalized_advice():
    """Generate personalized budgeting advice using Gemini AI"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        monthly_budget_goal = data.get('monthly_budget_goal')
        
        # Get current month data
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        
        # Get monthly income
        monthly_income = Transaction.query.filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.type == TransactionType.INCOME,
                extract('year', Transaction.created_at) == current_year,
                extract('month', Transaction.created_at) == current_month
            )
        ).with_entities(func.sum(Transaction.amount)).scalar() or Decimal('0')
        
        # Get last 30 days of transactions for detailed analysis
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_transactions = Transaction.query.filter(
            and_(
                Transaction.user_id == user.id,
                Transaction.created_at >= thirty_days_ago
            )
        ).order_by(Transaction.created_at.desc()).all()
        
        # Format transaction data for AI analysis
        transaction_data = []
        for transaction in recent_transactions:
            transaction_data.append({
                'amount': float(transaction.amount),
                'type': transaction.type.value,
                'category': transaction.category.value,
                'date': transaction.created_at.strftime('%Y-%m-%d'),
                'note': transaction.note or ''
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
        
        category_breakdown = {}
        for category, amount in category_spending:
            category_breakdown[category.value] = float(amount)
        
        # Prepare data for AI analysis
        analysis_data = {
            'monthly_income': float(monthly_income),
            'monthly_budget_goal': monthly_budget_goal,
            'category_breakdown': category_breakdown,
            'recent_transactions': transaction_data[:20],  # Last 20 transactions
            'analysis_period': '30 days'
        }
        
        # Generate AI advice using Gemini
        ai_advice = generate_gemini_advice(analysis_data)
        
        return jsonify({
            'advice': ai_advice,
            'data_summary': {
                'monthly_income': float(monthly_income),
                'monthly_budget_goal': monthly_budget_goal,
                'total_categories': len(category_breakdown),
                'transactions_analyzed': len(transaction_data)
            },
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

def generate_gemini_advice(data):
    """Generate personalized advice using Gemini AI API"""
    try:
        # Get API configuration
        from flask import current_app
        api_key = current_app.config.get('GEMINI_API_KEY')
        api_url = current_app.config.get('GEMINI_API_URL')
        
        if not api_key:
            return ["Unable to generate personalized advice at this time."]
        
        # Calculate total spending by category
        total_spending = sum(data['category_breakdown'].values())
        
        prompt = f"""
        You are a smart and friendly personal finance assistant for an app called FinLogix. 

        Analyze this user's financial data and provide personalized budgeting advice:

        Monthly Income: ${data['monthly_income']:.2f}
        Monthly Budget Goal: ${data.get('monthly_budget_goal', 'Not specified')}
        Current Month Category Spending:
        """

        for category, amount in data['category_breakdown'].items():
            percentage = (amount / total_spending * 100) if total_spending > 0 else 0
            prompt += f"- {category}: ${amount:.2f} ({percentage:.1f}%)\n"

        prompt += f"""

        Recent transaction patterns from the last {data['analysis_period']}:
        """

        # Add recent transactions summary
        income_count = sum(1 for t in data['recent_transactions'] if t['type'] == 'income')
        expense_count = sum(1 for t in data['recent_transactions'] if t['type'] == 'expense')

        prompt += f"- Total transactions: {len(data['recent_transactions'])} ({income_count} income, {expense_count} expenses)\n"

        # Add category frequency analysis
        category_frequency = {}
        for transaction in data['recent_transactions']:
            if transaction['type'] == 'expense':
                category = transaction['category']
                category_frequency[category] = category_frequency.get(category, 0) + 1

        if category_frequency:
            most_frequent = max(category_frequency, key=category_frequency.get)
            prompt += f"- Most frequent spending category: {most_frequent} ({category_frequency[most_frequent]} transactions)\n"

        prompt += f"""

        Please provide exactly three short bullet points of personalized budgeting advice:

        1. Identify any overspending or budget imbalances
        2. Recognize spikes in specific categories (e.g., Dining, Travel, Shopping)
        3. Mention positive habits if they exist
        4. Suggest practical, actionable tips

        Requirements:
        - Use simple, friendly language
        - Keep each point under 80 words
        - Be helpful and non-judgmental
        - Focus on actionable advice
        - If data is insufficient, provide general savings advice

        Respond with exactly three short bullet points of advice. Do not include JSON or any extra formatting—just the three points. Ensure not adding headers. Just plain text.
        """
        
        # Make API call to Gemini
        headers = {
            'Content-Type': 'application/json',
        }
        
        payload = {
            'contents': [
                {
                    'parts': [
                        {
                            'text': prompt
                        }
                    ]
                }
            ]
        }
        
        response = requests.post(
            f"{api_url}?key={api_key}",
            headers=headers,
            json=payload,
            timeout=30
        )
        print(response.json())
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                generated_text = result['candidates'][0]['content']['parts'][0]['text']
                
                # Try to parse as JSON first
                try:
                    advice_list = json.loads(generated_text)
                    if isinstance(advice_list, list):
                        return advice_list
                except json.JSONDecodeError:
                    pass
                
                # If not JSON, split by bullet points or lines
                advice_lines = []
                lines = generated_text.split('\n')
                for line in lines:
                    line = line.strip()
                    if line and (line.startswith('•') or line.startswith('-') or line.startswith('*') or line[0].isdigit()):
                        # Clean up the line
                        cleaned_line = line.lstrip('•-*0123456789. ').strip()
                        if cleaned_line:
                            advice_lines.append(cleaned_line)
                
                return advice_lines[:3] if advice_lines else [generated_text[:200] + "..."]
        
        # Fallback advice if API fails
        return generate_fallback_advice(data)
        
    except Exception as e:
        return generate_fallback_advice(data)

def generate_fallback_advice(data):
    """Generate basic advice when AI API is unavailable"""
    advice = []
    
    monthly_income = data.get('monthly_income', 0)
    monthly_budget_goal = data.get('monthly_budget_goal')
    category_breakdown = data.get('category_breakdown', {})
    
    total_spending = sum(category_breakdown.values())
    
    # Basic spending analysis
    if monthly_income > 0:
        spending_ratio = (total_spending / monthly_income) * 100
        if spending_ratio > 90:
            advice.append("You're spending over 90% of your income this month. Consider reviewing your expenses and identifying areas where you can cut back to build an emergency fund.")
        elif spending_ratio < 50:
            advice.append("Great job! You're maintaining a healthy spending ratio. Consider investing your surplus income for long-term financial growth.")
    
    # Category analysis
    if category_breakdown:
        top_category = max(category_breakdown, key=category_breakdown.get)
        top_amount = category_breakdown[top_category]
        
        if total_spending > 0:
            percentage = (top_amount / total_spending) * 100
            if percentage > 40:
                advice.append(f"Your {top_category} spending accounts for {percentage:.0f}% of your total expenses. Consider setting a specific budget limit for this category to better control spending.")
    
    # Budget goal comparison
    if monthly_budget_goal and total_spending > monthly_budget_goal:
        overspend = total_spending - monthly_budget_goal
        advice.append(f"You're ${overspend:.2f} over your monthly budget goal. Try tracking daily expenses and using the 50/30/20 rule: 50% needs, 30% wants, 20% savings.")
    
    # Default advice if no specific insights
    if not advice:
        advice.append("Keep track of your daily expenses and review your spending weekly. Small, consistent changes in spending habits can lead to significant savings over time.")
    
    return advice[:3]  # Return max 3 pieces of advice
