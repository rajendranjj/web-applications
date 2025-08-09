'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardNavigation from '@/components/DashboardNavigation';
import { RefreshCw, Search, ExternalLink, User, Clock, ChevronUp, ChevronDown, Download } from 'lucide-react';
import { JiraIssue } from '@/types/jira';
import { format } from 'date-fns';

interface TrendData {
  [key: string]: JiraIssue[];
}

// Helper function to group issues by portfolio for table display
const groupByPortfolio = (issues: JiraIssue[]): { [portfolio: string]: JiraIssue[] } => {
  return issues.reduce((acc, issue) => {
    const portfolio = issue.portfolio || 'Unknown';
    if (!acc[portfolio]) {
      acc[portfolio] = [];
    }
    acc[portfolio].push(issue);
    return acc;
  }, {} as { [portfolio: string]: JiraIssue[] });
};

export default function BacklogTrendPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendData, setTrendData] = useState<TrendData>({});
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [detailedIssues, setDetailedIssues] = useState<JiraIssue[]>([]);
  
  // Detailed Issues Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterPortfolio, setFilterPortfolio] = useState('all');
  const [filterManagerGroup, setFilterManagerGroup] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'key' | 'summary' | 'priority' | 'status' | 'created' | 'updated'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 25;

  const loadTrendData = async () => {
    try {
      const response = await fetch('/api/jira/backlog-trend');
      if (response.ok) {
        const data = await response.json();
        setTrendData(data);
      }
    } catch (error) {
      console.error('Error loading trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrendData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrendData();
    setRefreshing(false);
  };

  const releases = ['April', 'May', 'July', 'August'];

  // Calculate totals for the line graph
  const lineData = releases.map(release => {
    const beforeKey = `before${release}`;
    const addedKey = release.toLowerCase();
    const resolvedKey = `${release.toLowerCase()}Resolved`;
    
    const beforeCount = (trendData[beforeKey] || []).length;
    const addedCount = (trendData[addedKey] || []).length;
    const resolvedCount = (trendData[resolvedKey] || []).length;
    
    return {
      period: release,
      bugBacklog: beforeCount,
      additionToBacklog: addedCount,
      resolvedFromBacklog: resolvedCount
    };
  });

  // Handle line click
  const handleLineClick = (dataType: string) => {
    setSelectedTable(dataType);
    setSelectedPortfolio(null);
    setSelectedPeriod(null);
    setDetailedIssues([]);
  };

  // Handle portfolio/period click
  const handleCellClick = (portfolio: string, period: string, dataType: string) => {
    setSelectedPortfolio(portfolio);
    setSelectedPeriod(period);
    
    let periodData: JiraIssue[] = [];
    if (dataType === 'before') {
      const beforeKey = `before${period}`;
      periodData = trendData[beforeKey] || [];
    } else if (dataType === 'added') {
      const addedKey = period.toLowerCase();
      periodData = trendData[addedKey] || [];
    } else if (dataType === 'resolved') {
      const resolvedKey = `${period.toLowerCase()}Resolved`;
      periodData = trendData[resolvedKey] || [];
    }

    const portfolioIssues = periodData.filter(issue => 
      (issue.portfolio || 'Unknown') === portfolio
    );
    setDetailedIssues(portfolioIssues);
    // Reset pagination when new data is loaded
    setCurrentPage(1);
  };

  // Helper functions for detailed issues table
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-blue-600 bg-blue-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Triaged': return 'text-blue-600 bg-blue-50';
      case 'In Progress': return 'text-orange-600 bg-orange-50';
      case 'Resolved': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleSort = (field: 'key' | 'summary' | 'priority' | 'status' | 'created' | 'updated') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: 'key' | 'summary' | 'priority' | 'status' | 'created' | 'updated' }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  // Get unique values for filter options
  const uniqueTeams = useMemo(() => {
    const teams = detailedIssues.map(issue => issue.team).filter(Boolean);
    return Array.from(new Set(teams)).sort();
  }, [detailedIssues]);

  const uniquePortfolios = useMemo(() => {
    const portfolios = detailedIssues.map(issue => issue.portfolio).filter(Boolean);
    return Array.from(new Set(portfolios)).sort();
  }, [detailedIssues]);

  const uniqueStatuses = useMemo(() => {
    const statuses = detailedIssues.map(issue => issue.status?.name).filter(Boolean);
    return Array.from(new Set(statuses)).sort();
  }, [detailedIssues]);

  const uniquePriorities = useMemo(() => {
    const priorities = detailedIssues.map(issue => issue.priority?.name).filter(Boolean);
    return Array.from(new Set(priorities)).sort();
  }, [detailedIssues]);

  const uniqueManagerGroups = useMemo(() => {
    const managerGroups = detailedIssues.map(issue => issue.managerGroup).filter(Boolean);
    return Array.from(new Set(managerGroups)).sort();
  }, [detailedIssues]);

  // Filter and sort detailed issues
  const filteredAndSortedIssues = useMemo(() => {
    let filtered = detailedIssues.filter(issue => {
      const matchesSearch = !searchTerm || 
        issue.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.summary.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || issue.status?.name === filterStatus;
      const matchesPriority = filterPriority === 'all' || issue.priority?.name === filterPriority;
      const matchesTeam = filterTeam === 'all' || issue.team === filterTeam;
      const matchesPortfolio = filterPortfolio === 'all' || 
        (filterPortfolio === 'unknown' ? !issue.portfolio : issue.portfolio === filterPortfolio);
      const matchesManagerGroup = filterManagerGroup === 'all' || issue.managerGroup === filterManagerGroup;

      return matchesSearch && matchesStatus && matchesPriority && matchesTeam && matchesPortfolio && matchesManagerGroup;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortField) {
        case 'key':
          aValue = a.key;
          bValue = b.key;
          break;
        case 'summary':
          aValue = a.summary;
          bValue = b.summary;
          break;
        case 'priority':
          aValue = a.priority?.name || '';
          bValue = b.priority?.name || '';
          break;
        case 'status':
          aValue = a.status?.name || '';
          bValue = b.status?.name || '';
          break;
        case 'created':
          aValue = new Date(a.created);
          bValue = new Date(b.created);
          break;
        case 'updated':
          aValue = new Date(a.updated);
          bValue = new Date(b.updated);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [detailedIssues, searchTerm, filterStatus, filterPriority, filterTeam, filterPortfolio, filterManagerGroup, sortField, sortOrder]);

  // Pagination logic
  const paginationData = useMemo(() => {
    const totalItems = filteredAndSortedIssues.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentItems = filteredAndSortedIssues.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      currentItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [filteredAndSortedIssues, currentPage, itemsPerPage]);

  // Download CSV function
  const downloadCSV = () => {
    const headers = ['Key', 'Summary', 'Status', 'Priority', 'Assignee', 'Created', 'Updated', 'Team', 'Portfolio', 'Manager Group'];
    
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedIssues.map(issue => [
        issue.key,
        `"${issue.summary.replace(/"/g, '""')}"`,
        issue.status?.name || '',
        issue.priority?.name || '',
        issue.assignee?.displayName || 'Unassigned',
        format(new Date(issue.created), 'yyyy-MM-dd'),
        format(new Date(issue.updated), 'yyyy-MM-dd'),
        issue.team || '',
        issue.portfolio || '',
        issue.managerGroup || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `backlog-trend-issues-${selectedPortfolio}-${selectedPeriod}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Bug Backlog Trend Analysis Dashboard
                </h1>
                <p className="text-gray-600">
                  Monitor and analyze backlog trends across different release periods
                </p>
              </div>
              <button 
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                title="Refresh data"
              >
                <RefreshCw 
                  className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
                />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <DashboardNavigation />

          {/* Consolidated Line Graph */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Consolidated Bug Backlog Trends</h2>
            
            <div className="relative">
              <svg width="800" height="400" className="mx-auto">
                <defs>
                  <style>{`
                    .line-chart-text { font-family: Arial, sans-serif; font-size: 12px; }
                    .clickable-line { cursor: pointer; stroke-width: 3; }
                    .clickable-line:hover { stroke-width: 4; }
                  `}</style>
                </defs>
                
                {/* Chart area */}
                <rect x="60" y="20" width="700" height="320" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                
                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <g key={i}>
                    <line x1="60" y1={20 + i * 64} x2="760" y2={20 + i * 64} stroke="#f3f4f6" strokeWidth="1"/>
                    <text x="50" y={25 + i * 64} className="line-chart-text" textAnchor="end" fill="#6b7280">
                      {(5 - i) * 125}
                    </text>
                  </g>
                ))}
                
                {/* X-axis labels */}
                {releases.map((release, i) => (
                  <text key={release} x={135 + i * 175} y="360" className="line-chart-text" textAnchor="middle" fill="#374151">
                    {release}
                  </text>
                ))}
                
                {/* Lines */}
                {lineData.length > 0 && (
                  <>
                    {/* Bug backlog line */}
                    <polyline
                      points={lineData.map((d, i) => `${135 + i * 175},${340 - (d.bugBacklog / 625) * 320}`).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      className="clickable-line"
                      onClick={() => handleLineClick('before')}
                    />
                    
                    {/* Addition to backlog line */}
                    <polyline
                      points={lineData.map((d, i) => `${135 + i * 175},${340 - (d.additionToBacklog / 625) * 320}`).join(' ')}
                      fill="none"
                      stroke="#ef4444"
                      className="clickable-line"
                      onClick={() => handleLineClick('added')}
                    />
                    
                    {/* Resolved from backlog line */}
                    <polyline
                      points={lineData.map((d, i) => `${135 + i * 175},${340 - (d.resolvedFromBacklog / 625) * 320}`).join(' ')}
                      fill="none"
                      stroke="#10b981"
                      className="clickable-line"
                      onClick={() => handleLineClick('resolved')}
                    />
                    
                    {/* Data points and labels */}
                    {lineData.map((d, i) => (
                      <g key={i}>
                        {/* Bug backlog */}
                        <circle cx={135 + i * 175} cy={340 - (d.bugBacklog / 625) * 320} r="4" fill="#3b82f6"/>
                        <text x={135 + i * 175} y={335 - (d.bugBacklog / 625) * 320} className="line-chart-text" textAnchor="middle" fill="#3b82f6" fontWeight="bold">
                          {d.bugBacklog}
                        </text>
                        
                        {/* Addition to backlog */}
                        <circle cx={135 + i * 175} cy={340 - (d.additionToBacklog / 625) * 320} r="4" fill="#ef4444"/>
                        <text x={135 + i * 175} y={330 - (d.additionToBacklog / 625) * 320} className="line-chart-text" textAnchor="middle" fill="#ef4444" fontWeight="bold">
                          {d.additionToBacklog}
                        </text>
                        
                        {/* Resolved from backlog */}
                        <circle cx={135 + i * 175} cy={340 - (d.resolvedFromBacklog / 625) * 320} r="4" fill="#10b981"/>
                        <text x={135 + i * 175} y={325 - (d.resolvedFromBacklog / 625) * 320} className="line-chart-text" textAnchor="middle" fill="#10b981" fontWeight="bold">
                          {d.resolvedFromBacklog}
                        </text>
                      </g>
                    ))}
                  </>
                )}
                
                {/* Legend */}
                <g transform="translate(60, 380)">
                  <rect x="0" y="0" width="20" height="3" fill="#3b82f6"/>
                  <text x="25" y="10" className="line-chart-text" fill="#374151">Bug backlog</text>
                  
                  <rect x="150" y="0" width="20" height="3" fill="#ef4444"/>
                  <text x="175" y="10" className="line-chart-text" fill="#374151">Addition to backlog</text>
                  
                  <rect x="320" y="0" width="20" height="3" fill="#10b981"/>
                  <text x="345" y="10" className="line-chart-text" fill="#374151">Resolved from backlog</text>
                </g>
              </svg>
            </div>
          </div>

          {/* Tables based on selected line */}
          {selectedTable === 'before' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bug Backlog Before Release Periods</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio</th>
                      {releases.map(release => (
                        <th key={release} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{release}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Unknown'].map((portfolio, index) => (
                      <tr key={portfolio} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {portfolio}
                          </span>
                        </td>
                        {releases.map(release => {
                          const beforeKey = `before${release}`;
                          const count = (trendData[beforeKey] || [])
                            .filter(issue => (issue.portfolio || 'Unknown') === portfolio).length;
                          return (
                            <td key={release} className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold">
                              {count > 0 ? (
                                <button
                                  onClick={() => handleCellClick(portfolio, release, 'before')}
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors duration-200"
                                  title={`View ${count} backlog issues for ${portfolio} portfolio in ${release}`}
                                >
                                  {count}
                                </button>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Total
                        </span>
                      </td>
                      {releases.map(release => {
                        const beforeKey = `before${release}`;
                        const total = (trendData[beforeKey] || []).length;
                        return (
                          <td key={release} className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                            {total}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Similar tables for other data types */}
          {selectedTable === 'added' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bug Backlog Addition by Release Period</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio</th>
                      {releases.map(release => (
                        <th key={release} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{release}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Unknown'].map((portfolio, index) => (
                      <tr key={portfolio} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {portfolio}
                          </span>
                        </td>
                        {releases.map(release => {
                          const addedKey = release.toLowerCase();
                          const count = (trendData[addedKey] || [])
                            .filter(issue => (issue.portfolio || 'Unknown') === portfolio).length;
                          return (
                            <td key={release} className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold">
                              {count > 0 ? (
                                <button
                                  onClick={() => handleCellClick(portfolio, release, 'added')}
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors duration-200"
                                  title={`View ${count} backlog addition issues for ${portfolio} portfolio in ${release}`}
                                >
                                  {count}
                                </button>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Total
                        </span>
                      </td>
                      {releases.map(release => {
                        const addedKey = release.toLowerCase();
                        const total = (trendData[addedKey] || []).length;
                        return (
                          <td key={release} className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                            {total}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedTable === 'resolved' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bug Backlog Resolved by Release Period</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio</th>
                      {releases.map(release => (
                        <th key={release} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{release}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {['CORE', 'UI', 'Platform', 'AI/ML', 'IA', 'QA', 'DevOps', 'Unknown'].map((portfolio, index) => (
                      <tr key={portfolio} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {portfolio}
                          </span>
                        </td>
                        {releases.map(release => {
                          const resolvedKey = `${release.toLowerCase()}Resolved`;
                          const count = (trendData[resolvedKey] || [])
                            .filter(issue => (issue.portfolio || 'Unknown') === portfolio).length;
                          return (
                            <td key={release} className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold">
                              {count > 0 ? (
                                <button
                                  onClick={() => handleCellClick(portfolio, release, 'resolved')}
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors duration-200"
                                  title={`View ${count} resolved backlog issues for ${portfolio} portfolio in ${release}`}
                                >
                                  {count}
                                </button>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Total
                        </span>
                      </td>
                      {releases.map(release => {
                        const resolvedKey = `${release.toLowerCase()}Resolved`;
                        const total = (trendData[resolvedKey] || []).length;
                        return (
                          <td key={release} className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                            {total}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed Issues Table */}
          {detailedIssues.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Issues: {selectedPortfolio} - {selectedPeriod} ({paginationData.startIndex + 1}-{paginationData.endIndex} of {paginationData.totalItems})
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600">Filtered by Portfolio Summary:</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Portfolio: {selectedPortfolio}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Period: {selectedPeriod}
                    </span>
                    <button
                      onClick={() => setDetailedIssues([])}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline ml-2"
                    >
                      Close Issues View
                    </button>
                  </div>
                </div>
                <button
                  onClick={downloadCSV}
                  disabled={filteredAndSortedIssues.length === 0}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </button>
              </div>

              {/* Filters */}
              <div className="card mb-4">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search issues..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Filter Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Team Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                      <select
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="all">All Teams</option>
                        {uniqueTeams.map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                    </div>

                    {/* Portfolio Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                      <select
                        value={filterPortfolio}
                        onChange={(e) => setFilterPortfolio(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="all">All Portfolios</option>
                        {uniquePortfolios.map(portfolio => (
                          <option key={portfolio} value={portfolio}>{portfolio}</option>
                        ))}
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>

                    {/* Manager Group Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manager Group</label>
                      <select
                        value={filterManagerGroup}
                        onChange={(e) => setFilterManagerGroup(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="all">All Manager Groups</option>
                        {uniqueManagerGroups.map(managerGroup => (
                          <option key={managerGroup} value={managerGroup}>{managerGroup}</option>
                        ))}
                      </select>
                    </div>

                    {/* Priority Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="all">All Priorities</option>
                        {uniquePriorities.map(priority => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status Filter Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="all">All Statuses</option>
                        {uniqueStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Clear Filters Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                        setFilterPriority('all');
                        setFilterTeam('all');
                        setFilterPortfolio('all');
                        setFilterManagerGroup('all');
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('key')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Key</span>
                            <SortIcon field="key" />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('summary')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Summary</span>
                            <SortIcon field="summary" />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('priority')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Priority</span>
                            <SortIcon field="priority" />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            <SortIcon field="status" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assignee
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('created')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Created</span>
                            <SortIcon field="created" />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('updated')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Updated</span>
                            <SortIcon field="updated" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Portfolio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Manager Group
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginationData.currentItems.map((issue) => (
                        <tr key={issue.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <a 
                              href={`https://celigo.atlassian.net/browse/${issue.key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              {issue.key}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                            <div className="truncate" title={issue.summary}>
                              {issue.summary}
                            </div>
                            {issue.components && issue.components.length > 0 && (
                              <div className="mt-1">
                                {issue.components.map((comp, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mr-1"
                                  >
                                    {comp.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority?.name || '')}`}>
                              {issue.priority?.name || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status?.name || '')}`}>
                              {issue.status?.name || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {issue.assignee ? (
                              <div className="flex items-center">
                                <User className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="truncate" title={issue.assignee.displayName}>
                                  {issue.assignee.displayName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {format(new Date(issue.created), 'MMM dd, yyyy')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {format(new Date(issue.updated), 'MMM dd, yyyy')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {issue.team || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {issue.portfolio || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {issue.managerGroup || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {paginationData.totalPages > 1 && (
                  <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!paginationData.hasPrevPage}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!paginationData.hasNextPage}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{paginationData.startIndex + 1}</span> to{' '}
                          <span className="font-medium">{paginationData.endIndex}</span> of{' '}
                          <span className="font-medium">{paginationData.totalItems}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={!paginationData.hasPrevPage}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                            const page = Math.max(1, currentPage - 2) + i;
                            if (page > paginationData.totalPages) return null;
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === currentPage
                                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={!paginationData.hasNextPage}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}