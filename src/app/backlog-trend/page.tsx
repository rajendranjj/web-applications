'use client';

import { useState, useEffect } from 'react';
import DashboardNavigation from '@/components/DashboardNavigation';
import BacklogTrendTable from '@/components/BacklogTrendTable';
import { JiraIssue } from '@/types/jira';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

export default function BacklogTrendPage() {
  const [trendData, setTrendData] = useState<Record<string, JiraIssue[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 25;

  useEffect(() => {
    const loadTrendData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/jira/backlog-trend');
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        setTrendData(data);
      } catch (err) {
        console.error('Error loading backlog trend data:', err);
        setError('Failed to load backlog trend data');
      } finally {
        setLoading(false);
      }
    };

    loadTrendData();
  }, []);

  const handleCellClick = (portfolio: string | null, release: string) => {
    setSelectedPortfolio(portfolio);
    setSelectedRelease(release);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const downloadCSV = (filteredIssues: JiraIssue[]) => {
    const headers = [
      'Issue Key',
      'Summary', 
      'Priority',
      'Status',
      'Assignee',
      'Created',
      'Portfolio',
      'Manager Group',
      'Team'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredIssues.map(issue => [
        issue.key,
        `"${issue.summary.replace(/"/g, '""')}"`,
        issue.priority?.name || 'Unknown',
        issue.status?.name || 'Unknown', 
        issue.assignee?.displayName || 'Unassigned',
        issue.created ? format(new Date(issue.created), 'yyyy-MM-dd HH:mm:ss') : '',
                        issue.portfolio || 'Non-Engg',
        issue.managerGroup || 'Unknown',
        issue.team || 'Unknown'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `backlog-trend-issues-${selectedPortfolio || 'all'}-${selectedRelease}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bug Backlog Trend Analysis Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor and analyze backlog trends across different release periods
            </p>
          </div>

          <DashboardNavigation />

          {/* Portfolio Trend Table */}
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
                      Bug backlog before April
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      April Backlog Addition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      April Backlog Resolved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bug backlog before May
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      May Release addition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      May Backlog Resolved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bug backlog before July
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      July Release addition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      July Backlog Resolved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bug backlog before August
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      August Release addition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      August Backlog Resolved
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Portfolio calculation logic
                    const releases = ['april', 'may', 'july', 'august'];
                    const releasePortfolioMaps: Record<string, Map<string, any[]>> = {};
                    
                    releases.forEach(release => {
                      releasePortfolioMaps[release] = new Map();
                      const releaseData = trendData[release] || [];
                      
                      releaseData.forEach(bug => {
                        const portfolio = bug.portfolio || 'Non-Engg';
                        if (!releasePortfolioMaps[release].has(portfolio)) {
                          releasePortfolioMaps[release].set(portfolio, []);
                        }
                        releasePortfolioMaps[release].get(portfolio)!.push(bug);
                      });
                    });
                    
                    // Calculate before April portfolio data
                    const beforeAprilData = trendData.beforeApril || [];
                    const beforeAprilPortfolioMap = new Map();
                    beforeAprilData.forEach(bug => {
                      const portfolio = bug.portfolio || 'Non-Engg';
                      if (!beforeAprilPortfolioMap.has(portfolio)) {
                        beforeAprilPortfolioMap.set(portfolio, []);
                      }
                      beforeAprilPortfolioMap.get(portfolio).push(bug);
                    });

                    // Calculate April resolved portfolio data
                    const aprilResolvedData = trendData.aprilResolved || [];
                    const aprilResolvedPortfolioMap = new Map();
                    aprilResolvedData.forEach(bug => {
                      const portfolio = bug.portfolio || 'Non-Engg';
                      if (!aprilResolvedPortfolioMap.has(portfolio)) {
                        aprilResolvedPortfolioMap.set(portfolio, []);
                      }
                      aprilResolvedPortfolioMap.get(portfolio).push(bug);
                    });

                    // Calculate before May portfolio data
                    const beforeMayData = trendData.beforeMay || [];
                    const beforeMayPortfolioMap = new Map();
                    beforeMayData.forEach(bug => {
                      const portfolio = bug.portfolio || 'Non-Engg';
                      if (!beforeMayPortfolioMap.has(portfolio)) {
                        beforeMayPortfolioMap.set(portfolio, []);
                      }
                      beforeMayPortfolioMap.get(portfolio).push(bug);
                    });

                    // Calculate May resolved portfolio data
                    const mayResolvedData = trendData.mayResolved || [];
                    const mayResolvedPortfolioMap = new Map();
                    mayResolvedData.forEach(bug => {
                      const portfolio = bug.portfolio || 'Non-Engg';
                      if (!mayResolvedPortfolioMap.has(portfolio)) {
                        mayResolvedPortfolioMap.set(portfolio, []);
                      }
                      mayResolvedPortfolioMap.get(portfolio).push(bug);
                    });

                    // Calculate before July portfolio data
                    const beforeJulyData = trendData.beforeJuly || [];
                    const beforeJulyPortfolioMap = new Map();
                    beforeJulyData.forEach(bug => {
                      const portfolio = bug.portfolio || 'Non-Engg';
                      if (!beforeJulyPortfolioMap.has(portfolio)) {
                        beforeJulyPortfolioMap.set(portfolio, []);
                      }
                      beforeJulyPortfolioMap.get(portfolio).push(bug);
                    });

                    // Calculate July resolved portfolio data
                    const julyResolvedData = trendData.julyResolved || [];
                    const julyResolvedPortfolioMap = new Map();
                    julyResolvedData.forEach(bug => {
                      const portfolio = bug.portfolio || 'Non-Engg';
                      if (!julyResolvedPortfolioMap.has(portfolio)) {
                        julyResolvedPortfolioMap.set(portfolio, []);
                      }
                      julyResolvedPortfolioMap.get(portfolio).push(bug);
                    });

                    // Calculate before August portfolio data
                    const beforeAugustData = trendData.beforeAugust || [];
                    const beforeAugustPortfolioMap = new Map();
                    beforeAugustData.forEach(bug => {
                      const portfolio = bug.portfolio || 'Non-Engg';
                      if (!beforeAugustPortfolioMap.has(portfolio)) {
                        beforeAugustPortfolioMap.set(portfolio, []);
                      }
                      beforeAugustPortfolioMap.get(portfolio).push(bug);
                    });

                    // Calculate August resolved portfolio data
                    const augustResolvedData = trendData.augustResolved || [];
                    const augustResolvedPortfolioMap = new Map();
                    augustResolvedData.forEach(bug => {
                      const portfolio = bug.portfolio || 'Non-Engg';
                      if (!augustResolvedPortfolioMap.has(portfolio)) {
                        augustResolvedPortfolioMap.set(portfolio, []);
                      }
                      augustResolvedPortfolioMap.get(portfolio).push(bug);
                    });
                    
                    const allPortfolios = new Set<string>();
                    Object.values(releasePortfolioMaps).forEach(portfolioMap => {
                      portfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    });
                    // Also include portfolios from all new data sources
                    beforeAprilPortfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    aprilResolvedPortfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    beforeMayPortfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    mayResolvedPortfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    beforeJulyPortfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    julyResolvedPortfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    beforeAugustPortfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    augustResolvedPortfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    
                    const portfolioSummaries: any[] = [];
                    allPortfolios.forEach(portfolio => {
                      const summary = {
                        portfolio,
                        beforeApril: (beforeAprilPortfolioMap.get(portfolio) || []).length,
                        april: (releasePortfolioMaps['april'].get(portfolio) || []).length,
                        aprilResolved: (aprilResolvedPortfolioMap.get(portfolio) || []).length,
                        beforeMay: (beforeMayPortfolioMap.get(portfolio) || []).length,
                        may: (releasePortfolioMaps['may'].get(portfolio) || []).length,
                        mayResolved: (mayResolvedPortfolioMap.get(portfolio) || []).length,
                        beforeJuly: (beforeJulyPortfolioMap.get(portfolio) || []).length,
                        july: (releasePortfolioMaps['july'].get(portfolio) || []).length,
                        julyResolved: (julyResolvedPortfolioMap.get(portfolio) || []).length,
                        beforeAugust: (beforeAugustPortfolioMap.get(portfolio) || []).length,
                        august: (releasePortfolioMaps['august'].get(portfolio) || []).length,
                        augustResolved: (augustResolvedPortfolioMap.get(portfolio) || []).length
                      };
                      portfolioSummaries.push(summary);
                    });
                    
                    // Sort by portfolio order
                    const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Non-Engg'];
                    portfolioSummaries.sort((a, b) => {
                      const indexA = portfolioOrder.indexOf(a.portfolio);
                      const indexB = portfolioOrder.indexOf(b.portfolio);
                      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                      if (indexA !== -1) return -1;
                      if (indexB !== -1) return 1;
                      return a.portfolio.localeCompare(b.portfolio);
                    });
                    
                    return portfolioSummaries.map((summary, index) => (
                      <tr key={summary.portfolio} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {summary.portfolio}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-black cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'beforeApril')}
                          >
                            {summary.beforeApril}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-blue-600 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'april')}
                          >
                            {summary.april}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-green-800 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'aprilResolved')}
                          >
                            {summary.aprilResolved}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-black cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'beforeMay')}
                          >
                            {summary.beforeMay}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-blue-600 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'may')}
                          >
                            {summary.may}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-green-800 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'mayResolved')}
                          >
                            {summary.mayResolved}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-black cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'beforeJuly')}
                          >
                            {summary.beforeJuly}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-blue-600 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'july')}
                          >
                            {summary.july}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-green-800 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'julyResolved')}
                          >
                            {summary.julyResolved}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-black cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'beforeAugust')}
                          >
                            {summary.beforeAugust}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-blue-600 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'august')}
                          >
                            {summary.august}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-green-800 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'augustResolved')}
                          >
                            {summary.augustResolved}
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  {/* Totals Row */}
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-black cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'beforeApril')}
                      >
                        {(trendData.beforeApril || []).length}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-blue-600 cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'april')}
                      >
                        {(trendData.april || []).length}
                      </button>
                    </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button 
                    className="text-green-800 cursor-pointer hover:underline"
                    onClick={() => handleCellClick(null, 'aprilResolved')}
                  >
                    {(trendData.aprilResolved || []).length}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button 
                    className="text-black cursor-pointer hover:underline"
                    onClick={() => handleCellClick(null, 'beforeMay')}
                  >
                    {(trendData.beforeMay || []).length}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button 
                    className="text-blue-600 cursor-pointer hover:underline"
                    onClick={() => handleCellClick(null, 'may')}
                  >
                    {(trendData.may || []).length}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button 
                    className="text-green-800 cursor-pointer hover:underline"
                    onClick={() => handleCellClick(null, 'mayResolved')}
                  >
                    {(trendData.mayResolved || []).length}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button 
                    className="text-black cursor-pointer hover:underline"
                    onClick={() => handleCellClick(null, 'beforeJuly')}
                  >
                    {(trendData.beforeJuly || []).length}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button 
                    className="text-blue-600 cursor-pointer hover:underline"
                    onClick={() => handleCellClick(null, 'july')}
                  >
                    {(trendData.july || []).length}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button 
                    className="text-green-800 cursor-pointer hover:underline"
                    onClick={() => handleCellClick(null, 'julyResolved')}
                  >
                    {(trendData.julyResolved || []).length}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button 
                    className="text-black cursor-pointer hover:underline"
                    onClick={() => handleCellClick(null, 'beforeAugust')}
                  >
                    {(trendData.beforeAugust || []).length}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button 
                    className="text-blue-600 cursor-pointer hover:underline"
                    onClick={() => handleCellClick(null, 'august')}
                  >
                    {(trendData.august || []).length}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  <button 
                    className="text-green-800 cursor-pointer hover:underline"
                    onClick={() => handleCellClick(null, 'augustResolved')}
                  >
                    {(trendData.augustResolved || []).length}
                  </button>
                </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Backlog Before Periods Table */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bug Backlog Before Release Periods</h2>
              <p className="text-sm text-gray-600 mt-1">
                Backlog state before each release period started
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
                      Bug backlog before April
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bug backlog before May
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bug backlog before July
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bug backlog before August
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Calculate portfolio data for before periods only
                    const beforeReleases = ['beforeApril', 'beforeMay', 'beforeJuly', 'beforeAugust'];
                    const beforePortfolioMaps = {};
                    
                    beforeReleases.forEach(releaseKey => {
                      const data = trendData[releaseKey] || [];
                      const portfolioMap = new Map();
                      data.forEach(bug => {
                        const portfolio = bug.portfolio || 'Non-Engg';
                        if (!portfolioMap.has(portfolio)) {
                          portfolioMap.set(portfolio, []);
                        }
                        portfolioMap.get(portfolio).push(bug);
                      });
                      beforePortfolioMaps[releaseKey] = portfolioMap;
                    });
                    
                    const allPortfolios = new Set();
                    Object.values(beforePortfolioMaps).forEach(portfolioMap => {
                      portfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    });
                    
                    const portfolioSummaries = [];
                    allPortfolios.forEach(portfolio => {
                      const summary = {
                        portfolio,
                        beforeApril: (beforePortfolioMaps['beforeApril'].get(portfolio) || []).length,
                        beforeMay: (beforePortfolioMaps['beforeMay'].get(portfolio) || []).length,
                        beforeJuly: (beforePortfolioMaps['beforeJuly'].get(portfolio) || []).length,
                        beforeAugust: (beforePortfolioMaps['beforeAugust'].get(portfolio) || []).length
                      };
                      portfolioSummaries.push(summary);
                    });
                    
                    // Sort portfolios
                    const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Non-Engg'];
                    portfolioSummaries.sort((a, b) => {
                      const aIndex = portfolioOrder.indexOf(a.portfolio);
                      const bIndex = portfolioOrder.indexOf(b.portfolio);
                      if (aIndex === -1 && bIndex === -1) return a.portfolio.localeCompare(b.portfolio);
                      if (aIndex === -1) return 1;
                      if (bIndex === -1) return -1;
                      return aIndex - bIndex;
                    });
                    
                    return portfolioSummaries.map(summary => (
                      <tr key={summary.portfolio}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {summary.portfolio}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-black cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'beforeApril')}
                          >
                            {summary.beforeApril}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-black cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'beforeMay')}
                          >
                            {summary.beforeMay}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-black cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'beforeJuly')}
                          >
                            {summary.beforeJuly}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-black cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'beforeAugust')}
                          >
                            {summary.beforeAugust}
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  {/* Totals Row */}
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-black cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'beforeApril')}
                      >
                        {(trendData.beforeApril || []).length}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-black cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'beforeMay')}
                      >
                        {(trendData.beforeMay || []).length}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-black cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'beforeJuly')}
                      >
                        {(trendData.beforeJuly || []).length}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-black cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'beforeAugust')}
                      >
                        {(trendData.beforeAugust || []).length}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Line Graph for Before Release Periods */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bug Backlog Before Release Periods Trend</h2>
              <p className="text-sm text-gray-600 mt-1">
                Visual representation of backlog levels before each release period
              </p>
            </div>
            
            <div className="p-6">
              {(() => {
                const beforeReleases = ['Before April', 'Before May', 'Before July', 'Before August'];
                const beforeReleaseKeys = ['beforeApril', 'beforeMay', 'beforeJuly', 'beforeAugust'];
                
                // Calculate portfolio data for before periods
                const beforePortfolioMaps = {};
                
                beforeReleaseKeys.forEach(releaseKey => {
                  const data = trendData[releaseKey] || [];
                  const portfolioMap = new Map();
                  data.forEach(bug => {
                    const portfolio = bug.portfolio || 'Non-Engg';
                    if (!portfolioMap.has(portfolio)) {
                      portfolioMap.set(portfolio, []);
                    }
                    portfolioMap.get(portfolio).push(bug);
                  });
                  beforePortfolioMaps[releaseKey] = portfolioMap;
                });
                
                const allPortfolios = new Set();
                Object.values(beforePortfolioMaps).forEach(portfolioMap => {
                  portfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                });
                
                // Sort portfolios
                                  const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Non-Engg'];
                const sortedPortfolios = Array.from(allPortfolios).sort((a, b) => {
                  const aIndex = portfolioOrder.indexOf(a);
                  const bIndex = portfolioOrder.indexOf(b);
                  if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                  if (aIndex === -1) return 1;
                  if (bIndex === -1) return -1;
                  return aIndex - bIndex;
                });
                
                // Prepare data for line graph
                const portfolioLineData = sortedPortfolios.map((portfolio, index) => {
                  const portfolioColors = {
                    'CORE': '#ef4444', 'UI': '#3b82f6', 'Platform': '#10b981', 'AI/ML': '#f59e0b',
                    'IA': '#8b5cf6', 'QA': '#06b6d4', 'DevOps': '#f97316', 'Unknown': '#6b7280'
                  };
                  
                  const points = beforeReleaseKeys.map((releaseKey, releaseIndex) => {
                    const count = (beforePortfolioMaps[releaseKey].get(portfolio) || []).length;
                    return { x: releaseIndex, y: count };
                  });
                  
                  return {
                    portfolio,
                    points,
                    color: portfolioColors[portfolio] || '#6b7280'
                  };
                });
                
                // Chart dimensions
                const chartWidth = 900;
                const chartHeight = 500;
                const padding = { top: 40, right: 180, bottom: 80, left: 60 };
                const innerWidth = chartWidth - padding.left - padding.right;
                const innerHeight = chartHeight - padding.top - padding.bottom;
                
                // Calculate scales
                const maxY = Math.max(...portfolioLineData.flatMap(line => line.points.map(p => p.y)));
                const yScale = (value) => padding.top + innerHeight - (value / maxY) * innerHeight;
                const xScale = (value) => padding.left + (value / (beforeReleases.length - 1)) * innerWidth;
                
                return (
                  <div className="w-full overflow-x-auto">
                    <svg width={chartWidth} height={chartHeight} className="border border-gray-200 rounded-lg">
                      {/* Grid lines */}
                      {Array.from({ length: 6 }, (_, i) => {
                        const y = padding.top + (i * innerHeight) / 5;
                        const value = Math.round(maxY - (i * maxY) / 5);
                        return (
                          <g key={`grid-${i}`}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={padding.left + innerWidth}
                              y2={y}
                              stroke="#E5E7EB"
                              strokeDasharray="2,2"
                            />
                            <text
                              x={padding.left - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="text-xs fill-gray-600"
                            >
                              {value}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* X-axis */}
                      <line
                        x1={padding.left}
                        y1={padding.top + innerHeight}
                        x2={padding.left + innerWidth}
                        y2={padding.top + innerHeight}
                        stroke="#374151"
                        strokeWidth="2"
                      />
                      
                      {/* Y-axis */}
                      <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={padding.top + innerHeight}
                        stroke="#374151"
                        strokeWidth="2"
                      />
                      
                      {/* X-axis labels */}
                      {beforeReleases.map((release, index) => (
                        <text
                          key={`x-label-${index}`}
                          x={xScale(index)}
                          y={padding.top + innerHeight + 25}
                          textAnchor="middle"
                          className="text-sm fill-gray-700 font-medium"
                        >
                          {release}
                        </text>
                      ))}
                      
                      {/* Chart title */}
                      <text
                        x={chartWidth / 2}
                        y={25}
                        textAnchor="middle"
                        className="text-lg font-semibold fill-gray-900"
                      >
                        Bug Backlog Before Release Periods by Portfolio
                      </text>
                      
                      {/* Portfolio lines and points */}
                      {portfolioLineData.map((lineData) => (
                        <g key={`line-${lineData.portfolio}`}>
                          {/* Line */}
                          <path
                            d={`M ${lineData.points.map(point => `${xScale(point.x)} ${yScale(point.y)}`).join(' L ')}`}
                            fill="none"
                            stroke={lineData.color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          
                          {/* Data points */}
                          {lineData.points.map((point, pointIndex) => (
                            <g key={`point-${lineData.portfolio}-${pointIndex}`}>
                              <circle
                                cx={xScale(point.x)}
                                cy={yScale(point.y)}
                                r="6"
                                fill={lineData.color}
                                stroke="white"
                                strokeWidth="3"
                              />
                              
                              {/* Data point labels */}
                              <rect
                                x={xScale(point.x) - 12}
                                y={yScale(point.y) - 25}
                                width="24"
                                height="16"
                                fill="white"
                                stroke={lineData.color}
                                strokeWidth="1"
                                rx="3"
                              />
                              <text
                                x={xScale(point.x)}
                                y={yScale(point.y) - 12}
                                textAnchor="middle"
                                className="text-xs font-semibold"
                                fill={lineData.color}
                              >
                                {point.y}
                              </text>
                            </g>
                          ))}
                          
                          {/* Portfolio name near the end of line */}
                          {(() => {
                            const lastPoint = lineData.points[lineData.points.length - 1];
                            const textX = xScale(lastPoint.x) + 15;
                            const textY = yScale(lastPoint.y);
                            
                            return (
                              <g>
                                <rect
                                  x={textX - 5}
                                  y={textY - 10}
                                  width={lineData.portfolio.length * 7 + 10}
                                  height="16"
                                  fill="white"
                                  stroke={lineData.color}
                                  strokeWidth="1"
                                  rx="3"
                                />
                                <text
                                  x={textX}
                                  y={textY + 2}
                                  className="text-xs font-semibold"
                                  fill={lineData.color}
                                >
                                  {lineData.portfolio}
                                </text>
                              </g>
                            );
                          })()}
                        </g>
                      ))}
                      
                      {/* Legend */}
                      {portfolioLineData.map((lineData, index) => (
                        <g key={`legend-${lineData.portfolio}`}>
                          <line 
                            x1={padding.left + innerWidth + 20} 
                            y1={padding.top + 20 + index * 25} 
                            x2={padding.left + innerWidth + 40} 
                            y2={padding.top + 20 + index * 25} 
                            stroke={lineData.color} 
                            strokeWidth="3"
                          />
                          <circle 
                            cx={padding.left + innerWidth + 30} 
                            cy={padding.top + 20 + index * 25} 
                            r="3" 
                            fill={lineData.color}
                          />
                          <text 
                            x={padding.left + innerWidth + 50} 
                            y={padding.top + 25 + index * 25} 
                            className="text-xs fill-gray-700"
                          >
                            {lineData.portfolio}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                );
              })()}
              
              {/* Chart summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Portfolio Trend Summary:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {(() => {
                    // Calculate data for before periods summary
                    const beforeReleaseKeys = ['beforeApril', 'beforeMay', 'beforeJuly', 'beforeAugust'];
                    const beforePortfolioMaps = {};
                    
                    beforeReleaseKeys.forEach(releaseKey => {
                      beforePortfolioMaps[releaseKey] = new Map();
                      const releaseData = trendData[releaseKey] || [];
                      
                      releaseData.forEach(bug => {
                        const portfolio = bug.portfolio || 'Non-Engg';
                        if (!beforePortfolioMaps[releaseKey].has(portfolio)) {
                          beforePortfolioMaps[releaseKey].set(portfolio, []);
                        }
                        beforePortfolioMaps[releaseKey].get(portfolio).push(bug);
                      });
                    });
                    
                    const allPortfolios = new Set();
                    Object.values(beforePortfolioMaps).forEach(portfolioMap => {
                      portfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    });
                    
                    const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Non-Engg'];
                    const sortedPortfolios = Array.from(allPortfolios).sort((a, b) => {
                      const indexA = portfolioOrder.indexOf(a);
                      const indexB = portfolioOrder.indexOf(b);
                      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                      if (indexA !== -1) return -1;
                      if (indexB !== -1) return 1;
                      return a.localeCompare(b);
                    });
                    
                    const portfolioColors = {
                      'CORE': '#ef4444', 'UI': '#3b82f6', 'Platform': '#10b981', 'AI/ML': '#f59e0b',
                      'IA': '#8b5cf6', 'QA': '#06b6d4', 'DevOps': '#f97316', 'Non-Engg': '#6b7280'
                    };
                    
                    return sortedPortfolios.map(portfolio => {
                      const totalCount = beforeReleaseKeys.reduce((sum, releaseKey) => {
                        return sum + (beforePortfolioMaps[releaseKey].get(portfolio) || []).length;
                      }, 0);
                      
                      return (
                        <div key={portfolio} className="text-center p-3 bg-white rounded border">
                          <div 
                            className="w-4 h-4 rounded mx-auto mb-1" 
                            style={{ backgroundColor: portfolioColors[portfolio] || '#6b7280' }}
                          ></div>
                          <div className="font-semibold text-gray-900 text-xs">{portfolio}</div>
                          <div className="text-lg font-bold" style={{ color: portfolioColors[portfolio] || '#6b7280' }}>
                            {totalCount}
                          </div>
                          <div className="text-xs text-gray-500">total issues</div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="mt-3 text-center">
                  <div className="text-sm text-gray-600">
                    Total across all portfolios and before periods: <span className="font-semibold text-gray-900">
                      {['beforeApril', 'beforeMay', 'beforeJuly', 'beforeAugust'].reduce((sum, key) => sum + (trendData[key] || []).length, 0)}
                    </span> issues
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Backlog Addition Periods Table */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bug Backlog Addition by Release Period</h2>
              <p className="text-sm text-gray-600 mt-1">
                New bugs added during each release period
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
                      May Release addition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      July Release addition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      August Release addition
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Calculate portfolio data for addition periods only
                    const additionReleases = ['april', 'may', 'july', 'august'];
                    const additionPortfolioMaps = {};
                    
                    additionReleases.forEach(releaseKey => {
                      const data = trendData[releaseKey] || [];
                      const portfolioMap = new Map();
                      data.forEach(bug => {
                        const portfolio = bug.portfolio || 'Non-Engg';
                        if (!portfolioMap.has(portfolio)) {
                          portfolioMap.set(portfolio, []);
                        }
                        portfolioMap.get(portfolio).push(bug);
                      });
                      additionPortfolioMaps[releaseKey] = portfolioMap;
                    });
                    
                    const allPortfolios = new Set();
                    Object.values(additionPortfolioMaps).forEach(portfolioMap => {
                      portfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    });
                    
                    const portfolioSummaries = [];
                    allPortfolios.forEach(portfolio => {
                      const summary = {
                        portfolio,
                        april: (additionPortfolioMaps['april'].get(portfolio) || []).length,
                        may: (additionPortfolioMaps['may'].get(portfolio) || []).length,
                        july: (additionPortfolioMaps['july'].get(portfolio) || []).length,
                        august: (additionPortfolioMaps['august'].get(portfolio) || []).length
                      };
                      portfolioSummaries.push(summary);
                    });
                    
                    // Sort portfolios
                    const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Non-Engg'];
                    portfolioSummaries.sort((a, b) => {
                      const aIndex = portfolioOrder.indexOf(a.portfolio);
                      const bIndex = portfolioOrder.indexOf(b.portfolio);
                      if (aIndex === -1 && bIndex === -1) return a.portfolio.localeCompare(b.portfolio);
                      if (aIndex === -1) return 1;
                      if (bIndex === -1) return -1;
                      return aIndex - bIndex;
                    });
                    
                    return portfolioSummaries.map(summary => (
                      <tr key={summary.portfolio}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {summary.portfolio}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-blue-600 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'april')}
                          >
                            {summary.april}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-blue-600 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'may')}
                          >
                            {summary.may}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-blue-600 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'july')}
                          >
                            {summary.july}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-blue-600 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'august')}
                          >
                            {summary.august}
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  {/* Totals Row */}
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-blue-600 cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'april')}
                      >
                        {(trendData.april || []).length}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-blue-600 cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'may')}
                      >
                        {(trendData.may || []).length}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-blue-600 cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'july')}
                      >
                        {(trendData.july || []).length}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-blue-600 cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'august')}
                      >
                        {(trendData.august || []).length}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Line Graph for Release Trends */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bug Backlog Addition by Release Period Trend</h2>
              <p className="text-sm text-gray-600 mt-1">
                Visual representation of bug backlog additions for each release period
              </p>
            </div>
            
            <div className="p-6">
              {(() => {
                const releases = ['April', 'May', 'July', 'August'];
                const releaseKeys = ['april', 'may', 'july', 'august'];
                
                // Include April resolved data
                const aprilResolvedData = trendData.aprilResolved || [];
                
                // Calculate portfolio data for each release
                const portfolioData = {};
                const releasePortfolioMaps = {};
                
                releaseKeys.forEach(releaseKey => {
                  releasePortfolioMaps[releaseKey] = new Map();
                  const releaseData = trendData[releaseKey] || [];
                  
                  releaseData.forEach(bug => {
                    const portfolio = bug.portfolio || 'Non-Engg';
                    if (!releasePortfolioMaps[releaseKey].has(portfolio)) {
                      releasePortfolioMaps[releaseKey].set(portfolio, []);
                    }
                    releasePortfolioMaps[releaseKey].get(portfolio).push(bug);
                  });
                });
                
                // Calculate April resolved portfolio data
                const aprilResolvedPortfolioMap = new Map();
                aprilResolvedData.forEach(bug => {
                  const portfolio = bug.portfolio || 'Non-Engg';
                  if (!aprilResolvedPortfolioMap.has(portfolio)) {
                    aprilResolvedPortfolioMap.set(portfolio, []);
                  }
                  aprilResolvedPortfolioMap.get(portfolio).push(bug);
                });
                
                // Get all unique portfolios
                const allPortfolios = new Set();
                Object.values(releasePortfolioMaps).forEach(portfolioMap => {
                  portfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                });
                // Also include portfolios from April resolved data
                aprilResolvedPortfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                
                // Sort portfolios by the standard order
                                  const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Non-Engg'];
                const sortedPortfolios = Array.from(allPortfolios).sort((a, b) => {
                  const indexA = portfolioOrder.indexOf(a);
                  const indexB = portfolioOrder.indexOf(b);
                  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                  if (indexA !== -1) return -1;
                  if (indexB !== -1) return 1;
                  return a.localeCompare(b);
                });
                
                // Calculate counts for each portfolio across releases
                const portfolioLines = sortedPortfolios.map(portfolio => {
                  const counts = releaseKeys.map(releaseKey => 
                    (releasePortfolioMaps[releaseKey].get(portfolio) || []).length
                  );
                  return { portfolio, counts };
                });
                
                // Find max count for scaling
                const allCounts = portfolioLines.flatMap(line => line.counts);
                const maxCount = Math.max(...allCounts, 1); // Avoid division by zero
                
                const chartWidth = 900;
                const chartHeight = 500;
                const padding = { top: 60, right: 200, bottom: 80, left: 80 };
                const innerWidth = chartWidth - padding.left - padding.right;
                const innerHeight = chartHeight - padding.top - padding.bottom;
                
                // Portfolio colors
                const portfolioColors = {
                  'CORE': '#ef4444',      // red
                  'UI': '#3b82f6',        // blue
                  'Platform': '#10b981',  // green
                  'AI/ML': '#f59e0b',     // amber
                  'IA': '#8b5cf6',        // violet
                  'QA': '#06b6d4',        // cyan
                  'DevOps': '#f97316',    // orange
                                      'Non-Engg': '#6b7280'    // gray
                };
                
                // Calculate points for each portfolio line
                const portfolioLineData = portfolioLines.map(line => {
                  const points = line.counts.map((count, index) => ({
                    x: padding.left + (index * innerWidth) / (releases.length - 1),
                    y: padding.top + innerHeight - (count / maxCount) * innerHeight,
                    count,
                    release: releases[index]
                  }));
                  
                  const linePath = points.map((point, index) => 
                    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                  ).join(' ');
                  
                  return {
                    portfolio: line.portfolio,
                    points,
                    linePath,
                    color: portfolioColors[line.portfolio] || '#6b7280'
                  };
                });
                
                return (
                  <div className="flex justify-center">
                    <svg width={chartWidth} height={chartHeight} className="border border-gray-200 rounded-lg bg-white">
                      {/* Background grid lines */}
                      {[0, 1, 2, 3, 4].map(i => {
                        const y = padding.top + (i * innerHeight) / 4;
                        const value = Math.round(maxCount - (i * maxCount) / 4);
                        return (
                          <g key={i}>
                            <line 
                              x1={padding.left} 
                              y1={y} 
                              x2={padding.left + innerWidth} 
                              y2={y} 
                              stroke="#f3f4f6" 
                              strokeWidth="1"
                            />
                            <text 
                              x={padding.left - 10} 
                              y={y + 4} 
                              textAnchor="end" 
                              className="text-xs fill-gray-500"
                            >
                              {value}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* X-axis */}
                      <line 
                        x1={padding.left} 
                        y1={padding.top + innerHeight} 
                        x2={padding.left + innerWidth} 
                        y2={padding.top + innerHeight} 
                        stroke="#374151" 
                        strokeWidth="2"
                      />
                      
                      {/* Y-axis */}
                      <line 
                        x1={padding.left} 
                        y1={padding.top} 
                        x2={padding.left} 
                        y2={padding.top + innerHeight} 
                        stroke="#374151" 
                        strokeWidth="2"
                      />
                      
                      {/* X-axis labels */}
                      {releases.map((release, index) => {
                        const x = padding.left + (index * innerWidth) / (releases.length - 1);
                        return (
                          <g key={index}>
                            <line 
                              x1={x} 
                              y1={padding.top + innerHeight} 
                              x2={x} 
                              y2={padding.top + innerHeight + 5} 
                              stroke="#374151" 
                              strokeWidth="1"
                            />
                            <text 
                              x={x} 
                              y={padding.top + innerHeight + 20} 
                              textAnchor="middle" 
                              className="text-sm fill-gray-700 font-medium"
                            >
                              {release}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Portfolio lines */}
                      {portfolioLineData.map((lineData, lineIndex) => (
                        <g key={lineData.portfolio}>
                          {/* Line path */}
                          <path 
                            d={lineData.linePath} 
                            fill="none" 
                            stroke={lineData.color} 
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          
                          {/* Data points with numbers */}
                          {lineData.points.map((point, pointIndex) => (
                            <g key={`${lineData.portfolio}-${pointIndex}`}>
                              <circle 
                                cx={point.x} 
                                cy={point.y} 
                                r="6" 
                                fill={lineData.color}
                                stroke="white"
                                strokeWidth="3"
                              />
                              {/* White background for number for better visibility */}
                              <rect 
                                x={point.x - 10} 
                                y={point.y - 25} 
                                width="20" 
                                height="14" 
                                fill="white" 
                                stroke={lineData.color} 
                                strokeWidth="1" 
                                rx="2"
                                opacity="0.9"
                              />
                              {/* Count number above each point */}
                              <text 
                                x={point.x} 
                                y={point.y - 15} 
                                textAnchor="middle" 
                                className="text-xs font-bold"
                                fill={lineData.color}
                              >
                                {point.count}
                              </text>
                              {/* Tooltip */}
                              <title>{`${lineData.portfolio} - ${point.release}: ${point.count} issues`}</title>
                            </g>
                          ))}
                          
                          {/* Portfolio name label near the end of each line */}
                          {(() => {
                            const lastPoint = lineData.points[lineData.points.length - 1];
                            const secondLastPoint = lineData.points[lineData.points.length - 2];
                            
                            // Calculate label position based on line direction
                            let labelX = lastPoint.x + 15;
                            let labelY = lastPoint.y + 4;
                            
                            // Adjust position if line is going up or down
                            if (lastPoint.y < secondLastPoint.y) {
                              // Line going up
                              labelY = lastPoint.y - 8;
                            } else if (lastPoint.y > secondLastPoint.y) {
                              // Line going down
                              labelY = lastPoint.y + 15;
                            }
                            
                            // Keep label within chart bounds
                            if (labelX > padding.left + innerWidth - 50) {
                              labelX = lastPoint.x - 60;
                            }
                            
                            return (
                              <g>
                                {/* Background for portfolio label */}
                                <rect 
                                  x={labelX - 3} 
                                  y={labelY - 12} 
                                  width={lineData.portfolio.length * 6 + 6} 
                                  height="16" 
                                  fill="white" 
                                  stroke={lineData.color} 
                                  strokeWidth="1" 
                                  rx="3"
                                  opacity="0.95"
                                />
                                <text 
                                  x={labelX} 
                                  y={labelY} 
                                  className="text-xs font-semibold"
                                  fill={lineData.color}
                                >
                                  {lineData.portfolio}
                                </text>
                              </g>
                            );
                          })()}
                        </g>
                      ))}
                      
                      {/* Legend */}
                      {portfolioLineData.map((lineData, index) => (
                        <g key={`legend-${lineData.portfolio}`}>
                          <line 
                            x1={padding.left + innerWidth + 20} 
                            y1={padding.top + 20 + index * 25} 
                            x2={padding.left + innerWidth + 40} 
                            y2={padding.top + 20 + index * 25} 
                            stroke={lineData.color} 
                            strokeWidth="3"
                          />
                          <circle 
                            cx={padding.left + innerWidth + 30} 
                            cy={padding.top + 20 + index * 25} 
                            r="3" 
                            fill={lineData.color}
                          />
                          <text 
                            x={padding.left + innerWidth + 50} 
                            y={padding.top + 25 + index * 25} 
                            className="text-xs fill-gray-700"
                          >
                            {lineData.portfolio}
                          </text>
                        </g>
                      ))}
                      
                      {/* Chart title */}
                      <text 
                        x={chartWidth / 2} 
                        y={30} 
                        textAnchor="middle" 
                        className="text-lg fill-gray-800 font-semibold"
                      >
                        Bug Backlog Trends by Portfolio
                      </text>
                      
                      {/* Y-axis label */}
                      <text 
                        x={20} 
                        y={chartHeight / 2} 
                        textAnchor="middle" 
                        className="text-sm fill-gray-600"
                        transform={`rotate(-90, 20, ${chartHeight / 2})`}
                      >
                        Number of Issues
                      </text>
                      
                      {/* X-axis label */}
                      <text 
                        x={chartWidth / 2} 
                        y={chartHeight - 10} 
                        textAnchor="middle" 
                        className="text-sm fill-gray-600"
                      >
                        Release Period
                      </text>
                    </svg>
                  </div>
                );
              })()}
              
              {/* Chart summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Portfolio Trend Summary:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {(() => {
                    // Recalculate the same data for the summary
                    const releases = ['April', 'May', 'July', 'August'];
                    const releaseKeys = ['april', 'may', 'july', 'august'];
                    const releasePortfolioMaps = {};
                    
                    releaseKeys.forEach(releaseKey => {
                      releasePortfolioMaps[releaseKey] = new Map();
                      const releaseData = trendData[releaseKey] || [];
                      
                      releaseData.forEach(bug => {
                        const portfolio = bug.portfolio || 'Non-Engg';
                        if (!releasePortfolioMaps[releaseKey].has(portfolio)) {
                          releasePortfolioMaps[releaseKey].set(portfolio, []);
                        }
                        releasePortfolioMaps[releaseKey].get(portfolio).push(bug);
                      });
                    });
                    
                    const allPortfolios = new Set();
                    Object.values(releasePortfolioMaps).forEach(portfolioMap => {
                      portfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    });
                    
                    const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Non-Engg'];
                    const sortedPortfolios = Array.from(allPortfolios).sort((a, b) => {
                      const indexA = portfolioOrder.indexOf(a);
                      const indexB = portfolioOrder.indexOf(b);
                      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                      if (indexA !== -1) return -1;
                      if (indexB !== -1) return 1;
                      return a.localeCompare(b);
                    });
                    
                    const portfolioColors = {
                      'CORE': '#ef4444', 'UI': '#3b82f6', 'Platform': '#10b981', 'AI/ML': '#f59e0b',
                      'IA': '#8b5cf6', 'QA': '#06b6d4', 'DevOps': '#f97316', 'Non-Engg': '#6b7280'
                    };
                    
                    return sortedPortfolios.map(portfolio => {
                      const totalCount = releaseKeys.reduce((sum, releaseKey) => {
                        return sum + (releasePortfolioMaps[releaseKey].get(portfolio) || []).length;
                      }, 0);
                      
                      return (
                        <div key={portfolio} className="text-center p-3 bg-white rounded border">
                          <div 
                            className="w-4 h-4 rounded mx-auto mb-1" 
                            style={{ backgroundColor: portfolioColors[portfolio] || '#6b7280' }}
                          ></div>
                          <div className="font-semibold text-gray-900 text-xs">{portfolio}</div>
                          <div className="text-lg font-bold" style={{ color: portfolioColors[portfolio] || '#6b7280' }}>
                            {totalCount}
                          </div>
                          <div className="text-xs text-gray-500">total issues</div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="mt-3 text-center">
                  <div className="text-sm text-gray-600">
                    Total across all portfolios and releases: <span className="font-semibold text-gray-900">
                      {Object.values(trendData).reduce((sum, issues) => sum + issues.length, 0)}
                    </span> issues
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Backlog Resolved Periods Table */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bug Backlog Resolved by Release Period</h2>
              <p className="text-sm text-gray-600 mt-1">
                Bugs resolved during each release period
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
                      April Backlog Resolved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      May Backlog Resolved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      July Backlog Resolved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      August Backlog Resolved
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Calculate portfolio data for resolved periods only
                    const resolvedReleases = ['aprilResolved', 'mayResolved', 'julyResolved', 'augustResolved'];
                    const resolvedPortfolioMaps = {};
                    
                    resolvedReleases.forEach(releaseKey => {
                      const data = trendData[releaseKey] || [];
                      const portfolioMap = new Map();
                      data.forEach(bug => {
                        const portfolio = bug.portfolio || 'Non-Engg';
                        if (!portfolioMap.has(portfolio)) {
                          portfolioMap.set(portfolio, []);
                        }
                        portfolioMap.get(portfolio).push(bug);
                      });
                      resolvedPortfolioMaps[releaseKey] = portfolioMap;
                    });
                    
                    const allPortfolios = new Set();
                    Object.values(resolvedPortfolioMaps).forEach(portfolioMap => {
                      portfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    });
                    
                    const portfolioSummaries = [];
                    allPortfolios.forEach(portfolio => {
                      const summary = {
                        portfolio,
                        aprilResolved: (resolvedPortfolioMaps['aprilResolved'].get(portfolio) || []).length,
                        mayResolved: (resolvedPortfolioMaps['mayResolved'].get(portfolio) || []).length,
                        julyResolved: (resolvedPortfolioMaps['julyResolved'].get(portfolio) || []).length,
                        augustResolved: (resolvedPortfolioMaps['augustResolved'].get(portfolio) || []).length
                      };
                      portfolioSummaries.push(summary);
                    });
                    
                    // Sort portfolios
                    const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Non-Engg'];
                    portfolioSummaries.sort((a, b) => {
                      const aIndex = portfolioOrder.indexOf(a.portfolio);
                      const bIndex = portfolioOrder.indexOf(b.portfolio);
                      if (aIndex === -1 && bIndex === -1) return a.portfolio.localeCompare(b.portfolio);
                      if (aIndex === -1) return 1;
                      if (bIndex === -1) return -1;
                      return aIndex - bIndex;
                    });
                    
                    return portfolioSummaries.map(summary => (
                      <tr key={summary.portfolio}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {summary.portfolio}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-green-800 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'aprilResolved')}
                          >
                            {summary.aprilResolved}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-green-800 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'mayResolved')}
                          >
                            {summary.mayResolved}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-green-800 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'julyResolved')}
                          >
                            {summary.julyResolved}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          <button 
                            className="text-green-800 cursor-pointer hover:underline"
                            onClick={() => handleCellClick(summary.portfolio, 'augustResolved')}
                          >
                            {summary.augustResolved}
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  {/* Totals Row */}
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-green-800 cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'aprilResolved')}
                      >
                        {(trendData.aprilResolved || []).length}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-green-800 cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'mayResolved')}
                      >
                        {(trendData.mayResolved || []).length}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-green-800 cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'julyResolved')}
                      >
                        {(trendData.julyResolved || []).length}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <button 
                        className="text-green-800 cursor-pointer hover:underline"
                        onClick={() => handleCellClick(null, 'augustResolved')}
                      >
                        {(trendData.augustResolved || []).length}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Line Graph for Resolved Release Periods */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bug Backlog Resolved Periods Trend</h2>
              <p className="text-sm text-gray-600 mt-1">
                Visual representation of bugs resolved during each release period
              </p>
            </div>
            
            <div className="p-6">
              {(() => {
                const resolvedReleases = ['April Resolved', 'May Resolved', 'July Resolved', 'August Resolved'];
                const resolvedReleaseKeys = ['aprilResolved', 'mayResolved', 'julyResolved', 'augustResolved'];
                
                // Calculate portfolio data for resolved periods
                const resolvedPortfolioMaps = {};
                
                resolvedReleaseKeys.forEach(releaseKey => {
                  const data = trendData[releaseKey] || [];
                  const portfolioMap = new Map();
                  data.forEach(bug => {
                    const portfolio = bug.portfolio || 'Non-Engg';
                    if (!portfolioMap.has(portfolio)) {
                      portfolioMap.set(portfolio, []);
                    }
                    portfolioMap.get(portfolio).push(bug);
                  });
                  resolvedPortfolioMaps[releaseKey] = portfolioMap;
                });
                
                const allPortfolios = new Set();
                Object.values(resolvedPortfolioMaps).forEach(portfolioMap => {
                  portfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                });
                
                // Sort portfolios
                                  const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Non-Engg'];
                const sortedPortfolios = Array.from(allPortfolios).sort((a, b) => {
                  const aIndex = portfolioOrder.indexOf(a);
                  const bIndex = portfolioOrder.indexOf(b);
                  if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                  if (aIndex === -1) return 1;
                  if (bIndex === -1) return -1;
                  return aIndex - bIndex;
                });
                
                // Prepare data for line graph
                const portfolioLineData = sortedPortfolios.map((portfolio, index) => {
                  const portfolioColors = {
                    'CORE': '#ef4444', 'UI': '#3b82f6', 'Platform': '#10b981', 'AI/ML': '#f59e0b',
                    'IA': '#8b5cf6', 'QA': '#06b6d4', 'DevOps': '#f97316', 'Unknown': '#6b7280'
                  };
                  
                  const points = resolvedReleaseKeys.map((releaseKey, releaseIndex) => {
                    const count = (resolvedPortfolioMaps[releaseKey].get(portfolio) || []).length;
                    return { x: releaseIndex, y: count };
                  });
                  
                  return {
                    portfolio,
                    points,
                    color: portfolioColors[portfolio] || '#6b7280'
                  };
                });
                
                // Chart dimensions
                const chartWidth = 900;
                const chartHeight = 500;
                const padding = { top: 40, right: 180, bottom: 80, left: 60 };
                const innerWidth = chartWidth - padding.left - padding.right;
                const innerHeight = chartHeight - padding.top - padding.bottom;
                
                // Calculate scales
                const maxY = Math.max(...portfolioLineData.flatMap(line => line.points.map(p => p.y)));
                const yScale = (value) => padding.top + innerHeight - (value / maxY) * innerHeight;
                const xScale = (value) => padding.left + (value / (resolvedReleases.length - 1)) * innerWidth;
                
                return (
                  <div className="w-full overflow-x-auto">
                    <svg width={chartWidth} height={chartHeight} className="border border-gray-200 rounded-lg">
                      {/* Grid lines */}
                      {Array.from({ length: 6 }, (_, i) => {
                        const y = padding.top + (i * innerHeight) / 5;
                        const value = Math.round(maxY - (i * maxY) / 5);
                        return (
                          <g key={`grid-${i}`}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={padding.left + innerWidth}
                              y2={y}
                              stroke="#E5E7EB"
                              strokeDasharray="2,2"
                            />
                            <text
                              x={padding.left - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="text-xs fill-gray-600"
                            >
                              {value}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* X-axis */}
                      <line
                        x1={padding.left}
                        y1={padding.top + innerHeight}
                        x2={padding.left + innerWidth}
                        y2={padding.top + innerHeight}
                        stroke="#374151"
                        strokeWidth="2"
                      />
                      
                      {/* Y-axis */}
                      <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={padding.top + innerHeight}
                        stroke="#374151"
                        strokeWidth="2"
                      />
                      
                      {/* X-axis labels */}
                      {resolvedReleases.map((release, index) => (
                        <text
                          key={`x-label-${index}`}
                          x={xScale(index)}
                          y={padding.top + innerHeight + 25}
                          textAnchor="middle"
                          className="text-sm fill-gray-700 font-medium"
                        >
                          {release}
                        </text>
                      ))}
                      
                      {/* Chart title */}
                      <text
                        x={chartWidth / 2}
                        y={25}
                        textAnchor="middle"
                        className="text-lg font-semibold fill-gray-900"
                      >
                        Bug Backlog Resolved Periods by Portfolio
                      </text>
                      
                      {/* Portfolio lines and points */}
                      {portfolioLineData.map((lineData) => (
                        <g key={`line-${lineData.portfolio}`}>
                          {/* Line */}
                          <path
                            d={`M ${lineData.points.map(point => `${xScale(point.x)} ${yScale(point.y)}`).join(' L ')}`}
                            fill="none"
                            stroke={lineData.color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          
                          {/* Data points */}
                          {lineData.points.map((point, pointIndex) => (
                            <g key={`point-${lineData.portfolio}-${pointIndex}`}>
                              <circle
                                cx={xScale(point.x)}
                                cy={yScale(point.y)}
                                r="6"
                                fill={lineData.color}
                                stroke="white"
                                strokeWidth="3"
                              />
                              
                              {/* Data point labels */}
                              <rect
                                x={xScale(point.x) - 12}
                                y={yScale(point.y) - 25}
                                width="24"
                                height="16"
                                fill="white"
                                stroke={lineData.color}
                                strokeWidth="1"
                                rx="3"
                              />
                              <text
                                x={xScale(point.x)}
                                y={yScale(point.y) - 12}
                                textAnchor="middle"
                                className="text-xs font-semibold"
                                fill={lineData.color}
                              >
                                {point.y}
                              </text>
                            </g>
                          ))}
                          
                          {/* Portfolio name near the end of line */}
                          {(() => {
                            const lastPoint = lineData.points[lineData.points.length - 1];
                            const textX = xScale(lastPoint.x) + 15;
                            const textY = yScale(lastPoint.y);
                            
                            return (
                              <g>
                                <rect
                                  x={textX - 5}
                                  y={textY - 10}
                                  width={lineData.portfolio.length * 7 + 10}
                                  height="16"
                                  fill="white"
                                  stroke={lineData.color}
                                  strokeWidth="1"
                                  rx="3"
                                />
                                <text
                                  x={textX}
                                  y={textY + 2}
                                  className="text-xs font-semibold"
                                  fill={lineData.color}
                                >
                                  {lineData.portfolio}
                                </text>
                              </g>
                            );
                          })()}
                        </g>
                      ))}
                      
                      {/* Legend */}
                      {portfolioLineData.map((lineData, index) => (
                        <g key={`legend-${lineData.portfolio}`}>
                          <line 
                            x1={padding.left + innerWidth + 20} 
                            y1={padding.top + 20 + index * 25} 
                            x2={padding.left + innerWidth + 40} 
                            y2={padding.top + 20 + index * 25} 
                            stroke={lineData.color} 
                            strokeWidth="3"
                          />
                          <circle 
                            cx={padding.left + innerWidth + 30} 
                            cy={padding.top + 20 + index * 25} 
                            r="3" 
                            fill={lineData.color}
                          />
                          <text 
                            x={padding.left + innerWidth + 50} 
                            y={padding.top + 25 + index * 25} 
                            className="text-xs fill-gray-700"
                          >
                            {lineData.portfolio}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                );
              })()}
              
              {/* Chart summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Portfolio Trend Summary:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {(() => {
                    // Calculate data for resolved periods summary
                    const resolvedReleaseKeys = ['aprilResolved', 'mayResolved', 'julyResolved', 'augustResolved'];
                    const resolvedPortfolioMaps = {};
                    
                    resolvedReleaseKeys.forEach(releaseKey => {
                      resolvedPortfolioMaps[releaseKey] = new Map();
                      const releaseData = trendData[releaseKey] || [];
                      
                      releaseData.forEach(bug => {
                        const portfolio = bug.portfolio || 'Non-Engg';
                        if (!resolvedPortfolioMaps[releaseKey].has(portfolio)) {
                          resolvedPortfolioMaps[releaseKey].set(portfolio, []);
                        }
                        resolvedPortfolioMaps[releaseKey].get(portfolio).push(bug);
                      });
                    });
                    
                    const allPortfolios = new Set();
                    Object.values(resolvedPortfolioMaps).forEach(portfolioMap => {
                      portfolioMap.keys().forEach(portfolio => allPortfolios.add(portfolio));
                    });
                    
                    const portfolioOrder = ['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Non-Engg'];
                    const sortedPortfolios = Array.from(allPortfolios).sort((a, b) => {
                      const indexA = portfolioOrder.indexOf(a);
                      const indexB = portfolioOrder.indexOf(b);
                      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                      if (indexA !== -1) return -1;
                      if (indexB !== -1) return 1;
                      return a.localeCompare(b);
                    });
                    
                    const portfolioColors = {
                      'CORE': '#ef4444', 'UI': '#3b82f6', 'Platform': '#10b981', 'AI/ML': '#f59e0b',
                      'IA': '#8b5cf6', 'QA': '#06b6d4', 'DevOps': '#f97316', 'Non-Engg': '#6b7280'
                    };
                    
                    return sortedPortfolios.map(portfolio => {
                      const totalCount = resolvedReleaseKeys.reduce((sum, releaseKey) => {
                        return sum + (resolvedPortfolioMaps[releaseKey].get(portfolio) || []).length;
                      }, 0);
                      
                      return (
                        <div key={portfolio} className="text-center p-3 bg-white rounded border">
                          <div 
                            className="w-4 h-4 rounded mx-auto mb-1" 
                            style={{ backgroundColor: portfolioColors[portfolio] || '#6b7280' }}
                          ></div>
                          <div className="font-semibold text-gray-900 text-xs">{portfolio}</div>
                          <div className="text-lg font-bold" style={{ color: portfolioColors[portfolio] || '#6b7280' }}>
                            {totalCount}
                          </div>
                          <div className="text-xs text-gray-500">total issues</div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="mt-3 text-center">
                  <div className="text-sm text-gray-600">
                    Total across all portfolios and resolved periods: <span className="font-semibold text-gray-900">
                      {['aprilResolved', 'mayResolved', 'julyResolved', 'augustResolved'].reduce((sum, key) => sum + (trendData[key] || []).length, 0)}
                    </span> issues
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtered Issues Table */}
          {selectedPortfolio !== null || selectedRelease !== null ? (
            <div className="card mt-6">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Filtered Issues 
                    {selectedPortfolio && ` - ${selectedPortfolio} Portfolio`}
                    {selectedRelease && ` - ${selectedRelease === 'aprilResolved' ? 'April Resolved' : selectedRelease === 'beforeApril' ? 'Bug backlog before April' : selectedRelease.charAt(0).toUpperCase() + selectedRelease.slice(1)} Release`}
                  </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {(() => {
                    if (!selectedRelease) return 'No release selected';
                    
                    let filteredIssues: JiraIssue[] = [];
                    
                    if (selectedRelease === 'all') {
                      filteredIssues = Object.values(trendData).flat();
                    } else {
                      filteredIssues = trendData[selectedRelease] || [];
                    }
                    
                    if (selectedPortfolio) {
                      filteredIssues = filteredIssues.filter(issue => {
                        const portfolio = issue.portfolio || 'Non-Engg';
                        return portfolio === selectedPortfolio;
                      });
                    }
                    
                    const totalIssues = filteredIssues.length;
                    const totalPages = Math.ceil(totalIssues / itemsPerPage);
                    const startIndex = (currentPage - 1) * itemsPerPage + 1;
                    const endIndex = Math.min(currentPage * itemsPerPage, totalIssues);
                    
                    if (totalIssues === 0) return 'No issues found';
                    return `Showing ${startIndex}-${endIndex} of ${totalIssues} issues (Page ${currentPage} of ${totalPages})`;
                  })()}
                </p>
                </div>
                {(() => {
                  if (!selectedRelease) return null;
                  
                  let filteredIssues: JiraIssue[] = [];
                  
                  if (selectedRelease === 'all') {
                    filteredIssues = Object.values(trendData).flat();
                  } else {
                    filteredIssues = trendData[selectedRelease] || [];
                  }
                  
                  if (selectedPortfolio) {
                    filteredIssues = filteredIssues.filter(issue => {
                      const portfolio = issue.portfolio || 'Non-Engg';
                      return portfolio === selectedPortfolio;
                    });
                  }
                  
                  return (
                    <button
                      onClick={() => downloadCSV(filteredIssues)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download CSV
                    </button>
                  );
                })()}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Summary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Portfolio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manager Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      if (!selectedRelease) return null;
                      
                      let filteredIssues: JiraIssue[] = [];
                      
                      if (selectedRelease === 'all') {
                        filteredIssues = Object.values(trendData).flat();
                      } else {
                        filteredIssues = trendData[selectedRelease] || [];
                      }
                      
                      if (selectedPortfolio) {
                        filteredIssues = filteredIssues.filter(issue => {
                          const portfolio = issue.portfolio || 'Non-Engg';
                          return portfolio === selectedPortfolio;
                        });
                      }
                      
                      // Apply pagination
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const displayedIssues = filteredIssues.slice(startIndex, endIndex);
                      
                      return displayedIssues.map((issue, index) => (
                        <tr key={issue.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                            <a 
                              href={`https://celigo.atlassian.net/browse/${issue.key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {issue.key}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {issue.summary}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              issue.priority?.name === 'Critical' ? 'bg-red-100 text-red-800' :
                              issue.priority?.name === 'High' ? 'bg-orange-100 text-orange-800' :
                              issue.priority?.name === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              issue.priority?.name === 'Low' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {issue.priority?.name || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {issue.status?.name || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {issue.assignee?.displayName || 'Unassigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(issue.created).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {issue.portfolio || 'Non-Engg'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {issue.managerGroup || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {issue.team || 'Unknown'}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {(() => {
                if (!selectedRelease) return null;
                
                let filteredIssues: JiraIssue[] = [];
                
                if (selectedRelease === 'all') {
                  filteredIssues = Object.values(trendData).flat();
                } else {
                  filteredIssues = trendData[selectedRelease] || [];
                }
                
                if (selectedPortfolio) {
                  filteredIssues = filteredIssues.filter(issue => {
                    const portfolio = issue.portfolio || 'Non-Engg';
                    return portfolio === selectedPortfolio;
                  });
                }
                
                const totalIssues = filteredIssues.length;
                const totalPages = Math.ceil(totalIssues / itemsPerPage);
                
                if (totalPages <= 1) return null;
                
                return (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing page <span className="font-medium">{currentPage}</span> of{' '}
                            <span className="font-medium">{totalPages}</span>{' '}
                            (<span className="font-medium">{totalIssues}</span> total issues)
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            
                            {/* Page numbers */}
                            {(() => {
                              const pageNumbers = [];
                              const maxVisible = 5;
                              let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                              let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                              
                              if (endPage - startPage + 1 < maxVisible) {
                                startPage = Math.max(1, endPage - maxVisible + 1);
                              }
                              
                              for (let i = startPage; i <= endPage; i++) {
                                pageNumbers.push(
                                  <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                      i === currentPage
                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    {i}
                                  </button>
                                );
                              }
                              
                              return pageNumbers;
                            })()}
                            
                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : null}

          {/* JQL Queries Section */}
          <div className="card mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">JQL Queries for Bug Backlog Trend Columns</h2>
              <p className="text-sm text-gray-600 mt-1">
                The exact JQL queries used to fetch data for each column in the Bug Backlog Trend by Portfolio table
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Bug backlog before April */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Bug backlog before April:</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <code className="text-sm text-gray-800 break-all">
                      project in ("integrator.io", PRE, devops) and created &lt;= 2025-02-25 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-02-26 ORDER BY created DESC
                    </code>
                  </div>
                </div>

                {/* April Backlog Addition */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">April Backlog Addition:</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <code className="text-sm text-gray-800 break-all">
                      project in ("integrator.io", PRE, devops) AND created &gt;= 2025-02-26 AND created &lt;= 2025-04-08 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-04-09 ORDER BY created DESC
                    </code>
                  </div>
                </div>

                {/* April Backlog Resolved */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">April Backlog Resolved:</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <code className="text-sm text-gray-800 break-all">
                      project in ("integrator.io", PRE, devops) and created &lt;= 2025-02-26 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-02-26 and status CHANGED to (Closed, Released, "Pending Release", Cancelled, Done) during (2025-02-26, 2025-04-08) ORDER BY created DESC
                    </code>
                  </div>
                </div>

                {/* May Release addition */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">May Release addition:</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <code className="text-sm text-gray-800 break-all">
                      project in ("integrator.io", PRE, devops) AND created &gt;= 2025-04-09 AND created &lt;= 2025-05-20 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-05-21 ORDER BY created DESC
                    </code>
                  </div>
                </div>

                {/* July Release addition */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">July Release addition:</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <code className="text-sm text-gray-800 break-all">
                      project in ("integrator.io", PRE, devops) AND created &gt;= 2025-05-21 AND created &lt;= 2025-07-01 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-07-02 ORDER BY created DESC
                    </code>
                  </div>
                </div>

                {/* August Release addition */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">August Release addition:</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <code className="text-sm text-gray-800 break-all">
                      project in ("integrator.io", PRE, devops) AND created &gt;= 2025-07-02 AND created &lt;= 2025-08-12 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-08-12 ORDER BY created DESC
                    </code>
                  </div>
                </div>

                {/* Portfolio Mapping Note */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Portfolio Mapping Logic:</h3>
                  <p className="text-sm text-blue-800">
                    All columns use the same portfolio mapping logic as the Triage Analysis tab:
                  </p>
                  <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
                    <li>DevOps project → DevOps portfolio (priority mapping)</li>
                    <li>Team extraction from customfield_12000</li>
                    <li>Manager mapping based on team relationships</li>
                    <li>Manager group fallback mapping</li>
                    <li>Portfolio order: CORE, UI, Platform, AI/ML, IA, QA, DevOps, Non-Engg</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* JQL Queries Section */}
        <div className="card mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">JQL Queries Used for Bug Backlog Trend by Portfolio</h2>
            <p className="text-sm text-gray-600 mt-1">
              Below are the exact JQL queries used for each column in the Bug Backlog Trend by Portfolio table
            </p>
          </div>
          <div className="p-6 space-y-4">
            {/* Before Periods Queries */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3">Bug Backlog Before Release Periods</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Bug backlog before April:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) and created &lt;= 2025-02-25 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-02-26 ORDER BY created DESC
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Bug backlog before May:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) and created &lt;= 2025-04-08 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-04-09 ORDER BY created DESC
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Bug backlog before July:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) and created &lt;= 2025-05-20 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-05-21 ORDER BY created DESC
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Bug backlog before August:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) and created &lt;= 2025-07-01 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-07-02 ORDER BY created DESC
                  </pre>
                </div>
              </div>
            </div>

            {/* Addition Periods Queries */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3">Bug Backlog Addition by Release Periods</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">April Backlog Addition:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) AND created &gt;= 2025-02-26 AND created &lt;= 2025-04-08 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-04-09 ORDER BY created DESC
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">May Release addition:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) AND created &gt;= 2025-04-09 AND created &lt;= 2025-05-20 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-05-21 ORDER BY created DESC
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">July Release addition:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) AND created &gt;= 2025-05-21 AND created &lt;= 2025-07-01 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-07-02 ORDER BY created DESC
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">August Release addition:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) AND created &gt;= 2025-07-02 AND created &lt;= 2025-08-12 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-08-12 ORDER BY created DESC
                  </pre>
                </div>
              </div>
            </div>

            {/* Resolved Periods Queries */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3">Bug Backlog Resolved by Release Periods</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">April Backlog Resolved:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) and created &lt;= 2025-02-26 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-02-26 and status CHANGED to (Closed, Released, "Pending Release", Cancelled, Done) during (2025-02-26, 2025-04-08) ORDER BY created DESC
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">May Backlog Resolved:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) and created &lt;= 2025-04-08 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-04-09 and status CHANGED to (Closed, Released, "Pending Release", Cancelled, Done) during (2025-04-09,2025-05-20) ORDER BY created DESC
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">July Backlog Resolved:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) and created &lt;= 2025-05-20 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-05-21 and status CHANGED to (Closed, Released, "Pending Release", Cancelled, Done) during (2025-05-21,2025-07-01) ORDER BY created DESC
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">August Backlog Resolved:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
project in ("integrator.io", PRE, devops) and created &lt;= 2025-07-01 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-07-02 and status CHANGED to (Closed, Released, "Pending Release", Cancelled, Done) during (2025-07-02,2025-08-12) ORDER BY created DESC
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}