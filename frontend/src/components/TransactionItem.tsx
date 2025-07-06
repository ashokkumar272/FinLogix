import React, { useState, useRef } from 'react';
import { Transaction } from '../types/transaction';
import { transactionService } from '../services/transactionService';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  onEdit, 
  onDelete 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = async () => {
    try {
      if (!audioUrl) {
        const url = await transactionService.getAudioMemo(transaction.id);
        setAudioUrl(url);
        
        // Wait for audio to load
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
          }
        }, 100);
      } else {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, type: string) => {
    const formatted = Math.abs(amount).toFixed(2);
    return type === 'income' ? `+$${formatted}` : `-$${formatted}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-500">{formatDate(transaction.date)}</span>
            </div>
            <span className={`text-lg font-semibold ${
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatAmount(transaction.amount, transaction.type)}
            </span>
          </div>
          
          <div className="mb-2">
            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
              {transaction.category}
            </span>
          </div>
          
          {transaction.notes && (
            <p className="text-sm text-gray-600 truncate">{transaction.notes}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {transaction.audio_memo_filename && (
            <button
              onClick={isPlaying ? pauseAudio : playAudio}
              className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title={isPlaying ? 'Pause audio memo' : 'Play audio memo'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => onEdit(transaction)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Edit transaction"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete transaction"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};

export default TransactionItem;
