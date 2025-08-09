import { NextRequest, NextResponse } from 'next/server';
import { extractTeamFromJiraIssue, getPortfolioForTeam } from '@/lib/teamMapping';
import { extractPortfolioFromPerson } from '@/lib/managerMapping';
import { getBacklogPortfolio } from '@/lib/backlogPortfolioMapping';

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
    
    const { searchParams: urlParams } = new URL(request.url);
    const release = urlParams.get('release') || 'all';
    
    // Backlog-specific JQL queries (bugs that were in backlog at release cutoff dates)
    const backlogQueries = {
      'all': 'issuetype = Bug AND Status NOT IN ("Pending Release", Released, Resolved, CLOSED, Done, Cancelled) and Project in ("IO", "PRE", "DEVOPS") ORDER BY priority DESC, created ASC',
      'april': 'createdDate <= 2025-4-8 AND issuetype = Bug AND Status WAS NOT IN ("Pending Release", Released, Resolved, CLOSED, Done, Cancelled) BEFORE 2025-04-9 and Project in ("IO", "PRE", "DEVOPS") ORDER BY priority DESC, created ASC',
      'may': 'createdDate <= 2025-5-21 AND issuetype = Bug AND Status WAS NOT IN ("Pending Release", Released, Resolved, CLOSED, Done, Cancelled) BEFORE 2025-05-22 and Project in ("IO", "PRE", "DEVOPS") ORDER BY priority DESC, created ASC',
      'july': 'createdDate <= 2025-7-1 AND issuetype = Bug AND Status WAS NOT IN ("Pending Release", Released, Resolved, CLOSED, Done, Cancelled) BEFORE 2025-07-2 and Project in ("IO", "PRE", "DEVOPS") ORDER BY priority DESC, created ASC',
      'august': 'createdDate <= 2025-8-12 AND issuetype = Bug AND Status WAS NOT IN ("Pending Release", Released, Resolved, CLOSED, Done, Cancelled) BEFORE 2025-08-13 and Project in ("IO", "PRE", "DEVOPS") ORDER BY priority DESC, created ASC'
    };
    
    const jql = backlogQueries[release as keyof typeof backlogQueries] || backlogQueries.april;
    
    const maxResults = 100;
    const maxPages = release === 'all' ? 30 : 15; // Increased limit for 'all' releases
    let allIssues: any[] = [];
    let startAt = 0;
    
    for (let page = 0; page < maxPages; page++) {
      const searchParams = new URLSearchParams({
        jql,
        fields: 'id,key,summary,status,priority,assignee,reporter,created,updated,resolved,labels,components,fixVersions,customfield_12000,customfield_15072,project',
        maxResults: maxResults.toString(),
        startAt: startAt.toString()
      });
      
      const url = `${JIRA_BASE_URL}/rest/api/3/search?${searchParams.toString()}`;
      
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
        break;
      }
      
      startAt += maxResults;
    }
    
    const consolidatedData = {
      issues: allIssues,
      total: allIssues.length
    };
    
    // Transform the data to match our interface
    const transformedIssues = consolidatedData.issues.map((issue: any) => {
      const teamName = extractTeamFromJiraIssue(issue);
      
      // Create a simplified issue object for backlog portfolio mapping
      const issueForMapping = {
        managerGroup: issue.fields.customfield_15072?.name || null,
        team: teamName,
        assignee: issue.fields.assignee,
        project: issue.fields.project
      };
      
      // Use the new backlog portfolio mapping logic
      const portfolio = getBacklogPortfolio(issueForMapping);
      
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
          backlogAge: Math.floor((new Date().getTime() - new Date(issue.fields.created).getTime()) / (1000 * 60 * 60 * 24)), // Days in backlog
          backlogStatus: 'Active', // All issues from backlog query are active
          backlogPriority: issue.fields.priority?.name || 'None'
        },
        team: teamName,
        portfolio: portfolio,
        managerGroup: issue.fields.customfield_15072?.name || null
      };
    });

    return NextResponse.json(transformedIssues);
  } catch (error) {
    console.error('Error fetching Jira backlog bugs:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    const mockData: any[] = [];
    return NextResponse.json(mockData);
  }
}