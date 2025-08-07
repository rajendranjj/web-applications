'use client';

import { ChevronDown } from 'lucide-react';

interface ReleaseFilterProps {
  selectedRelease: string;
  onReleaseChange: (release: string) => void;
}

const releases = [
  { 
    value: 'april', 
    label: 'April Release', 
    description: '2025-02-26 to 2025-04-08',
    jql: 'project in ("integrator.io", PRE, devops) AND created >= 2025-02-26 AND created <= 2025-04-08 AND issuetype = Bug ORDER BY created DESC'
  },
  { 
    value: 'may', 
    label: 'May Release', 
    description: '2025-04-08 to 2025-05-21',
    jql: 'project in ("integrator.io", PRE, devops) AND created >= 2025-04-08 AND created <= 2025-05-21 AND issuetype = Bug ORDER BY created DESC'
  },
  { 
    value: 'july', 
    label: 'July Release', 
    description: '2025-05-21 to 2025-07-01',
    jql: 'project in ("integrator.io", PRE, devops) AND created >= 2025-05-21 AND created <= 2025-07-01 AND issuetype = Bug ORDER BY created DESC'
  },
  { 
    value: 'august', 
    label: 'August Release', 
    description: '2025-07-02 to 2025-08-12',
    jql: 'project in ("integrator.io", PRE, devops) AND created >= 2025-07-02 AND created <= 2025-08-12 AND issuetype = Bug ORDER BY created DESC'
  },
];

export default function ReleaseFilter({ selectedRelease, onReleaseChange }: ReleaseFilterProps) {
  return (
    <div className="mb-6">
      <label htmlFor="release-select" className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Release
      </label>
      <div className="relative">
        <select
          id="release-select"
          value={selectedRelease}
          onChange={(e) => onReleaseChange(e.target.value)}
          className="appearance-none block w-full max-w-sm px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
        >
          {releases.map((release) => (
            <option key={release.value} value={release.value}>
              {release.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {/* Release description */}
      <div className="mt-2 text-xs text-gray-500">
        {releases.find(r => r.value === selectedRelease)?.description}
      </div>
      
      {/* JQL Query */}
      <div className="mt-3">
        <div className="text-xs font-medium text-gray-700 mb-1">JQL Query:</div>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-xs font-mono text-gray-800 break-all">
          {releases.find(r => r.value === selectedRelease)?.jql}
        </div>
      </div>
    </div>
  );
}