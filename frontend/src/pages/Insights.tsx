import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type DateFilter = 'month' | 'quarter' | 'year' | 'custom';

interface DateRange {
  start: string;
  end: string;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface MonthlyTrend {
  month: number;
  month_name: string;
  income: number;
  expenses: number;
  balance: number;
}

interface Stats {
  this_month?: {
    income: number;
    expenses: number;
    balance: number;
  };
  last_month?: {
    income: number;
    expenses: number;
    balance: number;
  };
  changes?: {
    income_change: number;
    expense_change: number;
  };
  date_range?: {
    start_date: string;
    end_date: string;
    income: number;
    expenses: number;
    balance: number;
  };
  insights: {
    highest_expense_category: string | null;
    highest_expense_amount: number;
    average_transaction_amount: number;
  };
}

const Insights: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ start: '', end: '' });
  
  // Data states
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadInsightsData();
  }, [user, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
      const timeoutId = setTimeout(() => {
        loadInsightsData();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [customDateRange, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDateRangeParams = () => {
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (dateFilter) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        startDate = quarterStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          startDate = customDateRange.start;
          endDate = customDateRange.end;
        }
        break;
    }

    return { start_date: startDate, end_date: endDate };
  };

  const loadInsightsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const dateParams = getDateRangeParams();
      
      const [
        expenseBreakdownResponse,
        incomeBreakdownResponse,
        monthlyTrendsResponse,
        statsResponse
      ] = await Promise.all([
        dashboardService.getCategoryBreakdown({ ...dateParams, type: 'expense' }),
        dashboardService.getCategoryBreakdown({ ...dateParams, type: 'income' }),
        dashboardService.getMonthlyTrends(dateParams),
        dashboardService.getStats(dateParams)
      ]);
      
      setExpenseBreakdown(expenseBreakdownResponse.breakdown);
      setIncomeBreakdown(incomeBreakdownResponse.breakdown);
      setMonthlyTrends(monthlyTrendsResponse.trends);
      setStats(statsResponse.stats);
      
    } catch (err: any) {
      console.error('Error loading insights data:', err);
      setError('Failed to load insights data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Chart configurations
  const expenseChartData = {
    labels: expenseBreakdown.map(item => item.category.replace('_', ' ').toUpperCase()),
    datasets: [
      {
        data: expenseBreakdown.map(item => item.amount),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ],
        borderWidth: 2,
      },
    ],
  };

  const incomeChartData = {
    labels: incomeBreakdown.map(item => item.category.replace('_', ' ').toUpperCase()),
    datasets: [
      {
        data: incomeBreakdown.map(item => item.amount),
        backgroundColor: [
          '#10B981', '#059669', '#047857', '#065F46', '#064E3B'
        ],
        borderWidth: 2,
      },
    ],
  };

  const trendsChartData = {
    labels: monthlyTrends.map(trend => trend.month_name),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrends.map(trend => trend.income),
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        fill: false,
      },
      {
        label: 'Expenses',
        data: monthlyTrends.map(trend => trend.expenses),
        borderColor: '#EF4444',
        backgroundColor: '#EF4444',
        fill: false,
      },
      {
        label: 'Balance',
        data: monthlyTrends.map(trend => trend.balance),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Financial Trends',
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Insights</h1>
          <p className="text-gray-600">Deep dive into your financial patterns and trends</p>
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

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Period</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {(['month', 'quarter', 'year', 'custom'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter === 'month' ? 'This Month' :
                 filter === 'quarter' ? 'This Quarter' :
                 filter === 'year' ? 'This Year' :
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Income Change</p>
                  <p className={`text-2xl font-bold ${(stats.changes?.income_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(stats.changes?.income_change || 0) >= 0 ? '+' : ''}{(stats.changes?.income_change || 0).toFixed(1)}%
                  </p>
                </div>
                <div className={`p-3 rounded-full ${(stats.changes?.income_change || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <svg className={`w-6 h-6 ${(stats.changes?.income_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={(stats.changes?.income_change || 0) >= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expense Change</p>
                  <p className={`text-2xl font-bold ${(stats.changes?.expense_change || 0) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(stats.changes?.expense_change || 0) >= 0 ? '+' : ''}{(stats.changes?.expense_change || 0).toFixed(1)}%
                  </p>
                </div>
                <div className={`p-3 rounded-full ${(stats.changes?.expense_change || 0) <= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <svg className={`w-6 h-6 ${(stats.changes?.expense_change || 0) <= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={(stats.changes?.expense_change || 0) <= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
                  <p className="text-2xl font-bold text-gray-900">${(stats.insights?.average_transaction_amount || 0).toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Expense</p>
                  <p className="text-lg font-bold text-gray-900">{stats.insights?.highest_expense_category?.replace('_', ' ').toUpperCase() || 'None'}</p>
                  <p className="text-sm text-gray-500">${(stats.insights?.highest_expense_amount || 0).toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Expense Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
            {expenseBreakdown.length > 0 ? (
              <div className="h-80">
                <Doughnut data={expenseChartData} options={pieChartOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <p>No expense data available</p>
              </div>
            )}
          </div>

          {/* Income Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Breakdown</h3>
            {incomeBreakdown.length > 0 ? (
              <div className="h-80">
                <Pie data={incomeChartData} options={pieChartOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <p>No income data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          {monthlyTrends.length > 0 ? (
            <div className="h-80">
              <Line data={trendsChartData} options={chartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <p>No trend data available</p>
            </div>
          )}
        </div>

        {/* Financial Insights & Recommendations */}
        {stats && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Insights & Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">💡 Key Insights</h4>
                <ul className="space-y-2 text-sm">
                  {stats.changes && stats.changes.income_change > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Your income has increased by {stats.changes.income_change.toFixed(1)}% compared to last month</span>
                    </li>
                  )}
                  {stats.changes && stats.changes.expense_change > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">⚠</span>
                      <span>Your expenses have increased by {stats.changes.expense_change.toFixed(1)}% compared to last month</span>
                    </li>
                  )}
                  {stats.changes && stats.changes.expense_change < 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Great job! Your expenses decreased by {Math.abs(stats.changes.expense_change).toFixed(1)}% compared to last month</span>
                    </li>
                  )}
                  {stats.insights.highest_expense_category && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">ℹ</span>
                      <span>Your highest expense category is {stats.insights.highest_expense_category.replace('_', ' ').toLowerCase()}</span>
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">📈 Recommendations</h4>
                <ul className="space-y-2 text-sm">
                  {stats.changes && stats.changes.expense_change > 10 && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">💡</span>
                      <span>Consider reviewing your spending patterns to identify areas for cost reduction</span>
                    </li>
                  )}
                  {stats.insights.highest_expense_category === 'food' && stats.insights.highest_expense_amount > 500 && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">💡</span>
                      <span>Consider meal planning and cooking at home to reduce food expenses</span>
                    </li>
                  )}
                  {stats.insights.highest_expense_category === 'entertainment' && stats.insights.highest_expense_amount > 300 && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">💡</span>
                      <span>Look for free or low-cost entertainment alternatives to reduce spending</span>
                    </li>
                  )}
                  {stats.changes && stats.changes.income_change > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">💡</span>
                      <span>Great! Consider saving or investing the extra income for future goals</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">💡</span>
                    <span>Set up automatic transfers to savings to build an emergency fund</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Spending Trend Analysis */}
        {monthlyTrends.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Trend Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Highest Income Month</h4>
                <p className="text-2xl font-bold text-blue-800">
                  {monthlyTrends.reduce((prev, current) => 
                    prev.income > current.income ? prev : current
                  ).month_name}
                </p>
                <p className="text-sm text-blue-600">
                  ${monthlyTrends.reduce((prev, current) => 
                    prev.income > current.income ? prev : current
                  ).income.toFixed(2)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Highest Expense Month</h4>
                <p className="text-2xl font-bold text-red-800">
                  {monthlyTrends.reduce((prev, current) => 
                    prev.expenses > current.expenses ? prev : current
                  ).month_name}
                </p>
                <p className="text-sm text-red-600">
                  ${monthlyTrends.reduce((prev, current) => 
                    prev.expenses > current.expenses ? prev : current
                  ).expenses.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Best Savings Month</h4>
                <p className="text-2xl font-bold text-green-800">
                  {monthlyTrends.reduce((prev, current) => 
                    prev.balance > current.balance ? prev : current
                  ).month_name}
                </p>
                <p className="text-sm text-green-600">
                  ${monthlyTrends.reduce((prev, current) => 
                    prev.balance > current.balance ? prev : current
                  ).balance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Category Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Expense Categories Table */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
            {expenseBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-gray-700">Category</th>
                      <th className="text-right py-2 font-medium text-gray-700">Amount</th>
                      <th className="text-right py-2 font-medium text-gray-700">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseBreakdown.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 text-gray-900">{item.category.replace('_', ' ').toUpperCase()}</td>
                        <td className="py-3 text-right text-gray-900">${item.amount.toFixed(2)}</td>
                        <td className="py-3 text-right text-gray-600">{item.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No expense data available</p>
            )}
          </div>

          {/* Income Categories Table */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Categories</h3>
            {incomeBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-gray-700">Category</th>
                      <th className="text-right py-2 font-medium text-gray-700">Amount</th>
                      <th className="text-right py-2 font-medium text-gray-700">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeBreakdown.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 text-gray-900">{item.category.replace('_', ' ').toUpperCase()}</td>
                        <td className="py-3 text-right text-gray-900">${item.amount.toFixed(2)}</td>
                        <td className="py-3 text-right text-gray-600">{item.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No income data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;

