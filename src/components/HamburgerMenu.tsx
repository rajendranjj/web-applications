'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Archive, TrendingUp, BarChart3 } from 'lucide-react';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Bug Backlog',
      href: '/backlog',
      icon: Archive,
      current: pathname === '/backlog'
    },
    {
      name: 'Bug Backlog Trend',
      href: '/backlog-trend',
      icon: TrendingUp,
      current: pathname === '/backlog-trend'
    },
    {
      name: 'Triage Analysis',
      href: '/triage',
      icon: BarChart3,
      current: pathname === '/triage'
    }
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Hamburger button */}
      <button
        onClick={toggleMenu}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              Navigation
            </div>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  onClick={closeMenu}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200
                    ${tab.current 
                      ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.name}
                  {tab.current && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}