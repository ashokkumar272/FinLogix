import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Transaction } from '../types/transaction';
import { transactionService } from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';

type DateFilter = 'today' | 'week' | 'month' | 'custom';

interface DateRange {
  start: string;
  end: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: '',
    end: ''
  });

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await transactionService.getTransactions();
      setTransactions(response.transactions);
      
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter transactions based on selected date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start);
          endDate = new Date(customDateRange.end);
          endDate.setHours(23, 59, 59);
        } else {
          return transactions;
        }
        break;
      default:
        return transactions;
    }

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [transactions, dateFilter, customDateRange]);

  // Calculate totals from filtered transactions
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expenses,
      balance: income - expenses
    };
  }, [filteredTransactions]);



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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Get an overview of your financial activity</p>
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
                onClick={() => setDateFilter(filter)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className={`text-3xl font-bold ${
                  totals.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${totals.balance.toFixed(2)}
                </p>
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
                <p className="text-3xl font-bold text-green-600">
                  ${totals.income.toFixed(2)}
                </p>
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
                <p className="text-3xl font-bold text-red-600">
                  ${totals.expenses.toFixed(2)}
                </p>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => handleAddTransaction('income')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Income</h3>
                <p className="text-gray-600">Record a new income transaction</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAddTransaction('expense')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Expense</h3>
                <p className="text-gray-600">Record a new expense transaction</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
