'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import DashboardNavigation from '@/components/DashboardNavigation';
import ReleaseFilter from '@/components/ReleaseFilter';
import { JiraIssue } from '@/types/jira';
import { fetchTriagedBugs } from '@/lib/jiraApi';

export default function Home() {
  const [bugs, setBugs] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState('april');

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
              Jira Bugs Analysis Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor and analyze bugs and triage performance across your projects
            </p>
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