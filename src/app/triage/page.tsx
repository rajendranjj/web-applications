'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import DashboardNavigation from '@/components/DashboardNavigation';
import ReleaseFilter from '@/components/ReleaseFilter';
import { JiraIssue } from '@/types/jira';
import { fetchTriagedBugs } from '@/lib/jiraApi';
import { RefreshCw } from 'lucide-react';

export default function TriageAnalysisPage() {
  const [bugs, setBugs] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState('april');
  const [refreshing, setRefreshing] = useState(false);

  const loadBugs = async (release: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTriagedBugs(release);
      setBugs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bugs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBugs(selectedRelease);
  }, [selectedRelease]);

  const handleReleaseChange = (release: string) => {
    setSelectedRelease(release);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBugs(selectedRelease);
    setRefreshing(false);
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
            className="btn-primary mt-4"
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
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Jira Bugs Analysis Dashboard
                </h1>
                <p className="text-gray-600">
                  Monitor and analyze bugs and triage performance across your projects
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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

          <ReleaseFilter 
            selectedRelease={selectedRelease}
            onReleaseChange={handleReleaseChange}
          />

          <Dashboard bugs={bugs} selectedRelease={selectedRelease} />
        </div>
      </div>
    </main>
  );
}