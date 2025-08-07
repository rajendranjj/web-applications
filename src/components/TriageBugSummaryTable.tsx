'use client';

import { useMemo } from 'react';
import { JiraIssue } from '@/types/jira';

interface TriageBugSummaryTableProps {
  bugs: JiraIssue[];
  mainBugs: JiraIssue[]; // Total bugs from the main dashboard for percentage calculation
  selectedRelease: string;
}

interface TriagePortfolioSummary {
  portfolio: string;
  triageIssues: number;
  totalIssues: number;
  percentageTriaged: number;
  managerGroups: string[];
  teams: string[];
}



// Function to get the triage query for a given release
function getTriageQuery(release: string): string {
  const triageQueries: Record<string, string> = {
    'april': 'project in ("integrator.io", PRE, devops) AND created >= 2025-02-26 AND created <= 2025-04-08 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-04-08 ORDER BY created DESC',
    'may': 'project in ("integrator.io", PRE, devops) AND created >= 2025-04-08 AND created <= 2025-05-21 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-05-21 ORDER BY created DESC',
    'july': 'project in ("integrator.io", PRE, devops) AND created >= 2025-05-21 AND created <= 2025-07-01 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-07-01 ORDER BY created DESC',
    'august': 'project in ("integrator.io", PRE, devops) AND created >= 2025-07-02 AND created <= 2025-08-12 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-08-12 ORDER BY created DESC'
  };
  
  return triageQueries[release] || triageQueries.april;
}

export default function TriageBugSummaryTable({ bugs, mainBugs, selectedRelease }: TriageBugSummaryTableProps) {
  const portfolioSummary = useMemo(() => {
    // Create maps for triage bugs and total bugs by portfolio
    const triagePortfolioMap = new Map<string, JiraIssue[]>();
    const totalPortfolioMap = new Map<string, JiraIssue[]>();
    
    // Group triage bugs by portfolio
    bugs.forEach(bug => {
      const portfolio = bug.portfolio || 'Unknown';
      if (!triagePortfolioMap.has(portfolio)) {
        triagePortfolioMap.set(portfolio, []);
      }
      triagePortfolioMap.get(portfolio)!.push(bug);
    });

    // Group total bugs by portfolio
    mainBugs.forEach(bug => {
      const portfolio = bug.portfolio || 'Unknown';
      if (!totalPortfolioMap.has(portfolio)) {
        totalPortfolioMap.set(portfolio, []);
      }
      totalPortfolioMap.get(portfolio)!.push(bug);
    });

    const summaries: TriagePortfolioSummary[] = [];
    
    // Get all unique portfolios from both triage and total bugs
    const allPortfolios = new Set([
      ...Array.from(triagePortfolioMap.keys()),
      ...Array.from(totalPortfolioMap.keys())
    ]);
    
    allPortfolios.forEach(portfolio => {
      const portfolioTriageBugs = triagePortfolioMap.get(portfolio) || [];
      const portfolioTotalBugs = totalPortfolioMap.get(portfolio) || [];
      
      const triageIssues = portfolioTriageBugs.length;
      const totalIssues = portfolioTotalBugs.length;
      const percentageTriaged = totalIssues > 0 ? (triageIssues / totalIssues) * 100 : 0;
      
      const managerGroups = Array.from(
        new Set(
          portfolioTriageBugs
            .map(bug => bug.managerGroup)
            .filter(group => group !== null && group !== undefined)
        )
      ).sort();

      const teams = Array.from(
        new Set(
          portfolioTriageBugs
            .map(bug => bug.team)
            .filter(team => team !== null && team !== undefined)
        )
      ).sort();

      // Only include portfolios that have either triage issues or total issues
      if (triageIssues > 0 || totalIssues > 0) {
        summaries.push({
          portfolio,
          triageIssues,
          totalIssues,
          percentageTriaged,
          managerGroups,
          teams
        });
      }
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
  }, [bugs, mainBugs]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalTriageIssues = portfolioSummary.reduce((sum, summary) => sum + summary.triageIssues, 0);
    const totalTotalIssues = portfolioSummary.reduce((sum, summary) => sum + summary.totalIssues, 0);
    const overallPercentageTriaged = totalTotalIssues > 0 ? (totalTriageIssues / totalTotalIssues) * 100 : 0;
    
    return {
      totalTriageIssues,
      totalTotalIssues,
      overallPercentageTriaged
    };
  }, [portfolioSummary]);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Triage Bug Summary by Portfolio
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
                  Triage Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Triaged
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {summary.triageIssues}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900">
                        {summary.percentageTriaged.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {summary.triageIssues}/{summary.totalIssues}
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {totals.totalTriageIssues}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {totals.overallPercentageTriaged.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {totals.totalTriageIssues}/{totals.totalTotalIssues}
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
          <div className="flex items-center space-x-4 mb-2">
            <span className="font-medium">Triage Issues:</span>
            <span>Bugs that were unresolved at the end of the release period</span>
          </div>
          <div className="flex items-center space-x-4 mb-3">
            <span className="font-medium">% Triaged:</span>
            <span>(Triage Issues / Total Issues) × 100 - from main dashboard data</span>
          </div>
        </div>

        {/* Query Information */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
          <div className="text-sm font-medium text-gray-700 mb-2">
            JQL Query for Release: <span className="capitalize font-semibold text-blue-600">{selectedRelease}</span>
          </div>
          <div className="text-xs text-gray-600 font-mono bg-white p-2 rounded border break-all">
            {getTriageQuery(selectedRelease)}
          </div>
        </div>
      </div>
    </div>
  );
}