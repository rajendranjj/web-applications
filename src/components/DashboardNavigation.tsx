'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Archive, TrendingUp } from 'lucide-react';

export default function DashboardNavigation() {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Bug Backlog',
      href: '/backlog',
      icon: Archive,
      current: pathname === '/backlog'
    },
    {
      name: 'Bug backlog trend',
      href: '/backlog-trend',
      icon: TrendingUp,
      current: pathname === '/backlog-trend'
    },
    {
      name: 'Triage Analysis',
      href: '/',
      icon: BarChart3,
      current: pathname === '/'
    }
  ];

  return (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                ${tab.current
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }
                group inline-flex items-center py-4 px-6 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200
              `}
              aria-current={tab.current ? 'page' : undefined}
            >
              <tab.icon
                className={`
                  ${tab.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
                  -ml-0.5 mr-2 h-5 w-5
                `}
                aria-hidden="true"
              />
              <span>{tab.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}