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
    
    // Backlog trend queries for each release period (same as triage bugs API)
    const backlogTrendQueries = {
      'beforeApril': 'project in ("integrator.io", PRE, devops) and created <= 2025-02-25 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-02-26 ORDER BY created DESC',
      'april': 'project in ("integrator.io", PRE, devops) AND created >= 2025-02-26 AND created <= 2025-04-08 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-04-09 ORDER BY created DESC',
      'aprilResolved': 'project in ("integrator.io", PRE, devops) and created <= 2025-02-26 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-02-26 and status CHANGED to (Closed, Released, "Pending Release", Cancelled, Done) during (2025-02-26, 2025-04-08) ORDER BY created DESC',
      'beforeMay': 'project in ("integrator.io", PRE, devops) and created <= 2025-04-08 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-04-09 ORDER BY created DESC',
      'may': 'project in ("integrator.io", PRE, devops) AND created >= 2025-04-09 AND created <= 2025-05-20 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-05-21 ORDER BY created DESC',
      'mayResolved': 'project in ("integrator.io", PRE, devops) and created <= 2025-04-08 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-04-09 and status CHANGED to (Closed, Released, "Pending Release", Cancelled, Done) during (2025-04-09,2025-05-20) ORDER BY created DESC',
      'beforeJuly': 'project in ("integrator.io", PRE, devops) and created <= 2025-05-20 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-05-21 ORDER BY created DESC',
      'july': 'project in ("integrator.io", PRE, devops) AND created >= 2025-05-21 AND created <= 2025-07-01 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-07-02 ORDER BY created DESC',
      'julyResolved': 'project in ("integrator.io", PRE, devops) and created <= 2025-05-20 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-05-21 and status CHANGED to (Closed, Released, "Pending Release", Cancelled, Done) during (2025-05-21,2025-07-01) ORDER BY created DESC',
      'beforeAugust': 'project in ("integrator.io", PRE, devops) and created <= 2025-07-01 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-07-02 ORDER BY created DESC',
      'august': 'project in ("integrator.io", PRE, devops) AND created >= 2025-07-02 AND created <= 2025-08-12 AND issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-08-12 ORDER BY created DESC',
      'augustResolved': 'project in ("integrator.io", PRE, devops) and created <= 2025-07-01 and issuetype = Bug and status was not in (Closed, Released, "Pending Release", Cancelled, Done) on 2025-07-02 and status CHANGED to (Closed, Released, "Pending Release", Cancelled, Done) during (2025-07-02,2025-08-12) ORDER BY created DESC'
    };

    const maxResults = 100;
    const maxPages = 10;
    
    // Fetch data for all releases
    const trendData: Record<string, any[]> = {};
    
    for (const [release, jql] of Object.entries(backlogTrendQueries)) {
      console.log(`Fetching backlog trend data for ${release} release`);
      console.log(`JQL Query: ${jql}`);
      
      let allIssues: any[] = [];
      let startAt = 0;
      
      for (let page = 0; page < maxPages; page++) {
        const searchParams = new URLSearchParams({
          jql: jql,
          maxResults: maxResults.toString(),
          startAt: startAt.toString(),
          fields: 'id,key,summary,status,priority,assignee,reporter,created,updated,resolved,labels,components,fixVersions,customfield_12000,customfield_15072,project'
        });

        console.log(`Fetching ${release} page ${page + 1}/${maxPages} (startAt: ${startAt})`);

        const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/search?${searchParams}`, {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`JIRA API error for ${release}:`, response.status, response.statusText);
          continue;
        }

        const data = await response.json();
        allIssues = allIssues.concat(data.issues);
        
        console.log(`Page ${page + 1} returned ${data.issues.length} issues for ${release}`);
        
        // Check if we've reached the end
        if (data.issues.length < maxResults || startAt + data.issues.length >= data.total) {
          console.log(`Reached end of ${release} results on page ${page + 1}. Total issues: ${allIssues.length}`);
          break;
        }
        
        startAt += maxResults;
      }
      
      // Transform the data for this release
      const transformedIssues = allIssues.map((issue: any) => {
        // Check for DevOps project first - highest priority (exact copy from triage bugs API)
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
            avatarUrls: issue.fields.assignee.avatarUrls,
            accountId: issue.fields.assignee.accountId
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
          team: teamName,
          portfolio: portfolio,
          managerGroup: issue.fields.customfield_15072?.name || null
        };
      });
      
      trendData[release] = transformedIssues;
      console.log(`Total backlog trend issues for ${release}: ${transformedIssues.length}`);
    }

    return NextResponse.json(trendData);
  } catch (error) {
    console.error('Error fetching Jira backlog trend data:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({});
  }
}