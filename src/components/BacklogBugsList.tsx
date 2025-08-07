'use client';

import { useState, useMemo, useEffect } from 'react';
import { JiraIssue } from '@/types/jira';
import { format } from 'date-fns';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  ExternalLink,
  User,
  Clock,
  Download
} from 'lucide-react';

interface BacklogBugsListProps {
  bugs: JiraIssue[];
  externalPortfolioFilter?: string;
  externalShowCriticalOnly?: boolean;
  externalAgeFilter?: string;
  onClearExternalFilters?: () => void;
}

type SortField = 'key' | 'summary' | 'priority' | 'status' | 'assignee' | 'created' | 'updated' | 'age';
type SortOrder = 'asc' | 'desc';

export default function BacklogBugsList({ 
  bugs, 
  externalPortfolioFilter = '', 
  externalShowCriticalOnly = false, 
  externalAgeFilter = '',
  onClearExternalFilters 
}: BacklogBugsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterPortfolio, setFilterPortfolio] = useState('all');
  const [filterManagerGroup, setFilterManagerGroup] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredAndSortedBugs = useMemo(() => {
    let filtered = bugs.filter(bug => {
      const matchesSearch = bug.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bug.key.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || bug.status.name === filterStatus;
      const matchesPriority = filterPriority === 'all' || bug.priority.name === filterPriority;
      const matchesTeam = filterTeam === 'all' || bug.team === filterTeam;
      const matchesPortfolio = filterPortfolio === 'all' || 
                               (filterPortfolio === 'unknown' ? !bug.portfolio : bug.portfolio === filterPortfolio);
      const matchesManagerGroup = filterManagerGroup === 'all' || 
                                 (filterManagerGroup === 'unknown' ? !bug.managerGroup : bug.managerGroup === filterManagerGroup);
      
      // External filters take precedence
      const matchesExternalPortfolio = !externalPortfolioFilter || 
                                      (externalPortfolioFilter === 'Unknown' ? !bug.portfolio : bug.portfolio === externalPortfolioFilter);
      const matchesExternalCritical = !externalShowCriticalOnly || bug.priority.name === 'Critical';
      
      // Age filter logic
      let matchesExternalAge = true;
      if (externalAgeFilter && externalAgeFilter !== 'all') {
        const bugAge = Math.floor((new Date().getTime() - new Date(bug.created).getTime()) / (1000 * 60 * 60 * 24));
        switch (externalAgeFilter) {
          case '30days':
            matchesExternalAge = bugAge <= 30;
            break;
          case '60days':
            matchesExternalAge = bugAge <= 60;
            break;
          case '180days':
            matchesExternalAge = bugAge <= 180;
            break;
          case '365days':
            matchesExternalAge = bugAge <= 365;
            break;
          case 'over365days':
            matchesExternalAge = bugAge > 365;
            break;
          default:
            matchesExternalAge = true;
        }
      }
      
      return matchesSearch && matchesStatus && matchesPriority && matchesTeam && 
             matchesPortfolio && matchesManagerGroup && matchesExternalPortfolio && matchesExternalCritical && matchesExternalAge;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'key':
          aValue = a.key;
          bValue = b.key;
          break;
        case 'summary':
          aValue = a.summary.toLowerCase();
          bValue = b.summary.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'None': 0 };
          aValue = priorityOrder[a.priority.name as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority.name as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          aValue = a.status.name;
          bValue = b.status.name;
          break;
        case 'assignee':
          aValue = a.assignee?.displayName?.toLowerCase() || 'zzz_unassigned'; // Sort unassigned to the end
          bValue = b.assignee?.displayName?.toLowerCase() || 'zzz_unassigned';
          break;
        case 'created':
          aValue = new Date(a.created);
          bValue = new Date(b.created);
          break;
        case 'updated':
          aValue = new Date(a.updated);
          bValue = new Date(b.updated);
          break;
        case 'age':
          const aAge = Math.floor((new Date().getTime() - new Date(a.created).getTime()) / (1000 * 60 * 60 * 24));
          const bAge = Math.floor((new Date().getTime() - new Date(b.created).getTime()) / (1000 * 60 * 60 * 24));
          aValue = aAge;
          bValue = bAge;
          break;
        default:
          aValue = a[sortField as keyof JiraIssue];
          bValue = b[sortField as keyof JiraIssue];
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [bugs, searchTerm, sortField, sortOrder, filterStatus, filterPriority, filterTeam, filterPortfolio, filterManagerGroup, externalPortfolioFilter, externalShowCriticalOnly, externalAgeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPriority, filterTeam, filterPortfolio, filterManagerGroup, externalPortfolioFilter, externalShowCriticalOnly, externalAgeFilter]);

  // Calculate pagination data
  const paginationData = useMemo(() => {
    const totalItems = filteredAndSortedBugs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredAndSortedBugs.slice(startIndex, endIndex);
    
    return {
      currentItems,
      totalItems,
      totalPages,
      startIndex,
      endIndex: Math.min(endIndex, totalItems),
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [filteredAndSortedBugs, currentPage, itemsPerPage]);

  // CSV download function
  const downloadCSV = () => {
    const headers = [
      'Issue Key',
      'Summary', 
      'Priority',
      'Status',
      'Assignee',
      'Created',
      'Age (Days)',
      'Portfolio',
      'Team',
      'Manager Group'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredAndSortedBugs.map(bug => {
        const age = Math.floor((new Date().getTime() - new Date(bug.created).getTime()) / (1000 * 60 * 60 * 24));
        return [
          bug.key,
          `"${bug.summary.replace(/"/g, '""')}"`,
          bug.priority?.name || 'Unknown',
          bug.status?.name || 'Unknown', 
          bug.assignee?.displayName || 'Unassigned',
          bug.created ? format(new Date(bug.created), 'yyyy-MM-dd HH:mm:ss') : '',
          age,
          bug.portfolio || 'Unknown',
          bug.team || 'Unknown',
          bug.managerGroup || 'Unknown'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `backlog-bugs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get unique values for filter options
  const uniqueTeams = useMemo(() => {
    const teams = bugs.map(bug => bug.team).filter(Boolean);
    return Array.from(new Set(teams)).sort();
  }, [bugs]);

  const uniquePortfolios = useMemo(() => {
    const portfolios = bugs.map(bug => bug.portfolio).filter(Boolean);
    return Array.from(new Set(portfolios)).sort();
  }, [bugs]);

  const uniqueStatuses = useMemo(() => {
    const statuses = bugs.map(bug => bug.status.name);
    return Array.from(new Set(statuses)).sort();
  }, [bugs]);

  const uniquePriorities = useMemo(() => {
    const priorities = bugs.map(bug => bug.priority.name);
    return Array.from(new Set(priorities)).sort();
  }, [bugs]);

  const uniqueManagerGroups = useMemo(() => {
    const managerGroups = bugs.map(bug => bug.managerGroup).filter(Boolean);
    return Array.from(new Set(managerGroups)).sort();
  }, [bugs]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const calculateAge = (created: string) => {
    const createdDate = new Date(created);
    const now = new Date();
    return Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    const openStatuses = ['Open', 'To Do', 'Reopened'];
    const progressStatuses = ['In Progress', 'Analysis', 'Code Review'];
    const qaStatuses = ['Ready for QA', 'In QA'];
    
    if (openStatuses.includes(status)) return 'bg-red-100 text-red-800';
    if (progressStatuses.includes(status)) return 'bg-blue-100 text-blue-800';
    if (qaStatuses.includes(status)) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Backlog Issues ({paginationData.startIndex + 1}-{paginationData.endIndex} of {paginationData.totalItems})
          </h2>
          {(externalPortfolioFilter || externalShowCriticalOnly) && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">Filtered by Portfolio Summary:</span>
              {externalPortfolioFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Portfolio: {externalPortfolioFilter}
                </span>
              )}
              {externalShowCriticalOnly && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Critical Only
                </span>
              )}
              {onClearExternalFilters && (
                <button
                  onClick={onClearExternalFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline ml-2"
                >
                  Clear Portfolio Filters
                </button>
              )}
            </div>
          )}
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search issues..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

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
              <option value="unknown">Unknown</option>
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

          {/* Status Filter */}
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
        <div className="flex justify-end mt-4">
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

      {/* Bugs Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('key')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Issue Key</span>
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
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('assignee')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Assignee</span>
                    <SortIcon field="assignee" />
                  </div>
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
                  onClick={() => handleSort('age')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Age (Days)</span>
                    <SortIcon field="age" />
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
              {paginationData.currentItems.map((bug) => (
                <tr key={bug.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a 
                      href={`https://celigo.atlassian.net/browse/${bug.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      title={`View Jira issue ${bug.key}`}
                    >
                      {bug.key}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                    <div className="truncate" title={bug.summary}>
                      {bug.summary}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(bug.priority.name)}`}>
                      {bug.priority.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bug.status.name)}`}>
                      {bug.status.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {bug.assignee?.displayName || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="text-sm" title={format(new Date(bug.created), 'MMM dd, yyyy - HH:mm')}>
                      {format(new Date(bug.created), 'MMM dd, yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {calculateAge(bug.created)}d
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {bug.team || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {bug.portfolio || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {bug.managerGroup || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {paginationData.totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-white">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!paginationData.hasPrevPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(paginationData.totalPages, currentPage + 1))}
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
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={!paginationData.hasPrevPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronUp className="h-5 w-5 rotate-[-90deg]" aria-hidden="true" />
                  </button>
                  {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(paginationData.totalPages, currentPage + 1))}
                    disabled={!paginationData.hasNextPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronUp className="h-5 w-5 rotate-90" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}