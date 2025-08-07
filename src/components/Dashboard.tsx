'use client';

import { useMemo, useState, useRef } from 'react';
import { JiraIssue } from '@/types/jira';
import { calculateBugMetrics } from '@/lib/jiraApi';
import MetricsOverview from './MetricsOverview';
import BugsList from './BugsList';
import ChartsSection from './ChartsSection';
import PortfolioSummaryTable from './PortfolioSummaryTable';
import TriageBugSummaryTable from './TriageBugSummaryTable';
import Header from './Header';
import { useTriageBugs } from '@/hooks/useTriageBugs';

interface DashboardProps {
  bugs: JiraIssue[];
  selectedRelease: string;
}

export default function Dashboard({ bugs, selectedRelease }: DashboardProps) {
  const metrics = useMemo(() => calculateBugMetrics(bugs), [bugs]);
  const [portfolioFilter, setPortfolioFilter] = useState<string>('');
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState<boolean>(false);
  const [showBugsList, setShowBugsList] = useState<boolean>(false);
  const bugsListRef = useRef<HTMLDivElement>(null);

  // Fetch triage bug data using the global selectedRelease
  const { triageBugs, loading: triageLoading, error: triageError } = useTriageBugs(selectedRelease);

  // Calculate triage totals for metrics
  const triageTotals = useMemo(() => {
    if (!triageBugs.length) return undefined;
    
    const totalTriageIssues = triageBugs.length;
    const totalTotalIssues = bugs.length;
    const overallPercentageTriaged = totalTotalIssues > 0 ? (totalTriageIssues / totalTotalIssues) * 100 : 0;
    
    return {
      totalTriageIssues,
      totalTotalIssues,
      overallPercentageTriaged
    };
  }, [triageBugs, bugs]);

  const handlePortfolioClick = (portfolio: string, unresolvedOnly: boolean = false) => {
    setPortfolioFilter(portfolio);
    setShowUnresolvedOnly(unresolvedOnly);
    setShowBugsList(true);
    
    // Scroll to bugs list after a brief delay to allow state to update
    setTimeout(() => {
      bugsListRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  return (
    <div>
      <Header />
      
      <div className="space-y-8">
        {/* Metrics Overview */}
        <MetricsOverview metrics={metrics} triageData={triageTotals} />

        {/* Charts Section */}
        <ChartsSection bugs={bugs} metrics={metrics} />

        {/* Portfolio Summary Table */}
        <PortfolioSummaryTable 
          bugs={bugs} 
          onPortfolioClick={handlePortfolioClick}
        />

        {/* Triage Bug Summary Table */}
        {triageLoading ? (
          <div className="card">
            <div className="p-6 text-center text-gray-500">
              Loading triage data...
            </div>
          </div>
        ) : triageError ? (
          <div className="card">
            <div className="p-6 text-center text-red-500">
              Error loading triage data: {triageError}
            </div>
          </div>
        ) : (
          <TriageBugSummaryTable 
            bugs={triageBugs}
            mainBugs={bugs}
            selectedRelease={selectedRelease}
          />
        )}

        {/* Bugs List - Only show when a portfolio link is clicked */}
        {showBugsList && (
          <div ref={bugsListRef}>
            <BugsList 
              bugs={bugs}
              externalPortfolioFilter={portfolioFilter}
              externalShowUnresolvedOnly={showUnresolvedOnly}
              onClearExternalFilters={() => {
                setPortfolioFilter('');
                setShowUnresolvedOnly(false);
                setShowBugsList(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}