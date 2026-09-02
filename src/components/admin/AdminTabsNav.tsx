'use client';

import React from 'react';
import { Users, FileText, DollarSign } from 'lucide-react';

export type AdminTab = 'residents' | 'tenders' | 'quotes';

interface AdminTabsNavProps {
  activeTab: AdminTab;
  onChangeTab: (tab: AdminTab) => void;
  residentsCount?: number;
  tendersCount?: number;
  quotesCount?: number;
}

export default function AdminTabsNav({
  activeTab,
  onChangeTab,
  residentsCount,
  quotesCount,
}: AdminTabsNavProps) {
  const tabs = [
    {
      id: 'residents' as AdminTab,
      label: 'Nhu Cầu Cư Dân',
      icon: Users,
      badge: residentsCount !== undefined ? `${residentsCount}` : undefined,
    },
    {
      id: 'tenders' as AdminTab,
      label: 'Mời Chào Giá',
      icon: FileText,
      badge: undefined,
    },
    {
      id: 'quotes' as AdminTab,
      label: 'Báo Giá Nhà Cung Cấp',
      icon: DollarSign,
      badge: quotesCount !== undefined && quotesCount > 0 ? `${quotesCount}` : undefined,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-200 mb-6 flex flex-wrap sm:flex-nowrap gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
              isActive
                ? 'bg-kyoto-900 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-champagne-300' : 'text-gray-400'}`} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                  isActive
                    ? 'bg-champagne-400/20 text-champagne-200 border border-champagne-400/40'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
