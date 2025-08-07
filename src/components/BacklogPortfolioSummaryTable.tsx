'use client';

import { useMemo } from 'react';
import { JiraIssue } from '@/types/jira';
import { getAllBacklogPortfolios } from '@/lib/backlogPortfolioMapping';

interface BacklogPortfolioSummaryTableProps {
  bugs: JiraIssue[];
  selectedPieSegment?: string;
  selectedPortfolio?: string;
  onPortfolioClick: (portfolio: string, criticalOnly?: boolean) => void;
  onAgeFilterClick: (ageFilterType: string) => void;
  onPortfolioAgeFilterClick: (portfolio: string, ageFilterType: string) => void;
}

interface BacklogPortfolioSummary {
  portfolio: string;
  totalIssues: number;
  bugsOver365Days: number;
  managerGroups: string[];
  teams: string[];
}

export default function BacklogPortfolioSummaryTable({ bugs, selectedPieSegment, selectedPortfolio, onPortfolioClick, onAgeFilterClick, onPortfolioAgeFilterClick }: BacklogPortfolioSummaryTableProps) {
  // Function to get portfolios for a specific segment
  const getPortfoliosForSegment = (segment: string): string[] => {
    switch (segment) {
      case 'Engineering':
        return ['Jegadeesh Core', 'Jegadeesh UI', 'Mujtaba', 'Diksha', 'KK AI/ML', 'KK DevOps', 'Fayaz QA'];
      case 'Non-Eng':
        return ['Non Engineering'];
      default:
        return [];
    }
  };

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
    const summaries: BacklogPortfolioSummary[] = [];
    
    portfolioMap.forEach((portfolioBugs, portfolio) => {
      const totalIssues = portfolioBugs.length;
      
      // Calculate age buckets (bugs created within time periods)
      const now = new Date();
      const threeSixtyFiveDaysAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
      
      const bugsOver365Days = portfolioBugs.filter(bug => {
        const created = new Date(bug.created);
        return created < threeSixtyFiveDaysAgo;
      }).length;
      
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
        bugsOver365Days,
        managerGroups,
        teams
      });
    });

    // Define backlog-specific portfolio order
    const portfolioOrder = getAllBacklogPortfolios();
    
    // Sort by custom portfolio order
    const sortedSummaries = summaries.sort((a, b) => {
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

    // Filter by selected portfolio if one is selected (from drill-down pie chart) - Priority over segment
    if (selectedPortfolio) {
      return sortedSummaries.filter(summary => summary.portfolio === selectedPortfolio);
    }

    // Filter by selected pie segment if one is selected
    if (selectedPieSegment) {
      const segmentPortfolios = getPortfoliosForSegment(selectedPieSegment);
      return sortedSummaries.filter(summary => segmentPortfolios.includes(summary.portfolio));
    }

    return sortedSummaries;
  }, [bugs, selectedPieSegment, selectedPortfolio]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalIssues = portfolioSummary.reduce((sum, summary) => sum + summary.totalIssues, 0);
    const totalBugsOver365Days = portfolioSummary.reduce((sum, summary) => sum + summary.bugsOver365Days, 0);
    
    return {
      totalIssues,
      totalBugsOver365Days
    };
  }, [portfolioSummary]);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Backlog Portfolio Summary{selectedPieSegment ? ` - ${selectedPieSegment}` : selectedPortfolio ? ` - ${selectedPortfolio}` : ''}
      </h2>
      {(selectedPieSegment || selectedPortfolio) && (
        <p className="text-sm text-gray-600 mb-4">
          {selectedPieSegment && `Showing portfolios for ${selectedPieSegment} segment (${portfolioSummary.length} portfolio${portfolioSummary.length !== 1 ? 's' : ''})`}
          {selectedPortfolio && `Showing detailed breakdown for ${selectedPortfolio} portfolio`}
        </p>
      )}
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
                  Bugs >365 Days
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
                      title={`View all ${summary.totalIssues} backlog issues for ${summary.portfolio} portfolio`}
                    >
                      {summary.totalIssues}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    <button
                      onClick={() => onPortfolioAgeFilterClick(summary.portfolio, 'over365days')}
                      className="text-red-800 hover:text-red-900 hover:underline cursor-pointer transition-colors duration-200"
                      title={`View ${summary.portfolio} issues created >365 days ago`}
                    >
                      {summary.bugsOver365Days}
                    </button>
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
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                          >
                            {group}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">No groups</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Totals row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                    Total
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button
                    onClick={() => onAgeFilterClick('all')}
                    className="hover:text-blue-600 hover:underline cursor-pointer transition-colors duration-200"
                    title="View all backlog issues"
                  >
                    {totals.totalIssues}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-800 font-bold">
                  <button
                    onClick={() => onAgeFilterClick('over365days')}
                    className="hover:text-red-900 hover:underline cursor-pointer transition-colors duration-200"
                    title="View bugs created more than 365 days ago"
                  >
                    {totals.totalBugsOver365Days}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}