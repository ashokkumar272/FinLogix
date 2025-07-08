import React, { useState, useEffect } from 'react';
import { aiService } from '../services/api';

interface PersonalizedAdviceProps {
  monthlyBudgetGoal?: number;
}

interface AdviceResponse {
  advice: string[];
  data_summary: {
    monthly_income: number;
    monthly_budget_goal: number;
    total_categories: number;
    transactions_analyzed: number;
  };
  generated_at: string;
}

const PersonalizedAdvice: React.FC<PersonalizedAdviceProps> = ({ monthlyBudgetGoal }) => {
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgetGoal, setBudgetGoal] = useState<number>(monthlyBudgetGoal || 2000);

  const fetchAdvice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await aiService.getPersonalizedAdvice(budgetGoal);
      setAdvice(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch personalized advice');
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudgetGoal(Number(e.target.value));
  };

  const handleGetSuggestion = () => {
    fetchAdvice();
  };

  // Show loading state when fetching advice
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-white">Generating personalized advice...</span>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600 mb-4">
          <h3 className="font-semibold">Error</h3>
          <p>{error}</p>
        </div>
        <button
          onClick={handleGetSuggestion}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show initial state with "Get Suggestion" button
  if (!advice) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-2 sm:flex justify-between">
          <h2 className="text-xl font-semibold text-white mb-4">
            💡 Your Personalized Budget Advice
          </h2>
          
          <div className="mb-4">
           
              <button
                onClick={handleGetSuggestion}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                Get Suggestion
              </button>
            
          </div>
        </div>
        
        <div className="text-center py-4">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">Ready for AI-Powered Advice?</h3>
          <p className="text-gray-500 text-sm">
            Click "Get Suggestion" to receive personalized financial advice based on your spending patterns and budget goals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-md p-6">
      <div className="mb-2 sm:flex justify-between">
        <h2 className="text-xl font-semibold text-white mb-4">
          💡 Your Personalized Budget Advice
        </h2>
        
        <div>
          
       
            <button
              onClick={handleGetSuggestion}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Get New Advice
            </button>
      
        </div>
      </div>

      {advice && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-medium bg-gray-800 text-white mb-3">Your Financial Insights:</h3>
            <div className="space-y-3 bg-gray-800">
              {advice.advice.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-800 border border-gray-500 rounded-lg">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-white bg-gray-800 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Generated at: {new Date(advice.generated_at).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};

export default PersonalizedAdvice;
