import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    hasJiraToken: !!process.env.JIRA_API_TOKEN,
    hasJiraEmail: !!process.env.JIRA_EMAIL,
    tokenLength: process.env.JIRA_API_TOKEN?.length || 0,
    tokenPreview: process.env.JIRA_API_TOKEN?.substring(0, 10) + '...',
    domain: process.env.JIRA_DOMAIN
  });
}