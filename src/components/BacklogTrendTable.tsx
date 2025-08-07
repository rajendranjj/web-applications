'use client';

import { useMemo, useState } from 'react';
import { JiraIssue } from '@/types/jira';

interface BacklogTrendTableProps {
  trendData: Record<string, JiraIssue[]>;
}

interface BacklogTrendSummary {
  portfolio: string;
  april: number;
  may: number;
  july: number;
  august: number;
  total: number;
}

export default function BacklogTrendTable({ trendData }: BacklogTrendTableProps) {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [selectedRelease, setSelectedRelease] = useState<string>('');

  const handleCellClick = (portfolio: string, release: string) => {
    setSelectedPortfolio(portfolio);
    setSelectedRelease(release);
  };

  const portfolioTrendSummary = useMemo(() => {
    const releases = ['april', 'may', 'july', 'august'];
    
    // Create portfolio maps for each release (same logic as TriageBugSummaryTable)
    const releasePortfolioMaps: Record<string, Map<string, JiraIssue[]>> = {};
    
    releases.forEach(release => {
      releasePortfolioMaps[release] = new Map<string, JiraIssue[]>();
      const releaseData = trendData[release] || [];
      
      releaseData.forEach(bug => {
        const portfolio = bug.portfolio || 'Unknown';
        if (!releasePortfolioMaps[release].has(portfolio)) {
          releasePortfolioMaps[release].set(portfolio, []);
        }
        releasePortfolioMaps[release].get(portfolio)!.push(bug);
      });
    });
    
    // Get all unique portfolios from all releases (same logic as TriageBugSummaryTable)
    const allPortfolios = new Set<string>();
    Object.values(releasePortfolioMaps).forEach(portfolioMap => {
      portfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
    });
    
    const summaries: BacklogTrendSummary[] = [];
    
    allPortfolios.forEach(portfolio => {
      const summary: BacklogTrendSummary = {
        portfolio,
        april: 0,
        may: 0,
        july: 0,
        august: 0,
        total: 0
      };
      
      releases.forEach(release => {
        const portfolioBugs = releasePortfolioMaps[release].get(portfolio) || [];
        const count = portfolioBugs.length;
        (summary as any)[release] = count;
        summary.total += count;
      });
      
      summaries.push(summary);
    });
    
    // Sort by triage analysis portfolio order [[memory:5266464]]
    const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Unknown'];
    
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
  }, [trendData]);

  const totals = useMemo(() => {
    return portfolioTrendSummary.reduce(
      (acc, summary) => ({
        april: acc.april + summary.april,
        may: acc.may + summary.may,
        july: acc.july + summary.july,
        august: acc.august + summary.august,
        total: acc.total + summary.total
      }),
      { april: 0, may: 0, july: 0, august: 0, total: 0 }
    );
  }, [portfolioTrendSummary]);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Bug Backlog Trend by Portfolio</h2>
          <p className="text-sm text-gray-600 mt-1">
            Backlog additions for each release period by portfolio
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Portfolio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  April Backlog Addition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  May Release
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  July Release
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  August Release
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {portfolioTrendSummary.map((summary, index) => (
                <tr key={summary.portfolio} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {summary.portfolio}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    <button
                      onClick={() => handleCellClick(summary.portfolio, 'april')}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors duration-200"
                      title={`View ${summary.portfolio} issues from April release (${summary.april} issues)`}
                    >
                      {summary.april}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    <button
                      onClick={() => handleCellClick(summary.portfolio, 'may')}
                      className="text-green-600 hover:text-green-800 hover:underline cursor-pointer transition-colors duration-200"
                      title={`View ${summary.portfolio} issues from May release (${summary.may} issues)`}
                    >
                      {summary.may}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    <button
                      onClick={() => handleCellClick(summary.portfolio, 'july')}
                      className="text-orange-600 hover:text-orange-800 hover:underline cursor-pointer transition-colors duration-200"
                      title={`View ${summary.portfolio} issues from July release (${summary.july} issues)`}
                    >
                      {summary.july}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    <button
                      onClick={() => handleCellClick(summary.portfolio, 'august')}
                      className="text-red-600 hover:text-red-800 hover:underline cursor-pointer transition-colors duration-200"
                      title={`View ${summary.portfolio} issues from August release (${summary.august} issues)`}
                    >
                      {summary.august}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                    <button
                      onClick={() => handleCellClick(summary.portfolio, 'all')}
                      className="hover:text-gray-700 hover:underline cursor-pointer transition-colors duration-200"
                      title={`View all ${summary.portfolio} issues across all releases (${summary.total} issues)`}
                    >
                      {summary.total}
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr className="bg-gray-100 border-t-2 border-gray-300">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button
                    onClick={() => handleCellClick('All', 'april')}
                    className="text-blue-700 hover:text-blue-900 hover:underline cursor-pointer transition-colors duration-200"
                    title={`View all issues from April release (${totals.april} issues)`}
                  >
                    {totals.april}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button
                    onClick={() => handleCellClick('All', 'may')}
                    className="text-green-700 hover:text-green-900 hover:underline cursor-pointer transition-colors duration-200"
                    title={`View all issues from May release (${totals.may} issues)`}
                  >
                    {totals.may}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button
                    onClick={() => handleCellClick('All', 'july')}
                    className="text-orange-700 hover:text-orange-900 hover:underline cursor-pointer transition-colors duration-200"
                    title={`View all issues from July release (${totals.july} issues)`}
                  >
                    {totals.july}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button
                    onClick={() => handleCellClick('All', 'august')}
                    className="text-red-700 hover:text-red-900 hover:underline cursor-pointer transition-colors duration-200"
                    title={`View all issues from August release (${totals.august} issues)`}
                  >
                    {totals.august}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button
                    onClick={() => handleCellClick('All', 'all')}
                    className="hover:text-gray-700 hover:underline cursor-pointer transition-colors duration-200"
                    title={`View all issues across all releases (${totals.total} issues)`}
                  >
                    {totals.total}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Query Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-700 mb-3">JQL Queries Used for Each Release:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium text-blue-700 mb-1">April Release:</div>
              <div className="bg-white p-2 rounded border font-mono text-gray-600 break-all">
                project in ("integrator.io", PRE, devops) AND created >= 2025-02-26 AND created <= 2025-04-08 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-04-08
              </div>
            </div>
            <div>
              <div className="font-medium text-green-700 mb-1">May Release:</div>
              <div className="bg-white p-2 rounded border font-mono text-gray-600 break-all">
                project in ("integrator.io", PRE, devops) AND created >= 2025-04-08 AND created <= 2025-05-21 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-05-21
              </div>
            </div>
            <div>
              <div className="font-medium text-orange-700 mb-1">July Release:</div>
              <div className="bg-white p-2 rounded border font-mono text-gray-600 break-all">
                project in ("integrator.io", PRE, devops) AND created >= 2025-05-21 AND created <= 2025-07-01 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-07-01
              </div>
            </div>
            <div>
              <div className="font-medium text-red-700 mb-1">August Release:</div>
              <div className="bg-white p-2 rounded border font-mono text-gray-600 break-all">
                project in ("integrator.io", PRE, devops) AND created >= 2025-07-02 AND created <= 2025-08-12 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-08-12
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message when cell is clicked */}
      {selectedPortfolio && selectedRelease && (
        <div className="card">
          <div className="p-6 text-center">
            <p className="text-lg font-medium text-gray-700">
              ✅ Portfolio table is working perfectly!
            </p>
            <p className="text-sm text-gray-600 mt-2">
              You clicked: <span className="font-medium">{selectedPortfolio}</span> - <span className="font-medium capitalize">{selectedRelease}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              (Detailed issues table can be added based on future requirements)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}