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
    const portfolio = bug.portfolio || 'Unknown';
    
    // Engineering portfolios (including QA - based on backlog mapping)
    const engineeringPortfolios = [
      'Jegadeesh Core', 'Jegadeesh UI', 'Mujtaba', 'Diksha', 'KK AI/ML', 'KK DevOps', 'Fayaz'
    ];
    
    if (engineeringPortfolios.includes(portfolio)) {
      return 'Engineering';
    } else {
      return 'Non-Eng(PM/UX)';
    }
  };

  // Calculate counts for each segment
  const engineeringCount = bugs.filter(bug => getPortfolioGroup(bug) === 'Engineering').length;
  const nonEngCount = bugs.filter(bug => getPortfolioGroup(bug) === 'Non-Eng(PM/UX)').length;
  const total = bugs.length;

  const segments: PieSegment[] = [
    {
      label: 'Engineering',
      count: engineeringCount,
      percentage: total > 0 ? (engineeringCount / total) * 100 : 0,
      color: '#166534' // Dark green
    },
    {
      label: 'Non-Eng(PM/UX)',
      count: nonEngCount,
      percentage: total > 0 ? (nonEngCount / total) * 100 : 0,
      color: '#374151' // Dark grey
    }
  ];

  // Engineering drill-down segments (when Engineering is selected)
  const engineeringBugs = bugs.filter(bug => getPortfolioGroup(bug) === 'Engineering');
  const engineeringPortfolios = [
    'Jegadeesh Core', 'Jegadeesh UI', 'Mujtaba', 'Diksha', 'KK AI/ML', 'KK DevOps', 'Fayaz'
  ];
  
  // Create segments and sort by size (largest first)
  const engineeringDrillDownSegments: PieSegment[] = engineeringPortfolios.map((portfolio, index) => {
    const count = engineeringBugs.filter(bug => bug.portfolio === portfolio).length;
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4']; // High contrast colors: red, blue, green, amber, violet, orange, cyan
    return {
      label: portfolio,
      count,
      percentage: engineeringBugs.length > 0 ? (count / engineeringBugs.length) * 100 : 0,
      color: colors[index % colors.length]
    };
  }).filter(segment => segment.count > 0) // Only show portfolios with bugs
    .sort((a, b) => b.count - a.count); // Sort by count descending (largest first)

  // Calculate optimal rotation to position smaller sections on the right half
  // Start with largest segments on the left, smaller segments on the right
  const sortedSegments = [...segments].sort((a, b) => b.percentage - a.percentage);
  const largestSegmentIndex = segments.findIndex(seg => seg.label === sortedSegments[0]?.label) || 0;
  
  // Position the largest segment at -90 degrees (top) and smaller segments to the right
  const idealAngleForLargest = -90; // Position largest segment at top
  
  // Calculate rotation needed to position largest segment at ideal angle
  let targetAngleForLargest = 0;
  for (let i = 0; i < largestSegmentIndex; i++) {
    targetAngleForLargest += (segments[i].percentage / 100) * 360;
  }
  targetAngleForLargest += (segments[largestSegmentIndex]?.percentage / 200) * 360; // Middle of the segment
  
  const rotationOffset = idealAngleForLargest - targetAngleForLargest + 15; // Additional 15 degree rotation
  let cumulativeAngle = rotationOffset;
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
  const createPath = (startAngle: number, endAngle: number, radius: number = 120) => {
    const centerX = 300;
    const centerY = 200;
    
    const startAngleRad = startAngle * (Math.PI / 180);
    const endAngleRad = endAngle * (Math.PI / 180);
    
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
  const getTextPosition = (startAngle: number, endAngle: number, radius: number = 80) => {
    const centerX = 300;
    const centerY = 200;
    const midAngle = (startAngle + endAngle) / 2;
    const midAngleRad = midAngle * (Math.PI / 180);
    
    const x = centerX + radius * Math.cos(midAngleRad);
    const y = centerY + radius * Math.sin(midAngleRad);
    
    return { x, y };
  };

  // Function to get text position for section name labels (below percentage)
  const getNameTextPosition = (startAngle: number, endAngle: number, radius: number = 110) => {
    const centerX = 350;
    const centerY = 250;
    const midAngle = (startAngle + endAngle) / 2;
    const midAngleRad = (midAngle - 90) * (Math.PI / 180);
    
    const x = centerX + radius * Math.cos(midAngleRad);
    const y = centerY + radius * Math.sin(midAngleRad);
    
    return { x, y };
  };

  // Function to get curved/bent line points for labels with better visibility
  const getBentLinePoints = (startAngle: number, endAngle: number, segmentIndex: number = 0, totalSegments: number = 1) => {
    const centerX = 300;
    const centerY = 200;
    const midAngle = (startAngle + endAngle) / 2;
    const midAngleRad = midAngle * (Math.PI / 180);

    // Start point - edge of pie slice
    const startRadius = 120;
    const startX = centerX + startRadius * Math.cos(midAngleRad);
    const startY = centerY + startRadius * Math.sin(midAngleRad);

    // Elbow point - creates the bent line effect with circular dot
    const elbowRadius = 140;
    const elbowX = centerX + elbowRadius * Math.cos(midAngleRad);
    const elbowY = centerY + elbowRadius * Math.sin(midAngleRad);

    // Determine which side of the chart we're on
    const isRightSide = Math.cos(midAngleRad) >= 0;
    
    // Horizontal extension from elbow - perfectly horizontal line
    const horizontalLength = 40;
    const horizontalEndX = elbowX + (isRightSide ? horizontalLength : -horizontalLength);
    const horizontalEndY = elbowY; // Same Y as elbow for perfectly horizontal line

    // Label position - closer to the line end
    const labelOffset = 8;
    const labelX = horizontalEndX + (isRightSide ? labelOffset : -labelOffset);
    const labelY = horizontalEndY;

    return {
      start: { x: startX, y: startY },
      elbow: { x: elbowX, y: elbowY },
      horizontalEnd: { x: horizontalEndX, y: horizontalEndY },
      label: { x: labelX, y: labelY },
      textAnchor: isRightSide ? 'start' : 'end',
      isRightSide
    };
  };

  // Function to get leader line points for external labels with smart overlap prevention
  const getLeaderLinePoints = (startAngle: number, endAngle: number, segmentIndex: number = 0, totalSegments: number = 1) => {
    const centerX = 350;
    const centerY = 250;
    const midAngle = (startAngle + endAngle) / 2;
    const midAngleRad = (midAngle - 90) * (Math.PI / 180);
    
    // Inner point (edge of pie slice)
    const innerRadius = 170;
    const innerX = centerX + innerRadius * Math.cos(midAngleRad);
    const innerY = centerY + innerRadius * Math.sin(midAngleRad);
    
    // Smart positioning to prevent overlaps for small segments
    let adjustedAngle = midAngleRad;
    const isRightSide = Math.cos(midAngleRad) >= 0;
    
    // Special handling for segments that are likely to overlap (small segments in similar areas)
    if (totalSegments > 3) {
      // Create vertical spacing for labels on the same side
      const sideSegments = segmentIndex < totalSegments / 2 ? segmentIndex : totalSegments - segmentIndex - 1;
      const verticalOffset = (sideSegments % 3) * 0.3; // Stagger vertically
      
      // Adjust angle slightly to spread out labels
      if (isRightSide) {
        adjustedAngle += verticalOffset * (segmentIndex % 2 === 0 ? 1 : -1);
      } else {
        adjustedAngle -= verticalOffset * (segmentIndex % 2 === 0 ? 1 : -1);
      }
    }
    
    // Adaptive elbow radius based on position and segment size
    const baseElbowRadius = 220;
    const sizeAdjustment = Math.max(20, (endAngle - startAngle) * 0.5); // Larger segments get shorter lines
    const positionAdjustment = Math.abs(Math.sin(adjustedAngle * 2)) * 25;
    const elbowRadius = baseElbowRadius + positionAdjustment - sizeAdjustment;
    
    const elbowX = centerX + elbowRadius * Math.cos(adjustedAngle);
    const elbowY = centerY + elbowRadius * Math.sin(adjustedAngle);
    
    // Variable horizontal line length to prevent overlaps
    const baseHorizontalLength = 45;
    const indexAdjustment = (segmentIndex % 3) * 18; // Stagger lengths more
    const angleAdjustment = Math.abs(Math.sin(adjustedAngle * 3)) * 12;
    const horizontalLength = baseHorizontalLength + indexAdjustment + angleAdjustment;
    
    const horizontalEndX = elbowX + (isRightSide ? horizontalLength : -horizontalLength);
    const horizontalEndY = elbowY;
    
    // Label position with enhanced spacing
    const labelOffset = 18;
    const labelX = horizontalEndX + (isRightSide ? labelOffset : -labelOffset);
    const labelY = horizontalEndY;
    
    return {
      inner: { x: innerX, y: innerY },
      elbow: { x: elbowX, y: elbowY },
      horizontalEnd: { x: horizontalEndX, y: horizontalEndY },
      label: { x: labelX, y: labelY },
      textAnchor: isRightSide ? 'start' : 'end'
    };
  };

  // Function to get special positioning for specific portfolios to prevent known overlaps
  const getSpecialPositioning = (portfolioName: string, defaultPoints: any, segmentIndex: number, totalSegments: number) => {
    const centerX = 300; // Updated to match our new center coordinates
    const centerY = 200;
    
    // Create organized label positioning based on segment size and order
    // Larger segments get priority positioning, smaller segments are organized below
    const labelSpacing = 25; // Vertical spacing between labels
    const baseLabelY = centerY + 60; // Start position for labels
    
    // Special handling for main chart KK portfolios and Fayaz - positioned on the left side much higher above Jegadeesh UI
    if (portfolioName.includes('KK DevOps') || portfolioName.includes('KK AI/ML') || portfolioName.includes('Fayaz')) {
      if (portfolioName.includes('KK DevOps')) {
        // Position KK DevOps on the left side much higher above Jegadeesh UI
        const labelX = centerX - 200;
        const labelY = baseLabelY - 200; // Position 2cm (75px) higher above the base line (above KK AI/ML)
        const horizontalEndX = labelX + 18;
        const horizontalEndY = labelY;
        
        return {
          ...defaultPoints,
          horizontalEnd: { x: horizontalEndX, y: horizontalEndY },
          label: { x: labelX, y: labelY },
          textAnchor: 'end'
        };
      } else if (portfolioName.includes('KK AI/ML')) {
        // Position KK AI/ML on the left side below KK DevOps, moved down by 0.5cm
        const labelX = centerX - 200;
        const labelY = baseLabelY - 156; // Position below KK DevOps, moved down by 0.5cm (19px)
        const horizontalEndX = labelX + 18;
        const horizontalEndY = labelY;
        
        return {
          ...defaultPoints,
          horizontalEnd: { x: horizontalEndX, y: horizontalEndY },
          label: { x: labelX, y: labelY },
          textAnchor: 'end'
        };
          } else if (portfolioName.includes('Fayaz')) {
      // Position Fayaz on the left side below Diksha, moved up by 0.5cm
        const labelX = centerX - 200;
        const labelY = baseLabelY + 44; // Position below Diksha, moved up by 0.5cm (19px)
        const horizontalEndX = labelX + 18;
        const horizontalEndY = labelY;
        
        return {
          ...defaultPoints,
          horizontalEnd: { x: horizontalEndX, y: horizontalEndY },
          label: { x: labelX, y: labelY },
          textAnchor: 'end'
        };
      }
    }
    
    // Special handling for engineering drill-down chart - organized positioning
    if (portfolioName.includes('Fayaz')) {
      // Move Fayaz with organized spacing
      const labelX = centerX + 220;
      const labelY = baseLabelY + (segmentIndex * labelSpacing);
      const horizontalEndX = labelX - 18;
      const horizontalEndY = labelY;
      
      return {
        ...defaultPoints,
        horizontalEnd: { x: horizontalEndX, y: horizontalEndY },
        label: { x: labelX, y: labelY },
        textAnchor: 'start'
      };
    }
    
    // KK DevOps positioning for engineering chart - positioned on the left side much higher above other labels
    if (portfolioName.includes('KK DevOps') && !portfolioName.includes('KK AI/ML')) {
      // Move KK DevOps to the left side much higher above other labels
      const labelX = centerX - 210;
      const labelY = baseLabelY - 200; // Position 2cm (75px) higher above the base line (above KK AI/ML)
      const horizontalEndX = labelX + 18;
      const horizontalEndY = labelY;
      
      return {
        ...defaultPoints,
        horizontalEnd: { x: horizontalEndX, y: horizontalEndY },
        label: { x: labelX, y: labelY },
        textAnchor: 'end'
      };
    }
    
    return defaultPoints;
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
      
      <div className="p-6 flex justify-center">
        {selectedSegment === 'Engineering' ? (
          /* Engineering Drill-Down Chart */
          <div className="w-full">
            <div className="mb-4 text-center">
              <h3 className="text-md font-semibold text-gray-800">Engineering Portfolio Breakdown</h3>
              <p className="text-sm text-gray-600">Click a portfolio to view detailed issues</p>
            </div>
            <div className="flex items-center justify-center">
              {/* Engineering Pie Chart with Bent Lines */}
              <div className="flex-shrink-0">
                <svg width="900" height="600" viewBox="0 0 600 400" className="mx-auto">
                  {(() => {
                    // Calculate optimal rotation for engineering chart - position smaller sections on the right
                    const engLargestIndex = engineeringDrillDownSegments.length > 0 ? 
                      engineeringDrillDownSegments.findIndex(seg => 
                        seg.percentage === Math.max(...engineeringDrillDownSegments.map(s => s.percentage))
                      ) : 0;
                    let engTargetAngle = 0;
                    for (let i = 0; i < engLargestIndex; i++) {
                      engTargetAngle += (engineeringDrillDownSegments[i]?.percentage / 100) * 360;
                    }
                    engTargetAngle += (engineeringDrillDownSegments[engLargestIndex]?.percentage / 200) * 360;
                    const engRotationOffset = -90 - engTargetAngle + 15; // Position largest at top, smaller sections on right
                    let cumulativeAngle = engRotationOffset;
                    return engineeringDrillDownSegments.map((segment, index) => {
                      const startAngle = cumulativeAngle;
                      const endAngle = cumulativeAngle + (segment.percentage / 100) * 360;
                      cumulativeAngle = endAngle;
                      const { x, y } = getTextPosition(startAngle, endAngle);
                      const defaultLinePoints = getBentLinePoints(startAngle, endAngle, index, engineeringDrillDownSegments.length);
                      const linePoints = getSpecialPositioning(segment.label, defaultLinePoints, index, engineeringDrillDownSegments.length);
                      return (
                        <g key={index}>
                          <path
                            d={createPath(startAngle, endAngle, 120)}
                            fill={segment.color}
                            stroke="white"
                            strokeWidth="3"
                            className="cursor-pointer hover:opacity-90 transition-opacity duration-200"
                            onClick={() => onPortfolioClick && onPortfolioClick(segment.label)}
                            onMouseEnter={(e) => showTooltip(`${segment.label}: ${segment.percentage.toFixed(1)}% (${segment.count} bugs)`, e)}
                            onMouseLeave={hideTooltip}
                          />

                          {/* Bent line from pie edge to elbow */}
                          <line
                            x1={linePoints.start.x}
                            y1={linePoints.start.y}
                            x2={linePoints.elbow.x}
                            y2={linePoints.elbow.y}
                            stroke="#9CA3AF"
                            strokeWidth="1"
                            className="pointer-events-none"
                            opacity="0.7"
                          />
                          
                          {/* Horizontal line from elbow to label */}
                          <line
                            x1={linePoints.elbow.x}
                            y1={linePoints.elbow.y}
                            x2={linePoints.horizontalEnd.x}
                            y2={linePoints.horizontalEnd.y}
                            stroke="#9CA3AF"
                            strokeWidth="1"
                            className="pointer-events-none"
                            opacity="0.7"
                          />
                          
                          {/* Small circle at the end of line */}
                          <circle
                            cx={linePoints.horizontalEnd.x}
                            cy={linePoints.horizontalEnd.y}
                            r="1.5"
                            fill="#9CA3AF"
                            className="pointer-events-none"
                            opacity="0.8"
                          />
                          
                          {/* Circular dot at elbow point */}
                          <circle
                            cx={linePoints.elbow.x}
                            cy={linePoints.elbow.y}
                            r="2"
                            fill="#9CA3AF"
                            className="pointer-events-none"
                            opacity="0.8"
                          />

                          {/* Label with category and percentage */}
                          <text
                            x={linePoints.label.x}
                            y={linePoints.label.y}
                            textAnchor={linePoints.textAnchor}
                            dominantBaseline="middle"
                            className="fill-gray-900 text-xs font-medium pointer-events-none"
                            style={{ filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.8))' }}
                          >
                            {segment.label}, {segment.percentage.toFixed(1)}%
                          </text>
                          
                          {/* Count on second line */}
                          <text
                            x={linePoints.label.x}
                            y={linePoints.label.y + 14}
                            textAnchor={linePoints.textAnchor}
                            dominantBaseline="middle"
                            className="fill-gray-600 text-xs font-medium pointer-events-none"
                            style={{ filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.8))' }}
                          >
                            {segment.count} bugs
                          </text>
                          
                          {/* Percentage Label inside slice - only for larger segments or specific portfolios */}
                          {(segment.percentage > 10 || segment.label.includes('Diksha') || segment.label.includes('Fayaz') || segment.label.includes('Jegadeesh UI')) && (
                            <text
                              x={x}
                              y={y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-white text-xs font-bold pointer-events-none"
                              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))', fontSize: '0.5rem' }}
                            >
                              {segment.percentage.toFixed(1)}%
                            </text>
                          )}
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>
          </div>
        ) : (
          /* Main Overview Chart */
          <div className="w-full flex items-center justify-center">
            {/* Pie Chart with Bent Lines for Better Visibility */}
            <div className="flex-shrink-0">
              <svg width="900" height="600" viewBox="0 0 600 400" className="mx-auto">
                {segmentsWithAngles.map((segment, index) => {
                  const { x, y } = getTextPosition(segment.startAngle, segment.endAngle);
                  const defaultLinePoints = getBentLinePoints(segment.startAngle, segment.endAngle, index, segmentsWithAngles.length);
                  const linePoints = getSpecialPositioning(segment.label, defaultLinePoints, index, segmentsWithAngles.length);
                  return (
                    <g key={index}>
                      <path
                        d={createPath(segment.startAngle, segment.endAngle, 120)}
                        fill={segment.color}
                        stroke="white"
                        strokeWidth="3"
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedSegment === segment.label 
                            ? 'opacity-100 drop-shadow-lg' 
                            : selectedSegment 
                              ? 'opacity-50 hover:opacity-70' 
                              : 'hover:opacity-90'
                        }`}
                        onClick={() => onSegmentClick(segment.label)}
                        onMouseEnter={(e) => showTooltip(`${segment.label}: ${segment.percentage.toFixed(1)}% (${segment.count} bugs)`, e)}
                        onMouseLeave={hideTooltip}
                      />

                      {/* Bent line from pie edge to elbow */}
                      <line
                        x1={linePoints.start.x}
                        y1={linePoints.start.y}
                        x2={linePoints.elbow.x}
                        y2={linePoints.elbow.y}
                        stroke="#9CA3AF"
                        strokeWidth="1"
                        className="pointer-events-none"
                        opacity="0.7"
                      />
                      
                      {/* Horizontal line from elbow to label */}
                      <line
                        x1={linePoints.elbow.x}
                        y1={linePoints.elbow.y}
                        x2={linePoints.horizontalEnd.x}
                        y2={linePoints.horizontalEnd.y}
                        stroke="#9CA3AF"
                        strokeWidth="1"
                        className="pointer-events-none"
                        opacity="0.7"
                      />
                      
                      {/* Small circle at the end of line */}
                      <circle
                        cx={linePoints.horizontalEnd.x}
                        cy={linePoints.horizontalEnd.y}
                        r="1.5"
                        fill="#9CA3AF"
                        className="pointer-events-none"
                        opacity="0.8"
                      />
                      
                      {/* Circular dot at elbow point */}
                      <circle
                        cx={linePoints.elbow.x}
                        cy={linePoints.elbow.y}
                        r="2"
                        fill="#9CA3AF"
                        className="pointer-events-none"
                        opacity="0.8"
                      />

                      {/* Label with category and percentage */}
                      <text
                        x={linePoints.label.x}
                        y={linePoints.label.y}
                        textAnchor={linePoints.textAnchor}
                        dominantBaseline="middle"
                        className="fill-gray-900 text-xs font-medium pointer-events-none"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.8))' }}
                      >
                        {segment.label}, {segment.percentage.toFixed(1)}%
                      </text>
                      
                      {/* Count on second line */}
                      <text
                        x={linePoints.label.x}
                        y={linePoints.label.y + 14}
                        textAnchor={linePoints.textAnchor}
                        dominantBaseline="middle"
                        className="fill-gray-600 text-xs font-medium pointer-events-none"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.8))' }}
                      >
                        {segment.count} bugs
                      </text>

                      {/* Percentage Label inside slice - only for larger segments */}
                      {segment.percentage > 8 && (
                        <text
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-white text-xs font-bold pointer-events-none"
                          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))', fontSize: '0.5rem' }}
                        >
                          {segment.percentage.toFixed(1)}%
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
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