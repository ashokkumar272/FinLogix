import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InputField from '../components/InputField';
import { authService } from '../services/authService';
import { UserProfile as UserProfileType, PasswordChange, INCOME_TYPES } from '../types/user';

interface UserProfileData {
  name: string;
  email: string;
  phone_number?: string;
  income_type?: string;
  budget_goal?: number;
}

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const UserProfile = () => {
  const { user, setUser } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData>({
    name: '',
    email: '',
    phone_number: '',
    income_type: '',
    budget_goal: undefined
  });
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        income_type: user.income_type || '',
        budget_goal: user.budget_goal || undefined
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: name === 'budget_goal' ? (value === '' ? undefined : Number(value)) : value
    }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare data for API call
      const updateData = {
        name: profileData.name,
        email: profileData.email,
        phone_number: profileData.phone_number || undefined,
        income_type: profileData.income_type || undefined,
        budget_goal: profileData.budget_goal || undefined
      };

      const response = await authService.updateProfile(updateData);
      
      // Update user in context
      setUser(response.user);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      console.error('Profile update error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (passwordData.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await authService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setSuccess('Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <h1 className="text-3xl font-bold text-white">Account Settings</h1>
            <p className="text-blue-100 mt-2">Manage your account and preferences</p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-6 font-medium transition-colors ${
                  activeTab === 'password'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Change Password
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded-lg">
                <p className="text-sm">{success}</p>
              </div>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    name="name"
                    type="text"
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    disabled={isLoading}
                  />
                  <InputField
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    disabled={isLoading}
                  />
                  <InputField
                    name="phone_number"
                    type="tel"
                    label="Phone Number"
                    placeholder="Enter your phone number"
                    value={profileData.phone_number}
                    onChange={handleProfileChange}
                    disabled={isLoading}
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Income Type
                    </label>
                    <select
                      name="income_type"
                      value={profileData.income_type}
                      onChange={handleProfileChange}
                      disabled={isLoading}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">Select income type</option>
                      {INCOME_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <InputField
                    name="budget_goal"
                    type="number"
                    label="Monthly Budget Goal"
                    placeholder="Enter your monthly budget goal"
                    value={profileData.budget_goal || ''}
                    onChange={handleProfileChange}
                    disabled={isLoading}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="max-w-md space-y-4">
                  <InputField
                    name="current_password"
                    type="password"
                    label="Current Password"
                    placeholder="Enter your current password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    required
                    disabled={isLoading}
                  />
                  <InputField
                    name="new_password"
                    type="password"
                    label="New Password"
                    placeholder="Enter your new password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                    disabled={isLoading}
                  />
                  <InputField
                    name="confirm_password"
                    type="password"
                    label="Confirm New Password"
                    placeholder="Confirm your new password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;