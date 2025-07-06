export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  income_type?: string;
  budget_goal?: number;
  profile_picture?: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone_number?: string;
  income_type?: string;
  budget_goal?: number;
  profile_picture?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const INCOME_TYPES = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'business', label: 'Business' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' }
] as const;

export type IncomeType = typeof INCOME_TYPES[number]['value'];
