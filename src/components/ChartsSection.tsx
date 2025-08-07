'use client';

import { JiraIssue, BugMetrics } from '@/types/jira';

interface ChartsSectionProps {
  bugs: JiraIssue[];
  metrics: BugMetrics;
}

export default function ChartsSection({ bugs, metrics }: ChartsSectionProps) {
  // No charts to display - Portfolio Distribution chart removed
  return null;
}