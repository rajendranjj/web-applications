'use client';

import { useState, useEffect } from 'react';
import { JiraIssue } from '@/types/jira';

export function useTriageBugs(selectedRelease: string) {
  const [triageBugs, setTriageBugs] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTriageBugs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/jira/triage-bugs?release=${selectedRelease}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch triage bugs: ${response.status}`);
        }
        
        const data = await response.json();
        setTriageBugs(data);
      } catch (err) {
        console.error('Error fetching triage bugs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch triage bugs');
        setTriageBugs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTriageBugs();
  }, [selectedRelease]);

  return { triageBugs, loading, error };
}