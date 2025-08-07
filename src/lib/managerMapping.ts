// Manager to Portfolio mapping from Unique_Manager_s_Groups.csv
const managerPortfolioMapping: Record<string, string> = {
  'Ajit_Reportees': 'AI/ML',
  'Ankur_Reportees': 'CORE',
  'Anusha_Reportees': 'CORE',
  'Chandra_Reportees': 'UI',
  'Diksha_Reportees': 'IA',
  'Fayaz_Reportees': 'QA',
  'Hemant_Reportees': 'Platform',
  'Jegadeesh_Reportees': 'CORE',
  'Jharupula_Reportees': 'Platform',
  'Komal_Reportees': 'UI',
  'Mujtaba_Reportees': 'Platform',
  'Prasad_Reportees': 'QA',
  'Priya_Reportees': 'Platform',
  'Rajesh_Reportees': 'UI',
  'Ramakrishna_Reportees': 'CORE',
  'Raman_Reportees': 'Platform',
  'Ranjith_Reportees': 'Platform',
  'Selvakumar_Reportees': 'UI',
  'Subhan_Reportees': 'CORE',
  'Swat_Reportees': 'IA',
  'Tharuni_Reportees': 'Platform',
  'Varun_Reportees': 'CORE'
};

/**
 * Extract manager name from a person's full name
 */
function extractManagerFromName(fullName: string): string | undefined {
  if (!fullName) return undefined;
  
  // Split by spaces and take the first name
  const firstName = fullName.split(' ')[0].toLowerCase();
  
  // Check if any manager name is contained in the person's name
  for (const managerKey of Object.keys(managerPortfolioMapping)) {
    const managerFirstName = managerKey.replace('_Reportees', '').toLowerCase();
    
    // Direct match with first name
    if (firstName === managerFirstName) {
      return managerKey;
    }
    
    // Partial match - check if manager name is contained in the full name
    if (fullName.toLowerCase().includes(managerFirstName)) {
      return managerKey;
    }
  }
  
  return undefined;
}

/**
 * Get portfolio from manager group
 */
export function getPortfolioFromManager(managerGroup: string): string | undefined {
  return managerPortfolioMapping[managerGroup];
}

/**
 * Extract portfolio from assignee or reporter using manager mapping
 */
export function extractPortfolioFromPerson(issue: any): { portfolio?: string; managerGroup?: string } {
  // Check assignee first
  const assigneeName = issue.fields?.assignee?.displayName;
  if (assigneeName) {
    const managerGroup = extractManagerFromName(assigneeName);
    if (managerGroup) {
      const portfolio = getPortfolioFromManager(managerGroup);
      if (portfolio) {
        return { portfolio, managerGroup };
      }
    }
  }
  
  // Then check reporter
  const reporterName = issue.fields?.reporter?.displayName;
  if (reporterName) {
    const managerGroup = extractManagerFromName(reporterName);
    if (managerGroup) {
      const portfolio = getPortfolioFromManager(managerGroup);
      if (portfolio) {
        return { portfolio, managerGroup };
      }
    }
  }
  
  return {};
}

/**
 * Get all unique portfolios from manager mapping
 */
export function getAllPortfoliosFromManagers(): string[] {
  return Array.from(new Set(Object.values(managerPortfolioMapping))).sort();
}

/**
 * Get all manager groups
 */
export function getAllManagerGroups(): string[] {
  return Object.keys(managerPortfolioMapping).sort();
}