// Backlog-specific portfolio mapping logic
// This is separate from the triage analysis mapping

/**
 * Get portfolio for backlog analysis using specific business logic
 */
export function getBacklogPortfolio(issue: any): string {
  const managerGroup = issue.managerGroup;
  const team = issue.team;
  const assignee = issue.assignee?.accountId;
  const project = issue.project?.key;

  // "Jegadeesh Core" = ("Manager's Group" in (Ramakrishna_Reportees, Subhan_Reportees, Ankur_Reportees, Anusha_Reportees, Jegadeesh_Reportees) OR Team = ec347d75-9818-4241-a555-1780ca88e974) AND "Manager's Group" != Mujtaba_Reportees
  if (managerGroup !== 'Mujtaba_Reportees' && 
      (managerGroup && ['Ramakrishna_Reportees', 'Subhan_Reportees', 'Ankur_Reportees', 'Anusha_Reportees', 'Jegadeesh_Reportees'].includes(managerGroup) ||
       team === 'ec347d75-9818-4241-a555-1780ca88e974')) {
    return 'Jegadeesh Core';
  }

  // "Jegadeesh UI" = "Manager's Group" in (Selvakumar_Reportees, Chandra_Reportees, Ashok_Reportees, Rajesh_Reportees)
  if (managerGroup && ['Selvakumar_Reportees', 'Chandra_Reportees', 'Ashok_Reportees', 'Rajesh_Reportees'].includes(managerGroup)) {
    return 'Jegadeesh UI';
  }

  // "Mujtaba" = ("Manager's Group" in (Priya_Reportees, Raman_Reportees, Ranjith_Reportees, Mujtaba_Reportees, "Anurag_Reportees", Hemant_Reportees) OR assignee in (557058:2e83fd32-af90-4830-855a-77cd3bdb2fe9))
  if ((managerGroup && ['Priya_Reportees', 'Raman_Reportees', 'Ranjith_Reportees', 'Mujtaba_Reportees', 'Anurag_Reportees', 'Hemant_Reportees'].includes(managerGroup)) ||
      (assignee && ['557058:2e83fd32-af90-4830-855a-77cd3bdb2fe9'].includes(assignee))) {
    return 'Mujtaba';
  }

  // "Diksha" = ("Manager's Group" in (Diksha_Reportees, Swat_Reportees) OR Assignee in (557058:ccae41cc-114e-4623-99f2-4c2bbc6568ec, 557058:3d99cbf4-86d8-4c84-b1d3-7dd9f801d39d, 5dad4ba0fb31ca0c35c00866))
  if ((managerGroup && ['Diksha_Reportees', 'Swat_Reportees'].includes(managerGroup)) ||
      (assignee && ['557058:ccae41cc-114e-4623-99f2-4c2bbc6568ec', '557058:3d99cbf4-86d8-4c84-b1d3-7dd9f801d39d', '5dad4ba0fb31ca0c35c00866'].includes(assignee))) {
    return 'Diksha';
  }

  // "KK AI/ML" = "Manager's Group" in (Krishna_Reportees, Ajit_Reportees)
  if (managerGroup && ['Krishna_Reportees', 'Ajit_Reportees'].includes(managerGroup)) {
    return 'KK AI/ML';
  }

  // "KK DevOps" = ("Manager's Group" in (Lincu_Reportees) OR Project = DevOps OR Assignee = 557058:e8cbfef4-ca75-4979-a160-f2c1f33b3109)
  if ((managerGroup && ['Lincu_Reportees'].includes(managerGroup)) ||
      (project === 'DevOps') ||
      (assignee === '557058:e8cbfef4-ca75-4979-a160-f2c1f33b3109')) {
    return 'KK DevOps';
  }

  // "Fayaz" = "Manager's Group" in (Tharuni_Reportees, Varun_Reportees, Prasad_Reportees, Jharupula_Reportees, Komal_Reportees, Sathishkumar_Reportees, Fayaz_Reportees)
  if (managerGroup && ['Tharuni_Reportees', 'Varun_Reportees', 'Prasad_Reportees', 'Jharupula_Reportees', 'Komal_Reportees', 'Sathishkumar_Reportees', 'Fayaz_Reportees'].includes(managerGroup)) {
    return 'Fayaz';
  }

  // "Non Engineering" = AND "Manager's Group" is EMPTY OR any unmatched cases
  if (!managerGroup) {
    return 'Non Engineering';
  }

  // Default fallback - combine Unknown with Non Engineering
  return 'Non Engineering';
}

/**
 * Get all backlog portfolios in the preferred order
 */
export function getAllBacklogPortfolios(): string[] {
  return [
    'Jegadeesh Core',
    'Jegadeesh UI', 
    'Mujtaba',
    'Diksha',
    'KK AI/ML',
    'KK DevOps',
    'Fayaz',
    'Non Engineering'
  ];
}