'use client';

import { AlertTriangle, Clock, Calendar, TrendingUp } from 'lucide-react';

interface BacklogMetrics {
  total: number;
  medium: number;
  low: number;
  bugs30Days: number;
  bugs60Days: number;
  bugs180Days: number;
  bugs365Days: number;
  bugsOver365Days: number;
}

interface BacklogMetricsOverviewProps {
  metrics: BacklogMetrics;
  onAgeFilterClick: (ageFilterType: string) => void;
}

export default function BacklogMetricsOverview({ metrics, onAgeFilterClick }: BacklogMetricsOverviewProps) {
  const metricCards = [
    {
      title: 'Total Backlog',
      value: metrics.total,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: 'Active bugs in backlog',
      filterType: 'all'
    },
    {
      title: 'Bugs >365 Days',
      value: metrics.bugsOver365Days,
      icon: Calendar,
      color: 'text-red-800',
      bgColor: 'bg-red-100',
      subtitle: `${metrics.total > 0 ? ((metrics.bugsOver365Days / metrics.total) * 100).toFixed(1) : 0}% of backlog`,
      filterType: 'over365days'
    },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Backlog Metrics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metricCards.map((card, index) => (
          <button
            key={index}
            className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer text-left w-full"
            onClick={() => onAgeFilterClick(card.filterType)}
            title={`Click to filter bugs by ${card.title.toLowerCase()}`}
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">
                    {card.subtitle}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}