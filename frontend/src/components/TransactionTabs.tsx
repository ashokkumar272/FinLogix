import React from 'react';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TransactionTabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'all', label: 'All Transactions' },
    { id: 'income', label: 'Income' },
    { id: 'expense', label: 'Expenses' }
  ];

  return (
    <div className="flex w-full">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm w-full font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 text-white'
              : 'text-gray-300 hover:text-gray-100 hover:border-b-2'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TransactionTabs;
