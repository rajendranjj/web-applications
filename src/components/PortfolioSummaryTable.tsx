'use client';

import { useMemo } from 'react';
import { JiraIssue } from '@/types/jira';

interface PortfolioSummaryTableProps {
  bugs: JiraIssue[];
  onPortfolioClick: (portfolio: string, unresolvedOnly?: boolean) => void;
}

interface PortfolioSummary {
  portfolio: string;
  totalIssues: number;
  unresolvedIssues: number;
  percentageUnresolved: number;
  managerGroups: string[];
  teams: string[];
}

const resolvedStatuses = ['Done', 'Cancelled', 'Pending Release', 'Released', 'Closed'];

export default function PortfolioSummaryTable({ bugs, onPortfolioClick }: PortfolioSummaryTableProps) {
  const portfolioSummary = useMemo(() => {
    // Group bugs by portfolio
    const portfolioMap = new Map<string, JiraIssue[]>();
    
    bugs.forEach(bug => {
      const portfolio = bug.portfolio || 'Unknown';
      if (!portfolioMap.has(portfolio)) {
        portfolioMap.set(portfolio, []);
      }
      portfolioMap.get(portfolio)!.push(bug);
    });

    // Calculate summary for each portfolio
    const summaries: PortfolioSummary[] = [];
    
    portfolioMap.forEach((portfolioBugs, portfolio) => {
      const totalIssues = portfolioBugs.length;
      const unresolvedIssues = portfolioBugs.filter(bug => 
        !resolvedStatuses.includes(bug.status.name)
      ).length;
      const percentageUnresolved = totalIssues > 0 ? (unresolvedIssues / totalIssues) * 100 : 0;
      
      // Get unique manager groups for this portfolio
      const managerGroups = Array.from(
        new Set(
          portfolioBugs
            .map(bug => bug.managerGroup)
            .filter(group => group !== null && group !== undefined)
        )
      ).sort();

      // Get unique teams for this portfolio
      const teams = Array.from(
        new Set(
          portfolioBugs
            .map(bug => bug.team)
            .filter(team => team !== null && team !== undefined)
        )
      ).sort();

      summaries.push({
        portfolio,
        totalIssues,
        unresolvedIssues,
        percentageUnresolved,
        managerGroups,
        teams
      });
    });

    // Define custom portfolio order
    const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Unknown'];
    
    // Sort by custom portfolio order
    return summaries.sort((a, b) => {
      const indexA = portfolioOrder.indexOf(a.portfolio);
      const indexB = portfolioOrder.indexOf(b.portfolio);
      
      // If both portfolios are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one is in the order array, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // If neither is in the order array, sort alphabetically
      return a.portfolio.localeCompare(b.portfolio);
    });
  }, [bugs]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalIssues = portfolioSummary.reduce((sum, summary) => sum + summary.totalIssues, 0);
    const totalUnresolvedIssues = portfolioSummary.reduce((sum, summary) => sum + summary.unresolvedIssues, 0);
    const overallPercentageUnresolved = totalIssues > 0 ? (totalUnresolvedIssues / totalIssues) * 100 : 0;
    
    return {
      totalIssues,
      totalUnresolvedIssues,
      overallPercentageUnresolved
    };
  }, [portfolioSummary]);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Portfolio Bug Summary
      </h2>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Portfolio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unresolved Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Unresolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teams
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager Groups
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {portfolioSummary.map((summary, index) => (
                <tr key={summary.portfolio} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {summary.portfolio}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    <button
                      onClick={() => onPortfolioClick(summary.portfolio, false)}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors duration-200"
                      title={`View all ${summary.totalIssues} issues for ${summary.portfolio} portfolio`}
                    >
                      {summary.totalIssues}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    <button
                      onClick={() => onPortfolioClick(summary.portfolio, true)}
                      className="text-red-600 hover:text-red-800 hover:underline cursor-pointer transition-colors duration-200"
                      title={`View ${summary.unresolvedIssues} unresolved issues for ${summary.portfolio} portfolio`}
                    >
                      {summary.unresolvedIssues}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {summary.percentageUnresolved.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              summary.percentageUnresolved > 75 
                                ? 'bg-red-500' 
                                : summary.percentageUnresolved > 50 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${summary.percentageUnresolved}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {summary.teams.length > 0 ? (
                        summary.teams.map((team, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {team}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">No teams</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {summary.managerGroups.length > 0 ? (
                        summary.managerGroups.map((group, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {group}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">No manager groups</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-900">
                    TOTAL
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  {totals.totalIssues}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  {totals.totalUnresolvedIssues}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {totals.overallPercentageUnresolved.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            totals.overallPercentageUnresolved > 75 
                              ? 'bg-red-500' 
                              : totals.overallPercentageUnresolved > 50 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${totals.overallPercentageUnresolved}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 italic">
                  {portfolioSummary.length} portfolios
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 italic">
                  All groups
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="mt-4 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="font-medium">Unresolved Status:</span>
            <span>Excludes: Done, Cancelled, Pending Release, Released, Closed</span>
          </div>
          <div className="flex items-center space-x-4 mt-1">
            <span className="font-medium">Progress Colors:</span>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>&lt;50%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>50-75%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>&gt;75%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}