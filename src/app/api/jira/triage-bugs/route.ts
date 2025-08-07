import { NextRequest, NextResponse } from 'next/server';
import { extractTeamFromJiraIssue, getPortfolioForTeam } from '@/lib/teamMapping';
import { extractPortfolioFromPerson } from '@/lib/managerMapping';

// Manager Group to Portfolio mapping from CSV and additional mappings
const managerGroupToPortfolio: Record<string, string> = {
  'Ajit_Reportees': 'AI/ML',
  'Ankur_Reportees': 'CORE',
  'Anusha_Reportees': 'CORE',
  'Ashok_Reportees': 'UI',
  'Chandra_Reportees': 'UI',
  'Diksha_Reportees': 'IA',
  'Fayaz_Reportees': 'QA',
  'Gurramkonda_Reportees': 'CORE',
  'Hemant_Reportees': 'Platform',
  'Jegadeesh_Reportees': 'CORE',
  'Jharupula_Reportees': 'Platform',
  'Komal_Reportees': 'UI',
  'Krishna_Reportees': 'AI/ML',
  'Lincu_Reportees': 'Platform',
  'Mujtaba_Reportees': 'Platform',
  'Prasad_Reportees': 'QA',
  'Priya_Reportees': 'Platform',
  'Rajesh_Reportees': 'UI',
  'Ramakrishna_Reportees': 'CORE',
  'Raman_Reportees': 'Platform',
  'Ranjith_Reportees': 'Platform',
  'Sathishkumar_Reportees': 'CORE',
  'Selvakumar_Reportees': 'UI',
  'Subhan_Reportees': 'CORE',
  'Swat_Reportees': 'IA',
  'Tharuni_Reportees': 'Platform',
  'Varun_Reportees': 'CORE'
};

function getPortfolioFromManagerGroup(managerGroup: string): string | undefined {
  return managerGroupToPortfolio[managerGroup];
}

const JIRA_BASE_URL = 'https://celigo.atlassian.net';
const JIRA_USERNAME = 'rajendran.joseph.jawahar@celigo.com';
const JIRA_API_TOKEN = process.env.NEXT_PUBLIC_JIRA_API_TOKEN || '';

export async function GET(request: NextRequest) {
  try {
    const authHeader = Buffer.from(`${JIRA_USERNAME}:${JIRA_API_TOKEN}`).toString('base64');
    
    const { searchParams: urlParams } = new URL(request.url);
    const release = urlParams.get('release') || 'april';
    
    // Triage-specific JQL queries (bugs that were unresolved at the end of each release period)
    const triageQueries = {
      'april': 'project in ("integrator.io", PRE, devops) AND created >= 2025-02-26 AND created <= 2025-04-08 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-04-08 ORDER BY created DESC',
      'may': 'project in ("integrator.io", PRE, devops) AND created >= 2025-04-08 AND created <= 2025-05-21 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-05-21 ORDER BY created DESC',
      'july': 'project in ("integrator.io", PRE, devops) AND created >= 2025-05-21 AND created <= 2025-07-01 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-07-01 ORDER BY created DESC',
      'august': 'project in ("integrator.io", PRE, devops) AND created >= 2025-07-02 AND created <= 2025-08-12 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-08-12 ORDER BY created DESC'
    };
    
    const jql = triageQueries[release as keyof typeof triageQueries] || triageQueries.april;
    
    const maxResults = 100;
    const maxPages = 10;
    let allIssues: any[] = [];
    let startAt = 0;
    
    console.log('Selected triage release:', release);
    console.log('Triage JQL Query:', jql);
    
    for (let page = 0; page < maxPages; page++) {
      const searchParams = new URLSearchParams({
        jql,
        fields: 'id,key,summary,status,priority,assignee,reporter,created,updated,resolved,labels,components,fixVersions,customfield_12000,customfield_15072,project',
        maxResults: maxResults.toString(),
        startAt: startAt.toString()
      });
      
      const url = `${JIRA_BASE_URL}/rest/api/3/search?${searchParams.toString()}`;
      console.log(`Fetching triage page ${page + 1}/${maxPages} (startAt: ${startAt})`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Jira API Error - Status: ${response.status}, Response: ${errorText}`);
        throw new Error(`Jira API responded with status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      allIssues = allIssues.concat(data.issues);
      
      if (data.issues.length < maxResults) {
        console.log(`Reached end of triage results on page ${page + 1}. Total issues: ${allIssues.length}`);
        break;
      }
      
      startAt += maxResults;
    }
    
    console.log(`Total triage issues fetched: ${allIssues.length}`);
    
    const consolidatedData = {
      issues: allIssues,
      total: allIssues.length
    };
    
    // Transform the data to match our interface
    const transformedIssues = consolidatedData.issues.map((issue: any) => {
      // Check for DevOps project first - highest priority
      let portfolio: string | undefined = undefined;
      if (issue.fields?.project?.key === 'devops' || issue.key.startsWith('DEVOPS-')) {
        portfolio = 'DevOps';
      } else {
        // Extract team name from the issue
        const teamName = extractTeamFromJiraIssue(issue);
        portfolio = teamName ? getPortfolioForTeam(teamName) : undefined;
        
        // If no portfolio found through team mapping or team is unknown, try manager mapping
        if (!portfolio || !teamName || teamName === 'Unknown') {
          const managerMapping = extractPortfolioFromPerson(issue);
          portfolio = managerMapping.portfolio;
        }
        
        // If still no portfolio found and we have a manager group, use manager group mapping
        const managerGroupName = issue.fields.customfield_15072?.name;
        if (!portfolio && managerGroupName) {
          portfolio = getPortfolioFromManagerGroup(managerGroupName);
        }
      }
      
      const teamName = extractTeamFromJiraIssue(issue);
      
      return {
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: {
          name: issue.fields.status.name,
          category: issue.fields.status.statusCategory.name
        },
        priority: {
          name: issue.fields.priority?.name || 'None',
          iconUrl: issue.fields.priority?.iconUrl || ''
        },
        assignee: issue.fields.assignee ? {
          displayName: issue.fields.assignee.displayName,
          emailAddress: issue.fields.assignee.emailAddress,
          avatarUrls: issue.fields.assignee.avatarUrls
        } : null,
        reporter: {
          displayName: issue.fields.reporter.displayName,
          emailAddress: issue.fields.reporter.emailAddress
        },
        created: issue.fields.created,
        updated: issue.fields.updated,
        resolved: issue.fields.resolved,
        labels: issue.fields.labels || [],
        components: issue.fields.components || [],
        fixVersions: issue.fields.fixVersions || [],
        customFields: {
          triageDate: issue.fields.created,
          triageStatus: 'Triaged', // All issues from triage query were triaged at release end
          triagePriority: issue.fields.priority?.name || 'None'
        },
        team: teamName,
        portfolio: portfolio,
        managerGroup: issue.fields.customfield_15072?.name || null
      };
    });

    return NextResponse.json(transformedIssues);
  } catch (error) {
    console.error('Error fetching Jira triage bugs:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    const mockData = [];
    return NextResponse.json(mockData);
  }
}