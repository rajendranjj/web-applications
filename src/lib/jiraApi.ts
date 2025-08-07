import axios from 'axios';
import { JiraIssue, BugMetrics } from '@/types/jira';

// Jira API configuration
const JIRA_BASE_URL = 'https://celigo.atlassian.net';
const JIRA_USERNAME = 'rajendran.joseph.jawahar@celigo.com';
const JIRA_API_TOKEN = process.env.NEXT_PUBLIC_JIRA_API_TOKEN || '';

const jiraApi = axios.create({
  baseURL: `${JIRA_BASE_URL}/rest/api/3`,
  auth: {
    username: JIRA_USERNAME,
    password: JIRA_API_TOKEN,
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Mock data for demonstration (replace with actual API calls)
const mockTriagedBugs: JiraIssue[] = [
  {
    id: '1',
    key: 'BUG-001',
    summary: 'Critical authentication bug causing login failures',
    status: { name: 'Triaged', category: 'In Progress' },
    priority: { name: 'Critical', iconUrl: '' },
    assignee: {
      displayName: 'John Doe',
      emailAddress: 'john.doe@company.com',
      avatarUrls: { '48x48': '' }
    },
    reporter: { displayName: 'Jane Smith', emailAddress: 'jane.smith@company.com' },
    created: '2024-01-15T09:00:00.000Z',
    updated: '2024-01-16T14:30:00.000Z',
    resolved: null,
    labels: ['security', 'authentication'],
    components: [{ name: 'Auth Service' }],
    fixVersions: [{ name: '2024.1.1', releaseDate: '2024-02-01' }],
    customFields: {
      triageDate: '2024-01-15T10:00:00.000Z',
      triageStatus: 'Triaged',
      triagePriority: 'P1'
    }
  },
  {
    id: '2',
    key: 'BUG-002',
    summary: 'UI rendering issue in dashboard charts',
    status: { name: 'Resolved', category: 'Done' },
    priority: { name: 'High', iconUrl: '' },
    assignee: {
      displayName: 'Alice Johnson',
      emailAddress: 'alice.johnson@company.com',
      avatarUrls: { '48x48': '' }
    },
    reporter: { displayName: 'Bob Wilson', emailAddress: 'bob.wilson@company.com' },
    created: '2024-01-14T11:00:00.000Z',
    updated: '2024-01-17T16:45:00.000Z',
    resolved: '2024-01-17T16:45:00.000Z',
    labels: ['ui', 'dashboard'],
    components: [{ name: 'Frontend' }],
    fixVersions: [{ name: '2024.1.0' }],
    customFields: {
      triageDate: '2024-01-14T12:00:00.000Z',
      triageStatus: 'Triaged',
      triagePriority: 'P2'
    }
  },
  {
    id: '3',
    key: 'BUG-003',
    summary: 'Performance degradation in data export functionality',
    status: { name: 'In Progress', category: 'In Progress' },
    priority: { name: 'Medium', iconUrl: '' },
    assignee: {
      displayName: 'Charlie Brown',
      emailAddress: 'charlie.brown@company.com',
      avatarUrls: { '48x48': '' }
    },
    reporter: { displayName: 'Diana Prince', emailAddress: 'diana.prince@company.com' },
    created: '2024-01-13T08:30:00.000Z',
    updated: '2024-01-18T09:15:00.000Z',
    resolved: null,
    labels: ['performance', 'export'],
    components: [{ name: 'Data Service' }],
    fixVersions: [{ name: '2024.1.2' }],
    customFields: {
      triageDate: '2024-01-13T10:30:00.000Z',
      triageStatus: 'Triaged',
      triagePriority: 'P3'
    }
  },
  {
    id: '4',
    key: 'BUG-004',
    summary: 'Email notification service intermittent failures',
    status: { name: 'Triaged', category: 'To Do' },
    priority: { name: 'Low', iconUrl: '' },
    assignee: null,
    reporter: { displayName: 'Eve Adams', emailAddress: 'eve.adams@company.com' },
    created: '2024-01-12T15:20:00.000Z',
    updated: '2024-01-19T11:00:00.000Z',
    resolved: null,
    labels: ['notification', 'email'],
    components: [{ name: 'Notification Service' }],
    fixVersions: [],
    customFields: {
      triageDate: '2024-01-12T16:20:00.000Z',
      triageStatus: 'Triaged',
      triagePriority: 'P4'
    }
  }
];

export async function fetchTriagedBugs(release: string = 'all'): Promise<JiraIssue[]> {
  try {
    // Call our Next.js API route to fetch bugs (avoids CORS issues)
    const url = `/api/jira/bugs${release !== 'all' ? `?release=${release}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const issues: JiraIssue[] = await response.json();
    return issues;
  } catch (error) {
    console.error('Error fetching triaged bugs:', error);
    // Fall back to mock data if API fails
    console.log('Falling back to mock data due to API error');
    return mockTriagedBugs;
  }
}

export async function fetchBacklogBugs(release: string = 'all'): Promise<JiraIssue[]> {
  try {
    // Call our Next.js API route to fetch backlog bugs
    const url = `/api/jira/backlog-bugs?release=${release}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const issues: JiraIssue[] = await response.json();
    return issues;
  } catch (error) {
    console.error('Error fetching backlog bugs:', error);
    // Fall back to empty array if API fails
    console.log('Falling back to empty data due to API error');
    return [];
  }
}

export async function fetchBacklogTrendData(): Promise<Record<string, JiraIssue[]>> {
  try {
    // Call our Next.js API route to fetch backlog trend data
    const url = `/api/jira/backlog-trend`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const trendData: Record<string, JiraIssue[]> = await response.json();
    return trendData;
  } catch (error) {
    console.error('Error fetching backlog trend data:', error);
    // Fall back to empty object if API fails
    console.log('Falling back to empty data due to API error');
    return {};
  }
}

export function calculateBugMetrics(bugs: JiraIssue[]): BugMetrics {
  const total = bugs.length;
  const triaged = bugs.filter(bug => bug.customFields?.triageStatus === 'Triaged').length;
  const resolved = bugs.filter(bug => bug.status.category === 'Done').length;
  
  const priorityCounts = bugs.reduce((acc, bug) => {
    const priority = bug.priority.name.toLowerCase();
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgTriageTime = bugs
    .filter(bug => bug.customFields?.triageDate)
    .reduce((sum, bug) => {
      const created = new Date(bug.created);
      const triaged = new Date(bug.customFields!.triageDate!);
      return sum + (triaged.getTime() - created.getTime());
    }, 0) / Math.max(triaged, 1);

  const avgResolutionTime = bugs
    .filter(bug => bug.resolved)
    .reduce((sum, bug) => {
      const created = new Date(bug.created);
      const resolved = new Date(bug.resolved!);
      return sum + (resolved.getTime() - created.getTime());
    }, 0) / Math.max(resolved, 1);

  // Calculate portfolio and team distributions
  const byPortfolio = bugs.reduce((acc, bug) => {
    const portfolio = bug.portfolio || 'Unknown';
    acc[portfolio] = (acc[portfolio] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byTeam = bugs.reduce((acc, bug) => {
    const team = bug.team || 'Unknown';
    acc[team] = (acc[team] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    triaged,
    resolved,
    critical: priorityCounts.critical || 0,
    high: priorityCounts.high || 0,
    medium: priorityCounts.medium || 0,
    low: priorityCounts.low || 0,
    avgTriageTime: avgTriageTime / (1000 * 60 * 60), // Convert to hours
    avgResolutionTime: avgResolutionTime / (1000 * 60 * 60 * 24), // Convert to days
    byPortfolio,
    byTeam,
  };
}