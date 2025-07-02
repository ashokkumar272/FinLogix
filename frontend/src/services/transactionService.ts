import api from './api';
import { Transaction } from '../types/transaction';

export interface BackendTransaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
}

export interface UpdateTransactionRequest extends CreateTransactionRequest {
  id: string;
}

export interface TransactionFilters {
  page?: number;
  per_page?: number;
  type?: 'income' | 'expense';
  category?: string;
  month?: number;
  year?: number;
}

export interface TransactionResponse {
  transactions: BackendTransaction[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Helper function to convert backend transaction to frontend format
const convertTransaction = (backendTransaction: BackendTransaction): Transaction => ({
  id: backendTransaction.id,
  amount: backendTransaction.amount,
  category: backendTransaction.category,
  notes: backendTransaction.description,
  type: backendTransaction.type,
  date: new Date(backendTransaction.created_at).toISOString().split('T')[0]
});

// Helper function to convert frontend transaction to backend format
const convertToBackend = (transaction: Omit<Transaction, 'id'>): CreateTransactionRequest => ({
  amount: transaction.amount,
  description: transaction.notes,
  category: transaction.category,
  type: transaction.type
});

export const transactionService = {
  async getTransactions(filters: TransactionFilters = {}): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/transactions?${params.toString()}`);
    
    return {
      transactions: response.data.transactions.map(convertTransaction),
      total: response.data.total,
      page: response.data.page,
      per_page: response.data.per_page,
      total_pages: response.data.total_pages
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
  },

  async getTransactionStats(filters: { month?: number; year?: number } = {}): Promise<{
    total_income: number;
    total_expenses: number;
    net_balance: number;
    transaction_count: number;
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/transactions/stats?${params.toString()}`);
    return response.data;
  }
};

export default transactionService;
