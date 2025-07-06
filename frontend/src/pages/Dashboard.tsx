import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Transaction } from '../types/transaction';
import { dashboardService, DashboardSummary } from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';
import PersonalizedAdvice from '../components/PersonalizedAdvice';

type DateFilter = 'today' | 'week' | 'month' | 'custom';

interface DateRange {
  start: string;
  end: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: '',
    end: ''
  });

  // Load dashboard data on component mount and when date filters change
  useEffect(() => {
    loadDashboardData();
  }, [user, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect for custom date range to avoid excessive API calls
  useEffect(() => {
    if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
      // Add a small delay to avoid excessive API calls while user is still typing
      const timeoutId = setTimeout(() => {
        loadDashboardData();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [customDateRange, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDateRangeParams = () => {
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (dateFilter) {
      case 'today':
        startDate = now.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          startDate = customDateRange.start;
          endDate = customDateRange.end;
        }
        break;
      default:
        break;
    }

    return { start_date: startDate, end_date: endDate };
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const dateParams = getDateRangeParams();
      
      // Load summary and transactions in parallel
      const [summaryResponse, transactionsResponse] = await Promise.all([
        dashboardService.getSummary(dateParams),
        dashboardService.getTransactions(dateParams)
      ]);
      
      setSummary(summaryResponse);
      setTransactions(transactionsResponse.transactions);
      
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals from backend summary data
  const totals = useMemo(() => {
    if (summary) {
      return {
        income: summary.summary.total_income,
        expenses: summary.summary.total_expenses,
        balance: summary.summary.balance
      };
    }
    
    // Fallback to frontend calculation if summary is not available
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expenses,
      balance: income - expenses
    };
  }, [summary, transactions]);



  const handleAddTransaction = (type: 'income' | 'expense') => {
    navigate('/add-transaction', { 
      state: { initialType: type } 
    });
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'custom':
        return 'Custom Range';
      default:
        return 'All Time';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Get an overview of your financial activity</p>
            </div>
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm font-medium mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Budget Goal Progress */}
        {user?.budget_goal && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Budget Goal</h3>
              <Link 
                to="/profile" 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit Goal
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Budget Goal: ${user.budget_goal.toFixed(2)}</span>
                <span>Current Expenses: ${totals.expenses.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    totals.expenses > user.budget_goal ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min((totals.expenses / user.budget_goal) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className={`${
                  totals.expenses > user.budget_goal ? 'text-red-600' : 'text-green-600'
                }`}>
                  {totals.expenses > user.budget_goal 
                    ? `Over budget by $${(totals.expenses - user.budget_goal).toFixed(2)}`
                    : `Remaining: $${(user.budget_goal - totals.expenses).toFixed(2)}`
                  }
                </span>
                <span className="text-gray-500">
                  {((totals.expenses / user.budget_goal) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Time Period</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {(['today', 'week', 'month', 'custom'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setDateFilter(filter);
                  // Clear custom date range when switching away from custom
                  if (filter !== 'custom') {
                    setCustomDateRange({ start: '', end: '' });
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter === 'today' ? 'Today' :
                 filter === 'week' ? 'This Week' :
                 filter === 'month' ? 'This Month' :
                 'Custom Range'}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={loadDashboardData}
                  disabled={!customDateRange.start || !customDateRange.end || isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Apply Filter'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                {isLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                ) : (
                  <p className={`text-3xl font-bold ${
                    totals.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${totals.balance.toFixed(2)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">{getDateFilterLabel()}</p>
              </div>
              <div className={`p-3 rounded-full ${
                totals.balance >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <svg className={`w-8 h-8 ${
                  totals.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                {isLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                ) : (
                  <p className="text-3xl font-bold text-green-600">
                    ${totals.income.toFixed(2)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">{getDateFilterLabel()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                {isLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                ) : (
                  <p className="text-3xl font-bold text-red-600">
                    ${totals.expenses.toFixed(2)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">{getDateFilterLabel()}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* View Insights Button */}
        <div className="mb-8">
          <Link
            to="/insights"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-sm inline-block"
          >
            View Insights
          </Link>
        </div>

        {/* Personalized Advice */}
        <div className="mb-8">
          <PersonalizedAdvice monthlyBudgetGoal={user?.budget_goal} />
        </div>

        {/* Quick Actions */}
        
      </div>
    </div>
  );
};

export default Dashboard;
