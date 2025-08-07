'use client';

import { useState, useEffect } from 'react';
import BacklogDashboard from '@/components/BacklogDashboard';
import DashboardNavigation from '@/components/DashboardNavigation';
import BacklogReleaseFilter from '@/components/BacklogReleaseFilter';
import { JiraIssue } from '@/types/jira';
import { fetchBacklogBugs } from '@/lib/jiraApi';

export default function BacklogPage() {
  const [bugs, setBugs] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState('all');

  const loadBacklogBugs = async (release: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBacklogBugs(release);
      setBugs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch backlog bugs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBacklogBugs(selectedRelease);
  }, [selectedRelease]);

  const handleReleaseChange = (release: string) => {
    setSelectedRelease(release);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bug Backlog Analysis Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor and analyze your bug backlog across all portfolios and releases
            </p>
          </div>

          <DashboardNavigation />

          <BacklogReleaseFilter 
            selectedRelease={selectedRelease}
            onReleaseChange={handleReleaseChange}
          />

          <BacklogDashboard bugs={bugs} selectedRelease={selectedRelease} />
        </div>
      </div>
    </main>
  );
}