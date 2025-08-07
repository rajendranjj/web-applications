'use client';

import { ChevronDown } from 'lucide-react';

interface BacklogReleaseFilterProps {
  selectedRelease: string;
  onReleaseChange: (release: string) => void;
}

const backlogReleases = [
  { 
    value: 'all', 
    label: 'Current Backlog', 
    description: 'All bugs currently in backlog (not resolved/closed)',
    jql: 'issuetype = Bug AND Status NOT IN ("Pending Release", Released, Resolved, CLOSED, Done, Cancelled) and Project in ("integrator.io", Connectors, Prebuilt, Devops) ORDER BY priority DESC, created ASC'
  },
  // Temporarily hidden - other releases can be re-enabled when needed
  // { 
  //   value: 'april', 
  //   label: 'April Release', 
  //   description: 'Bugs in backlog as of 2025-04-08',
  //   jql: 'createdDate <= 2025-4-8 AND issuetype = Bug AND Status WAS NOT IN ("Pending Release", Released, Resolved, CLOSED, Done, Cancelled) BEFORE 2025-04-9 and Project in ("integrator.io", Connectors, Prebuilt, Devops) ORDER BY priority DESC, created ASC'
  // },
  // { 
  //   value: 'may', 
  //   label: 'May Release', 
  //   description: 'Bugs in backlog as of 2025-05-21',
  //   jql: 'createdDate <= 2025-5-21 AND issuetype = Bug AND Status WAS NOT IN ("Pending Release", Released, Resolved, CLOSED, Done, Cancelled) BEFORE 2025-05-22 and Project in ("integrator.io", Connectors, Prebuilt, Devops) ORDER BY priority DESC, created ASC'
  // },
  // { 
  //   value: 'july', 
  //   label: 'July Release', 
  //   description: 'Bugs in backlog as of 2025-07-01',
  //   jql: 'createdDate <= 2025-7-1 AND issuetype = Bug AND Status WAS NOT IN ("Pending Release", Released, Resolved, CLOSED, Done, Cancelled) BEFORE 2025-07-2 and Project in ("integrator.io", Connectors, Prebuilt, Devops) ORDER BY priority DESC, created ASC'
  // },
  // { 
  //   value: 'august', 
  //   label: 'August Release', 
  //   description: 'Bugs in backlog as of 2025-08-12',
  //   jql: 'createdDate <= 2025-8-12 AND issuetype = Bug AND Status WAS NOT IN ("Pending Release", Released, Resolved, CLOSED, Done, Cancelled) BEFORE 2025-08-13 and Project in ("integrator.io", Connectors, Prebuilt, Devops) ORDER BY priority DESC, created ASC'
  // },
];

export default function BacklogReleaseFilter({ selectedRelease, onReleaseChange }: BacklogReleaseFilterProps) {
  // Hidden the filter dropdown - only showing JQL query for transparency
  return (
    <div className="mb-6">
      {/* Backlog JQL Query */}
      <div className="mt-3">
        <div className="text-xs font-medium text-gray-700 mb-1">Current Backlog Query:</div>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-xs font-mono text-gray-800 break-all">
          {backlogReleases.find(r => r.value === selectedRelease)?.jql}
        </div>
      </div>
    </div>
  );
}