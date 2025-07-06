import api from './api';
import { User } from '../types/user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone_number?: string;
  income_type?: string;
  budget_goal?: number;
  profile_picture?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
}

export interface ProfileResponse {
  message: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    
    // Store tokens and user data
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/signup', userData);
    
    // Store tokens and user data
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  async updateProfile(profileData: UpdateProfileRequest): Promise<ProfileResponse> {
    const response = await api.put('/auth/profile', profileData);
    
    // Update user data in localStorage
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  async getProfile(): Promise<{ user: User }> {
    const response = await api.get('/auth/profile');
    
    // Update user data in localStorage
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },
};

export default authService;
