'use client';

import { useMemo, useState, useRef } from 'react';
import { JiraIssue } from '@/types/jira';
import BacklogMetricsOverview from './BacklogMetricsOverview';
import BacklogPieChart from './BacklogPieChart';
import BacklogBugsList from './BacklogBugsList';
import BacklogPortfolioSummaryTable from './BacklogPortfolioSummaryTable';
import Header from './Header';

interface BacklogDashboardProps {
  bugs: JiraIssue[];
  selectedRelease: string;
}

interface BacklogMetrics {
  total: number;
  medium: number;
  low: number;
  bugs30Days: number;
  bugs60Days: number;
  bugs180Days: number;
  bugs365Days: number;
  bugsOver365Days: number;
}

function calculateBacklogMetrics(bugs: JiraIssue[]): BacklogMetrics {
  const total = bugs.length;
  const medium = bugs.filter(bug => bug.priority.name === 'Medium').length;
  const low = bugs.filter(bug => bug.priority.name === 'Low').length;
  
  // Calculate age buckets (bugs created within time periods)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
  const oneEightyDaysAgo = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
  const threeSixtyFiveDaysAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
  
  const bugs30Days = bugs.filter(bug => {
    const created = new Date(bug.created);
    return created >= thirtyDaysAgo;
  }).length;
  
  const bugs60Days = bugs.filter(bug => {
    const created = new Date(bug.created);
    return created >= sixtyDaysAgo;
  }).length;
  
  const bugs180Days = bugs.filter(bug => {
    const created = new Date(bug.created);
    return created >= oneEightyDaysAgo;
  }).length;
  
  const bugs365Days = bugs.filter(bug => {
    const created = new Date(bug.created);
    return created >= threeSixtyFiveDaysAgo;
  }).length;
  
  const bugsOver365Days = bugs.filter(bug => {
    const created = new Date(bug.created);
    return created < threeSixtyFiveDaysAgo;
  }).length;
  
  return {
    total,
    medium,
    low,
    bugs30Days,
    bugs60Days,
    bugs180Days,
    bugs365Days,
    bugsOver365Days
  };
}

export default function BacklogDashboard({ bugs, selectedRelease }: BacklogDashboardProps) {
  const metrics = useMemo(() => calculateBacklogMetrics(bugs), [bugs]);
  const [portfolioFilter, setPortfolioFilter] = useState<string>('');
  const [showCriticalOnly, setShowCriticalOnly] = useState<boolean>(false);
  const [ageFilter, setAgeFilter] = useState<string>('');
  const [selectedPieSegment, setSelectedPieSegment] = useState<string>('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const bugsListRef = useRef<HTMLDivElement>(null);

  const handlePortfolioClick = (portfolio: string, criticalOnly: boolean = false) => {
    setPortfolioFilter(portfolio);
    setShowCriticalOnly(criticalOnly);
    setAgeFilter(''); // Clear age filter when portfolio is clicked
    
    // Scroll to bugs list after a brief delay to allow state to update
    setTimeout(() => {
      bugsListRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handleAgeFilterClick = (ageFilterType: string) => {
    setAgeFilter(ageFilterType);
    setPortfolioFilter(''); // Clear portfolio filter when age filter is clicked
    setShowCriticalOnly(false); // Clear critical filter when age filter is clicked
    
    // Scroll to bugs list after a brief delay to allow state to update
    setTimeout(() => {
      bugsListRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handlePortfolioAgeFilterClick = (portfolio: string, ageFilterType: string) => {
    setPortfolioFilter(portfolio);
    setAgeFilter(ageFilterType);
    setShowCriticalOnly(false);
    
    // Scroll to bugs list after a brief delay to allow state to update
    setTimeout(() => {
      bugsListRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handlePieSegmentClick = (segment: string) => {
    setSelectedPieSegment(segment);
    // Clear other filters when pie segment is selected
    setPortfolioFilter('');
    setShowCriticalOnly(false);
    setAgeFilter('');
    setSelectedPortfolio('');
  };

  const handlePortfolioPieClick = (portfolio: string) => {
    setSelectedPortfolio(portfolio);
    // Keep the Engineering segment selected, don't return to overview
    // setSelectedPieSegment(''); // Removed - stay in drill-down view
    setPortfolioFilter('');
    setShowCriticalOnly(false);
    setAgeFilter('');
  };

  const handlePieChartClear = () => {
    if (selectedPortfolio) {
      // If a portfolio is selected, just clear the portfolio (stay in Engineering drill-down)
      setSelectedPortfolio('');
    } else {
      // If no portfolio is selected, clear the pie segment (return to overview)
      setSelectedPieSegment('');
    }
  };

  return (
    <div>
      <Header />
      
      <div className="space-y-8">
        {/* Backlog Metrics Overview */}
        <BacklogMetricsOverview metrics={metrics} onAgeFilterClick={handleAgeFilterClick} />

        {/* Portfolio Distribution Pie Chart */}
        <BacklogPieChart 
          bugs={bugs} 
          selectedSegment={selectedPieSegment}
          selectedPortfolio={selectedPortfolio}
          onSegmentClick={handlePieSegmentClick}
          onPortfolioClick={handlePortfolioPieClick}
          onClearClick={handlePieChartClear}
        />

        {/* Backlog Portfolio Summary Table */}
        {(selectedPieSegment || selectedPortfolio) && (
          <BacklogPortfolioSummaryTable 
            bugs={bugs} 
            selectedPieSegment={selectedPieSegment}
            selectedPortfolio={selectedPortfolio}
            onPortfolioClick={handlePortfolioClick}
            onAgeFilterClick={handleAgeFilterClick}
            onPortfolioAgeFilterClick={handlePortfolioAgeFilterClick}
          />
        )}

        {/* Backlog Bugs List */}
        {(portfolioFilter || showCriticalOnly || ageFilter) && (
          <div ref={bugsListRef}>
            <BacklogBugsList 
              bugs={bugs}
              externalPortfolioFilter={portfolioFilter}
              externalShowCriticalOnly={showCriticalOnly}
              externalAgeFilter={ageFilter}
              onClearExternalFilters={() => {
                setPortfolioFilter('');
                setShowCriticalOnly(false);
                setAgeFilter('');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}