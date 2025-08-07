'use client';

import { BugMetrics } from '@/types/jira';
import { Bug, CheckCircle } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: BugMetrics;
  triageData?: {
    totalTriageIssues: number;
    totalTotalIssues: number;
    overallPercentageTriaged: number;
  };
}

export default function MetricsOverview({ metrics, triageData }: MetricsOverviewProps) {
  const metricCards = [
    {
      title: 'Total Bugs',
      value: metrics.total,
      icon: Bug,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Triaged',
      value: triageData ? triageData.totalTriageIssues : metrics.triaged,
      icon: CheckCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: triageData 
        ? `${triageData.overallPercentageTriaged.toFixed(1)}% of total (${triageData.totalTriageIssues}/${triageData.totalTotalIssues})`
        : `${((metrics.triaged / metrics.total) * 100).toFixed(1)}% of total`
    },
    {
      title: 'Resolved',
      value: metrics.resolved,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      subtitle: `${((metrics.resolved / metrics.total) * 100).toFixed(1)}% of total`
    },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Key Metrics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricCards.map((card, index) => (
          <div key={index} className="card">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">
                    {card.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}