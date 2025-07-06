import React from 'react';
import { User } from '../types/user';

interface UserProfileCardProps {
  user: User;
  showFullDetails?: boolean;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, showFullDetails = false }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center space-x-4">
        {user.profile_picture ? (
          <img 
            src={user.profile_picture} 
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
          
          {showFullDetails && (
            <div className="mt-2 space-y-1">
              {user.income_type && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Income Type:</span> {user.income_type}
                </p>
              )}
              {user.budget_goal && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Budget Goal:</span> ${user.budget_goal.toFixed(2)}/month
                </p>
              )}
              {user.phone_number && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phone:</span> {user.phone_number}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
