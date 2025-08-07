'use client';

import { useState } from 'react';
import { JiraIssue } from '@/types/jira';

interface BacklogPieChartProps {
  bugs: JiraIssue[];
  selectedSegment?: string;
  selectedPortfolio?: string;
  onSegmentClick: (segment: string) => void;
  onPortfolioClick?: (portfolio: string) => void;
  onClearClick?: () => void;
}

interface PieSegment {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export default function BacklogPieChart({ bugs, selectedSegment, selectedPortfolio, onSegmentClick, onPortfolioClick, onClearClick }: BacklogPieChartProps) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    content: string;
    x: number;
    y: number;
  }>({
    visible: false,
    content: '',
    x: 0,
    y: 0
  });

  const showTooltip = (content: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      content,
      x: event.clientX,
      y: event.clientY
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };
  // Function to get the portfolio group based on the backlog portfolio mapping
  const getPortfolioGroup = (bug: JiraIssue): string => {
    const portfolio = bug.portfolio || 'Non Engineering';
    
    // Engineering portfolios (including QA - based on backlog mapping)
    const engineeringPortfolios = [
      'Jegadeesh Core', 'Jegadeesh UI', 'Mujtaba', 'Diksha', 'KK AI/ML', 'KK DevOps', 'Fayaz QA'
    ];
    
    if (engineeringPortfolios.includes(portfolio)) {
      return 'Engineering';
    } else {
      return 'Non-Eng';
    }
  };

  // Calculate counts for each segment
  const engineeringCount = bugs.filter(bug => getPortfolioGroup(bug) === 'Engineering').length;
  const nonEngCount = bugs.filter(bug => getPortfolioGroup(bug) === 'Non-Eng').length;
  const total = bugs.length;

  const segments: PieSegment[] = [
    {
      label: 'Engineering',
      count: engineeringCount,
      percentage: total > 0 ? (engineeringCount / total) * 100 : 0,
      color: '#166534' // Dark green
    },
    {
      label: 'Non-Eng',
      count: nonEngCount,
      percentage: total > 0 ? (nonEngCount / total) * 100 : 0,
      color: '#374151' // Dark grey
    }
  ];

  // Engineering drill-down segments (when Engineering is selected)
  const engineeringBugs = bugs.filter(bug => getPortfolioGroup(bug) === 'Engineering');
  const engineeringPortfolios = [
    'Jegadeesh Core', 'Jegadeesh UI', 'Mujtaba', 'Diksha', 'KK AI/ML', 'KK DevOps', 'Fayaz QA'
  ];
  
  const engineeringDrillDownSegments: PieSegment[] = engineeringPortfolios.map((portfolio, index) => {
    const count = engineeringBugs.filter(bug => bug.portfolio === portfolio).length;
    const colors = ['#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#d946ef']; // Green shades + magenta for QA
    return {
      label: portfolio,
      count,
      percentage: engineeringBugs.length > 0 ? (count / engineeringBugs.length) * 100 : 0,
      color: colors[index % colors.length]
    };
  }).filter(segment => segment.count > 0); // Only show portfolios with bugs

  // Calculate cumulative angles for SVG paths
  let cumulativeAngle = 0;
  const segmentsWithAngles = segments.map(segment => {
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + (segment.percentage / 100) * 360;
    cumulativeAngle = endAngle;
    
    return {
      ...segment,
      startAngle,
      endAngle
    };
  });

  // Function to create SVG path for pie slice
  const createPath = (startAngle: number, endAngle: number, radius: number = 160) => {
    const centerX = 200;
    const centerY = 200;
    
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
  };

  // Function to get text position for percentage labels
  const getTextPosition = (startAngle: number, endAngle: number, radius: number = 120) => {
    const centerX = 200;
    const centerY = 200;
    const midAngle = (startAngle + endAngle) / 2;
    const midAngleRad = (midAngle - 90) * (Math.PI / 180);
    
    const x = centerX + radius * Math.cos(midAngleRad);
    const y = centerY + radius * Math.sin(midAngleRad);
    
    return { x, y };
  };

  // Function to get text position for section name labels (below percentage)
  const getNameTextPosition = (startAngle: number, endAngle: number, radius: number = 100) => {
    const centerX = 200;
    const centerY = 200;
    const midAngle = (startAngle + endAngle) / 2;
    const midAngleRad = (midAngle - 90) * (Math.PI / 180);
    
    const x = centerX + radius * Math.cos(midAngleRad);
    const y = centerY + radius * Math.sin(midAngleRad);
    
    return { x, y };
  };

  if (total === 0) {
    return (
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Portfolio Distribution</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Portfolio Distribution</h2>
        <p className="text-sm text-gray-600 mt-1">
          Breakdown of backlog bugs by portfolio groups
        </p>
      </div>
      
      <div className="p-6">
        {selectedSegment === 'Engineering' ? (
          /* Engineering Drill-Down Chart */
          <div>
            <div className="mb-4 text-center">
              <h3 className="text-md font-semibold text-gray-800">Engineering Portfolio Breakdown</h3>
              <p className="text-sm text-gray-600">Click a portfolio to view detailed issues</p>
            </div>
            <div className="flex items-center justify-center space-x-8">
              {/* Engineering Drill-Down Pie Chart */}
              <div className="flex-shrink-0">
                <svg width="400" height="400" viewBox="0 0 400 400" className="transform -rotate-90">
                  {(() => {
                    let cumulativeAngle = 0;
                    return engineeringDrillDownSegments.map((segment, index) => {
                      const startAngle = cumulativeAngle;
                      const endAngle = cumulativeAngle + (segment.percentage / 100) * 360;
                      cumulativeAngle = endAngle;
                      return (
                        <g key={index}>
                          <path
                            d={createPath(startAngle, endAngle)}
                            fill={segment.color}
                            stroke="white"
                            strokeWidth="2"
                            className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                            onClick={() => onPortfolioClick && onPortfolioClick(segment.label)}
                            onMouseEnter={(e) => showTooltip(`${segment.label}: ${segment.percentage.toFixed(1)}% (${segment.count} bugs)`, e)}
                            onMouseLeave={hideTooltip}
                          />
                          {/* Percentage Label */}
                          {(() => {
                            const { x, y } = getTextPosition(startAngle, endAngle);
                            return (
                              <text
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-white text-xs font-bold pointer-events-none transform rotate-90"
                                style={{ transformOrigin: `${x}px ${y}px` }}
                              >
                                {segment.percentage.toFixed(1)}%
                              </text>
                            );
                          })()}

                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>

              {/* Engineering Drill-Down Legend */}
              <div className="space-y-3">
                {engineeringDrillDownSegments.map((segment, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    onClick={() => onPortfolioClick && onPortfolioClick(segment.label)}
                    onMouseEnter={(e) => showTooltip(`${segment.label}: ${segment.percentage.toFixed(1)}% (${segment.count} bugs)`, e)}
                    onMouseLeave={hideTooltip}
                  >
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    ></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {segment.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {segment.count} bugs ({segment.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Main Overview Chart */
          <div className="flex items-center justify-center space-x-8">
            {/* Pie Chart */}
            <div className="flex-shrink-0">
              <svg width="400" height="400" viewBox="0 0 400 400" className="transform -rotate-90">
                {segmentsWithAngles.map((segment, index) => (
                  <g key={index}>
                    <path
                      d={createPath(segment.startAngle, segment.endAngle)}
                      fill={segment.color}
                      stroke="white"
                      strokeWidth="2"
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedSegment === segment.label 
                          ? 'opacity-100 drop-shadow-lg' 
                          : selectedSegment 
                            ? 'opacity-50 hover:opacity-70' 
                            : 'hover:opacity-80'
                      }`}
                      onClick={() => onSegmentClick(segment.label)}
                      onMouseEnter={(e) => showTooltip(`${segment.label}: ${segment.percentage.toFixed(1)}% (${segment.count} bugs)`, e)}
                      onMouseLeave={hideTooltip}
                    />
                    {/* Percentage Label */}
                    {(() => {
                      const { x, y } = getTextPosition(segment.startAngle, segment.endAngle);
                      return (
                        <text
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-white text-sm font-bold pointer-events-none transform rotate-90"
                          style={{ transformOrigin: `${x}px ${y}px` }}
                        >
                          {segment.percentage.toFixed(1)}%
                        </text>
                      );
                    })()}

                  </g>
                ))}
              </svg>
            </div>

            {/* Legend */}
            <div className="space-y-4">
              {segments.map((segment, index) => (
              <div 
                key={index} 
                className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-all duration-200 ${
                  selectedSegment === segment.label 
                    ? 'bg-blue-50 border-2 border-blue-200' 
                    : selectedSegment 
                      ? 'opacity-50 hover:opacity-70 hover:bg-gray-50' 
                      : 'hover:bg-gray-50'
                }`}
                onClick={() => onSegmentClick(segment.label)}
                onMouseEnter={(e) => showTooltip(`${segment.label}: ${segment.percentage.toFixed(1)}% (${segment.count} bugs)`, e)}
                onMouseLeave={hideTooltip}
              >
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: segment.color }}
                ></div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    selectedSegment === segment.label ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {segment.label}
                  </div>
                  <div className={`text-xs ${
                    selectedSegment === segment.label ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {segment.count} bugs ({segment.percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {selectedSegment === 'Engineering' ? engineeringCount : total}
            </div>
            <div className="text-sm text-gray-500">
              {selectedSegment === 'Engineering' ? 'Engineering Bugs' : 'Total Backlog Bugs'}
            </div>
            {selectedSegment && (
              <button
                onClick={() => onClearClick ? onClearClick() : onSegmentClick('')}
                className="mt-3 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {selectedPortfolio ? 'Back to Engineering' : selectedSegment === 'Engineering' ? 'Back to Overview' : 'Clear Filter'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}