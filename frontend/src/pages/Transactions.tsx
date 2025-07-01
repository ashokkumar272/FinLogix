import React, { useState, useMemo } from 'react';
import { Transaction, TransactionFilter } from '../types/transaction';
import TransactionTabs from '../components/TransactionTabs';
import TransactionList from '../components/TransactionList';
import TransactionModal from '../components/TransactionModal';

const Transactions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TransactionFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  // Mock data - in a real app, this would come from an API or state management
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2025-07-01',
      amount: 3500.00,
      category: 'Salary',
      notes: 'Monthly salary',
      type: 'income'
    },
    {
      id: '2',
      date: '2025-07-01',
      amount: 1200.00,
      category: 'Bills & Utilities',
      notes: 'Rent payment',
      type: 'expense'
    },
    {
      id: '3',
      date: '2025-06-30',
      amount: 85.50,
      category: 'Food & Dining',
      notes: 'Grocery shopping',
      type: 'expense'
    },
    {
      id: '4',
      date: '2025-06-29',
      amount: 250.00,
      category: 'Freelance',
      notes: 'Website design project',
      type: 'income'
    },
    {
      id: '5',
      date: '2025-06-28',
      amount: 45.20,
      category: 'Transportation',
      notes: 'Gas station',
      type: 'expense'
    }
  ]);

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

  // Calculate totals
  const totals = useMemo(() => {
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
  }, [transactions]);

  const handleAddTransaction = () => {
    setModalMode('add');
    setEditingTransaction(undefined);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setModalMode('edit');
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSaveTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    if (modalMode === 'add') {
      const newTransaction: Transaction = {
        ...transactionData,
        id: Date.now().toString() // Simple ID generation - use proper UUID in production
      };
      setTransactions(prev => [newTransaction, ...prev]);
    } else if (editingTransaction) {
      setTransactions(prev => 
        prev.map(t => 
          t.id === editingTransaction.id 
            ? { ...transactionData, id: editingTransaction.id }
            : t
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

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

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
        mode={modalMode}
      />
    </div>
  );
};

export default Transactions;