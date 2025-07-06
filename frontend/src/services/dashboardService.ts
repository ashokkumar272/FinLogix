import api from './api';
import { Transaction } from '../types/transaction';

export interface DashboardSummary {
  summary: {
    total_income: number;
    total_expenses: number;
    balance: number;
    transaction_count: number;
  };
  recent_transactions: BackendTransaction[];
}

export interface BackendTransaction {
  id: number;
  amount: number;
  note: string;
  category: string;
  type: 'income' | 'expense';
  created_at: string;
  updated_at: string;
}

export interface DashboardTransactionsResponse {
  transactions: BackendTransaction[];
}

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
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

export const dashboardService = {
  async getSummary(params?: DateRangeParams): Promise<DashboardSummary> {
    const queryParams = new URLSearchParams();
    
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    
    const url = `/dashboard/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    
    return response.data;
  },

  async getTransactions(params?: DateRangeParams): Promise<{
    transactions: Transaction[];
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    
    const url = `/dashboard/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    
    return {
      transactions: response.data.transactions.map(convertTransaction)
    };
  },

  async getCategoryBreakdown(params?: DateRangeParams & { type?: 'income' | 'expense' }): Promise<{
    breakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    total_amount: number;
    type: string;
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    
    if (params?.type) {
      queryParams.append('type', params.type);
    }
    
    const url = `/dashboard/category-breakdown${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    
    return response.data;
  },

  async getMonthlyTrends(params?: DateRangeParams & { year?: number }): Promise<{
    trends: Array<{
      month: number;
      month_name: string;
      income: number;
      expenses: number;
      balance: number;
    }>;
    year: number;
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    
    if (params?.year) {
      queryParams.append('year', params.year.toString());
    }
    
    const url = `/dashboard/monthly-trends${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    
    return response.data;
  },

  async getStats(params?: DateRangeParams): Promise<{
    stats: {
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
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    
    const url = `/dashboard/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    
    return response.data;
  }
};

export default dashboardService;
