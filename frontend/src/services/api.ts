import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;

// AI Services
export const aiService = {
  getPersonalizedAdvice: async (monthlyBudgetGoal?: number) => {
    const response = await api.post('/ai/personalized-advice', {
      monthly_budget_goal: monthlyBudgetGoal
    });
    return response.data;
  },
  
  getInsights: async () => {
    const response = await api.get('/ai/insights');
    return response.data;
  },
  
  getBudgetSuggestions: async (targetSavingsRate: number = 20) => {
    const response = await api.post('/ai/budget-suggestions', {
      target_savings_rate: targetSavingsRate
    });
    return response.data;
  },
  
  getSpendingForecast: async () => {
    const response = await api.get('/ai/spending-forecast');
    return response.data;
  }
};
