import teamPortfolioMapping from '../../team_portfolio_mapping_from_excel.json';

export interface TeamPortfolioMapping {
  [teamName: string]: string[];
}

// Load the team-portfolio mapping
const mapping: TeamPortfolioMapping = teamPortfolioMapping;

/**
 * Get portfolio for a given team name
 */
export function getPortfolioForTeam(teamName: string): string | undefined {
  if (!teamName) return undefined;
  
  // Direct lookup
  if (mapping[teamName]) {
    return mapping[teamName][0]; // Most teams belong to one portfolio
  }
  
  // Fuzzy matching for partial team names
  const normalizedTeamName = teamName.toLowerCase().trim();
  
  for (const [mappedTeam, portfolios] of Object.entries(mapping)) {
    const normalizedMappedTeam = mappedTeam.toLowerCase();
    
    // Check if the team name contains the mapped team name or vice versa
    if (normalizedTeamName.includes(normalizedMappedTeam) || 
        normalizedMappedTeam.includes(normalizedTeamName)) {
      return portfolios[0];
    }
  }
  
  return undefined;
}

/**
 * Get all teams for a given portfolio
 */
export function getTeamsForPortfolio(portfolioName: string): string[] {
  const teams: string[] = [];
  
  for (const [teamName, portfolios] of Object.entries(mapping)) {
    if (portfolios.includes(portfolioName)) {
      teams.push(teamName);
    }
  }
  
  return teams;
}

/**
 * Get all unique portfolios
 */
export function getAllPortfolios(): string[] {
  const portfolios = new Set<string>();
  
  for (const portfolioList of Object.values(mapping)) {
    portfolioList.forEach(portfolio => portfolios.add(portfolio));
  }
  
  return Array.from(portfolios).sort();
}

/**
 * Get all team names
 */
export function getAllTeams(): string[] {
  return Object.keys(mapping).sort();
}

// Component to team mapping removed - only using customfield_12000 now

/**
 * Extract team name only from customfield_12000 (cf[12000])
 */
export function extractTeamFromJiraIssue(issue: any): string | undefined {
  // Only check the specific team field customfield_12000
  const teamField = issue.fields?.customfield_12000;
  if (teamField) {
    // Handle different possible formats of the custom field
    const teamValue = typeof teamField === 'string' ? teamField : 
                     teamField?.value || teamField?.displayName || teamField?.name;
    
    if (teamValue && typeof teamValue === 'string') {
      // Try direct mapping first
      const portfolio = getPortfolioForTeam(teamValue);
      if (portfolio) {
        return teamValue;
      }
      
      // Try fuzzy matching if direct mapping fails
      for (const [teamName] of Object.entries(mapping)) {
        if (teamValue.toLowerCase().includes(teamName.toLowerCase()) ||
            teamName.toLowerCase().includes(teamValue.toLowerCase())) {
          return teamName;
        }
      }
      
      // Return the raw team value even if no portfolio mapping found
      return teamValue;
    }
  }

  // No team field found - return undefined (no fallbacks)
  return undefined;
}