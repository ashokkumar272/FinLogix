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
  audio_memo_filename?: string;
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
  date: new Date(backendTransaction.created_at).toISOString().split('T')[0],
  audio_memo_filename: backendTransaction.audio_memo_filename
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

  async createTransactionWithAudio(transaction: Omit<Transaction, 'id'>, audioBlob?: Blob): Promise<Transaction> {
    const formData = new FormData();
    formData.append('amount', transaction.amount.toString());
    formData.append('note', transaction.notes);
    formData.append('category', transaction.category);
    formData.append('type', transaction.type);
    
    if (audioBlob) {
      formData.append('audio_memo', audioBlob, 'audio_memo.wav');
    }
    
    const response = await api.post('/transactions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return convertTransaction(response.data.transaction);
  },

  async updateTransaction(id: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const backendData = convertToBackend(transaction);
    const response = await api.put(`/transactions/${id}`, backendData);
    return convertTransaction(response.data.transaction);
  },

  async updateTransactionWithAudio(id: string, transaction: Omit<Transaction, 'id'>, audioBlob?: Blob): Promise<Transaction> {
    const formData = new FormData();
    formData.append('amount', transaction.amount.toString());
    formData.append('note', transaction.notes);
    formData.append('category', transaction.category);
    formData.append('type', transaction.type);
    
    if (audioBlob) {
      formData.append('audio_memo', audioBlob, 'audio_memo.wav');
    }
    
    const response = await api.put(`/transactions/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return convertTransaction(response.data.transaction);
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  async getAudioMemo(id: string): Promise<string> {
    const response = await api.get(`/transactions/${id}/audio`, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  },

  async deleteAudioMemo(id: string): Promise<void> {
    await api.delete(`/transactions/${id}/audio`);
  }
};

export default transactionService;
