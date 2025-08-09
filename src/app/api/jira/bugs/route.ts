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
      'Fayaz_Reportees': 'Fayaz',
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
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || '';

export async function GET(request: NextRequest) {
  try {
    const authHeader = Buffer.from(`${JIRA_USERNAME}:${JIRA_API_TOKEN}`).toString('base64');
    
    // Get release parameter from URL
    const { searchParams: urlParams } = new URL(request.url);
    const release = urlParams.get('release') || 'april';
    
    // Define release-specific JQL queries
    const releaseQueries = {
      'april': 'project in ("IO", "PRE", "DEVOPS") AND created >= 2025-02-26 AND created <= 2025-04-08 AND issuetype = Bug ORDER BY created DESC',
      'may': 'project in ("IO", "PRE", "DEVOPS") AND created >= 2025-04-08 AND created <= 2025-05-21 AND issuetype = Bug ORDER BY created DESC',
      'july': 'project in ("IO", "PRE", "DEVOPS") AND created >= 2025-05-21 AND created <= 2025-07-01 AND issuetype = Bug ORDER BY created DESC',
      'august': 'project in ("IO", "PRE", "DEVOPS") AND created >= 2025-07-02 AND created <= 2025-08-12 AND issuetype = Bug ORDER BY created DESC'
    };
    
    const jql = releaseQueries[release as keyof typeof releaseQueries] || releaseQueries.april;
    
    // Fetch multiple pages to get more results (Jira API limit is 100 per request)
    const maxResults = 100; // Jira API limit
    const maxPages = 10; // Get up to 1000 results (10 pages × 100 per page)
    let allIssues: any[] = [];
    let startAt = 0;
    
    console.log('Selected release:', release);
    console.log('JQL Query:', jql);
    
    for (let page = 0; page < maxPages; page++) {
      const searchParams = new URLSearchParams({
        jql,
        fields: 'id,key,summary,status,priority,assignee,reporter,created,updated,resolved,labels,components,fixVersions,customfield_12000,customfield_15072',
        maxResults: maxResults.toString(),
        startAt: startAt.toString()
      });
      
      const url = `${JIRA_BASE_URL}/rest/api/3/search?${searchParams.toString()}`;
      console.log(`Fetching page ${page + 1}/${maxPages} (startAt: ${startAt})`);
      
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
      
      // Add issues from this page to our collection
      allIssues.push(...data.issues);
      
      // If we got fewer results than maxResults, we've reached the end
      if (data.issues.length < maxResults) {
        console.log(`Reached end of results on page ${page + 1}. Total issues: ${allIssues.length}`);
        break;
      }
      
      // Update startAt for next page
      startAt += maxResults;
    }
    
    console.log(`Total issues fetched: ${allIssues.length}`);
    
    // Create a consolidated response object
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
          triageStatus: issue.fields.status.name.toLowerCase().includes('triaged') ? 'Triaged' : 'Pending',
          triagePriority: issue.fields.priority?.name || 'None'
        },
        team: teamName,
        portfolio: portfolio,
        managerGroup: issue.fields.customfield_15072?.name || null
      };
    });

    return NextResponse.json(transformedIssues);
  } catch (error) {
    console.error('Error fetching Jira bugs:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    
    // Return mock data if API fails
    const mockData = [
      {
        id: '1',
        key: 'CELIGO-001',
        summary: 'Critical authentication bug causing login failures',
        status: { name: 'Triaged', category: 'In Progress' },
        priority: { name: 'Critical', iconUrl: '' },
        assignee: {
          displayName: 'John Doe',
          emailAddress: 'john.doe@celigo.com',
          avatarUrls: { '48x48': '' }
        },
        reporter: { displayName: 'Jane Smith', emailAddress: 'jane.smith@celigo.com' },
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
      }
    ];
    
    return NextResponse.json(mockData);
  }
}