export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: {
    name: string;
    category: string;
  };
  priority: {
    name: string;
    iconUrl: string;
  };
  assignee: {
    displayName: string;
    emailAddress: string;
    avatarUrls: {
      '48x48': string;
    };
  } | null;
  reporter: {
    displayName: string;
    emailAddress: string;
  };
  created: string;
  updated: string;
  resolved: string | null;
  labels: string[];
  components: Array<{
    name: string;
  }>;
  fixVersions: Array<{
    name: string;
    releaseDate?: string;
  }>;
  customFields?: {
    triageDate?: string;
    triageStatus?: string;
    triagePriority?: string;
  };
  team?: string;
  portfolio?: string;
  managerGroup?: string;
}

export interface BugMetrics {
  total: number;
  triaged: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  avgTriageTime: number;
  avgResolutionTime: number;
  byPortfolio: Record<string, number>;
  byTeam: Record<string, number>;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  triaged: number;
  resolved: number;
}

export interface ComponentMetrics {
  component: string;
  total: number;
  triaged: number;
  resolved: number;
  percentage: number;
}