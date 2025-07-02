import api from './api';
import { Transaction } from '../types/transaction';

export interface BackendTransaction {
  id: number;
  amount: number;
  note: string;
  category: string;
  type: 'income' | 'expense';
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  amount: number;
  note: string;
  category: string;
  type: 'income' | 'expense';
}

export interface UpdateTransactionRequest extends CreateTransactionRequest {
  id: string;
}

// Helper function to convert backend transaction to frontend format
const convertTransaction = (backendTransaction: BackendTransaction): Transaction => ({
  id: backendTransaction.id.toString(),
  amount: backendTransaction.amount,
  category: backendTransaction.category,
  notes: backendTransaction.note || '',
  type: backendTransaction.type,
  date: new Date(backendTransaction.created_at).toISOString().split('T')[0]
});

// Helper function to convert frontend transaction to backend format
const convertToBackend = (transaction: Omit<Transaction, 'id'>): CreateTransactionRequest => ({
  amount: transaction.amount,
  note: transaction.notes,
  category: transaction.category,
  type: transaction.type
});

export const transactionService = {
  async getTransactions(): Promise<{
    transactions: Transaction[];
  }> {
    const response = await api.get('/transactions');
    
    return {
      transactions: response.data.transactions.map(convertTransaction)
    };
  },

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const backendData = convertToBackend(transaction);
    const response = await api.post('/transactions', backendData);
    return convertTransaction(response.data.transaction);
  },

  async updateTransaction(id: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const backendData = convertToBackend(transaction);
    const response = await api.put(`/transactions/${id}`, backendData);
    return convertTransaction(response.data.transaction);
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  }
};

export default transactionService;
