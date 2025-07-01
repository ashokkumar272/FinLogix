export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  notes: string;
  type: 'income' | 'expense';
}

export type TransactionFilter = 'all' | 'income' | 'expense';
