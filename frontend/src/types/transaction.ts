export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  notes: string;
  type: 'income' | 'expense';
  audio_memo_filename?: string;
}

export type TransactionFilter = 'all' | 'income' | 'expense';
