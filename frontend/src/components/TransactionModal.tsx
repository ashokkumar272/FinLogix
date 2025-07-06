import React, { useState, useEffect } from 'react';
import { Transaction } from '../types/transaction';
import InputField from './InputField';
import AudioRecorder from './AudioRecorder';
import { transactionService } from '../services/transactionService';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>, audioBlob?: Blob) => void;
  transaction?: Transaction;
  mode: 'add' | 'edit';
  initialType?: 'income' | 'expense';
}

const incomeCategories = [
  'salary',
  'freelance', 
  'business',
  'investment',
  'other_income'
];

const expenseCategories = [
  'food',
  'transportation',
  'housing', 
  'utilities',
  'healthcare',
  'entertainment',
  'shopping',
  'education',
  'travel',
  'other_expense'
];

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
  mode,
  initialType
}) => {
  const [formData, setFormData] = useState({
    date: transaction?.date || new Date().toISOString().split('T')[0],
    amount: transaction?.amount?.toString() || '',
    category: transaction?.category || '',
    notes: transaction?.notes || '',
    type: transaction?.type || initialType || 'expense' as 'income' | 'expense'
  });

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [initialAudioUrl, setInitialAudioUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const getAvailableCategories = () => {
    return formData.type === 'income' ? incomeCategories : expenseCategories;
  };

  // Reset form when modal opens or transaction changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: transaction?.date || new Date().toISOString().split('T')[0],
        amount: transaction?.amount?.toString() || '',
        category: transaction?.category || '',
        notes: transaction?.notes || '',
        type: transaction?.type || initialType || 'expense' as 'income' | 'expense'
      });
      
      // Load existing audio memo if editing
      if (transaction?.id && transaction?.audio_memo_filename) {
        setIsLoadingAudio(true);
        transactionService.getAudioMemo(transaction.id)
          .then(audioUrl => {
            setInitialAudioUrl(audioUrl);
            setIsLoadingAudio(false);
          })
          .catch(error => {
            console.error('Error loading audio memo:', error);
            setIsLoadingAudio(false);
          });
      } else {
        setInitialAudioUrl(null);
      }
      
      // Reset audio blob
      setAudioBlob(null);
    }
  }, [isOpen, transaction, initialType]);

  // Reset category when type changes
  useEffect(() => {
    const availableCategories = formData.type === 'income' ? incomeCategories : expenseCategories;
    if (formData.category && !availableCategories.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: '' }));
    }
  }, [formData.type, formData.category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      notes: formData.notes,
      type: formData.type
    }, audioBlob || undefined);

    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {mode === 'add' ? 'Add Transaction' : 'Edit Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-200">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            
            <InputField
              type="date"
              name="date"
              label="Date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <InputField
            type="number"
            name="amount"
            label="Amount"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-200">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a category</option>
              {getAvailableCategories().map((category) => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-200">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <AudioRecorder
              onAudioRecorded={setAudioBlob}
              onAudioDeleted={() => setAudioBlob(null)}
              initialAudioUrl={initialAudioUrl || undefined}
              disabled={isLoadingAudio}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {mode === 'add' ? 'Add Transaction' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
