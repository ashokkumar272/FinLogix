import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, TransactionFilter } from '../types/transaction';
import TransactionTabs from '../components/TransactionTabs';
import TransactionList from '../components/TransactionList';
import { transactionService } from '../services/transactionService';

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TransactionFilter>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState({
    income: 0,
    expenses: 0,
    balance: 0
  });

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await transactionService.getTransactions();
      
      setTransactions(response.transactions);
      
      // Calculate totals
      const income = response.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = response.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      setTotals({
        income,
        expenses,
        balance: income - expenses
      });
      
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter transactions based on active tab
  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') return transactions;
    return transactions.filter(transaction => transaction.type === activeTab);
  }, [transactions, activeTab]);

  // Sort transactions by date (newest first)
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredTransactions]);

  const handleAddTransaction = () => {
    navigate('/add-transaction');
  };

  const handleEditTransaction = (transaction: Transaction) => {
    navigate('/add-transaction', { 
      state: { transaction, mode: 'edit' } 
    });
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionService.deleteTransaction(id);
        await loadTransactions(); // Reload transactions
      } catch (err: any) {
        console.error('Error deleting transaction:', err);
        setError('Failed to delete transaction. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totals.income.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ${totals.expenses.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Balance</p>
                <p className={`text-2xl font-bold ${
                  totals.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${totals.balance.toFixed(2)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                totals.balance >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <svg className={`w-6 h-6 ${
                  totals.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TransactionTabs 
                activeTab={activeTab} 
                onTabChange={(tab) => setActiveTab(tab as TransactionFilter)} 
              />
              
              <button
                onClick={handleAddTransaction}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Transaction
              </button>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === 'all' ? 'All Transactions' : 
                 activeTab === 'income' ? 'Income Transactions' : 'Expense Transactions'}
              </h2>
              <span className="text-sm text-gray-500">
                {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <TransactionList
              transactions={sortedTransactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;