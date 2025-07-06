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
    <div className="h-[calc(100vh-80px)] bg-gray-50 flex flex-col overflow-hidden">
      <div className="max-w-2xl mx-auto px-4 py-1 flex-1 flex flex-col min-h-0 w-full">
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm font-medium mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-2">
            <div className="flex items-center justify-center">
              <TransactionTabs 
                activeTab={activeTab} 
                onTabChange={(tab) => setActiveTab(tab as TransactionFilter)} 
              />
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === 'all' ? 'All Transactions' : 
                 activeTab === 'income' ? 'Income Transactions' : 'Expense Transactions'}
              </h2>
              <span className="text-sm text-gray-500">
                {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <TransactionList
              transactions={sortedTransactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </div>
        </div>

        {/* Floating Add Transaction Button */}
        <button
          onClick={handleAddTransaction}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Transactions;