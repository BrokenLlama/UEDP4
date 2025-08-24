import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Paper } from '@/types/paper';

interface BubbleNode {
  id: string;
  paper: Paper;
  x: number;
  y: number;
  radius: number;
  cluster: number;
}

interface CollectionBubbleGraphProps {
  papers: Paper[];
  width?: number;
  height?: number;
  onNodeClick?: (paper: Paper) => void;
}

export default function CollectionBubbleGraph({ 
  papers, 
  width = 800, 
  height = 600,
  onNodeClick 
}: CollectionBubbleGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const handleBubbleClick = (event: any, paper: Paper) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedPaper(paper);
    onNodeClick?.(paper);
  };

  useEffect(() => {
    if (!papers.length || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Calculate available width for the graph
    const availableWidth = selectedPaper ? width - 320 : width;

    // Create bubble data
    const bubbleData: BubbleNode[] = papers.map((paper, index) => {
      // Calculate bubble size based on paper importance (year, citations, etc.)
      const year = paper.year || 2020;
      const citations = paper.citationCount || 0;
      const baseSize = 20;
      const yearFactor = Math.max(0.5, (year - 1990) / 30); // Papers from 1990-2020
      const citationFactor = Math.min(2, 1 + (citations / 100)); // Cap at 2x for high citations
      const radius = baseSize * yearFactor * citationFactor;

      // Assign clusters based on year ranges
      let cluster = 0;
      if (year < 2000) cluster = 0;
      else if (year < 2010) cluster = 1;
      else if (year < 2020) cluster = 2;
      else cluster = 3;

      return {
        id: paper.paperId,
        paper,
        x: Math.random() * (availableWidth - 100) + 50,
        y: Math.random() * (height - 100) + 50,
        radius,
        cluster
      };
    });

    // Create color scale for clusters
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['0', '1', '2', '3'])
      .range(['#ff7f0e', '#2ca02c', '#d62728', '#9467bd']);

    // Create simulation
    const simulation = d3.forceSimulation<BubbleNode>(bubbleData)
      .force('charge', d3.forceManyBody<BubbleNode>().strength(5))
      .force('center', d3.forceCenter(availableWidth / 2, height / 2))
      .force('collision', d3.forceCollide<BubbleNode>().radius(d => d.radius + 5));

    // Create SVG
    const svg = d3.select(svgRef.current);
    
    // Add background
    svg.append('rect')
      .attr('width', availableWidth)
      .attr('height', height)
      .attr('fill', '#f8f9fa')
      .attr('rx', 8);

    // Create bubble groups
    const bubbles = svg.selectAll('.bubble')
      .data(bubbleData)
      .enter()
      .append('g')
      .attr('class', 'bubble')
      .style('cursor', 'pointer')
      .on('click', (event, d) => handleBubbleClick(event, d.paper))
      .on('mouseover', function(event, d) {
        d3.select(this).select('circle').transition().duration(200).attr('r', d.radius * 1.1);
        d3.select(this).select('text').transition().duration(200).style('font-size', '12px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('circle').transition().duration(200).attr('r', d.radius);
        d3.select(this).select('text').transition().duration(200).style('font-size', '10px');
      });

    // Add circles
    bubbles.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => colorScale(d.cluster.toString()))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.8);

    // Add text labels
    bubbles.append('text')
      .text(d => d.paper.title.length > 20 ? d.paper.title.substring(0, 20) + '...' : d.paper.title)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      bubbles.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [papers, width, height, onNodeClick, selectedPaper]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full relative">
      {/* Graph container that squeezes when panel is open */}
      <div className={`flex-1 min-h-0 transition-all duration-300 ease-in-out ${
        selectedPaper ? 'lg:mr-80' : ''
      }`}>
        <svg
          ref={svgRef}
          width={selectedPaper ? width - 320 : width}
          height={height}
          className="border border-gray-200 rounded-lg w-full h-full"
          style={{ maxHeight: '600px' }}
        />
      </div>
      
      {/* Sliding metadata panel */}
      <div 
        className={`fixed lg:absolute top-0 right-0 h-full lg:h-auto w-80 bg-white border-l border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          selectedPaper 
            ? 'translate-x-0' 
            : 'translate-x-full'
        }`}
      >
        {selectedPaper && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex-1 pr-4">
                {selectedPaper.title}
              </h3>
              <button
                onClick={() => setSelectedPaper(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Authors</h4>
                <p className="text-sm text-gray-800">
                  {selectedPaper.authors?.map(a => a.name).join(', ') || 'Unknown'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Year</h4>
                <p className="text-sm text-gray-800">{selectedPaper.year || 'Unknown'}</p>
              </div>
              
              {selectedPaper.citationCount && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Citations</h4>
                  <p className="text-sm text-gray-800">{selectedPaper.citationCount}</p>
                </div>
              )}
              
              {selectedPaper.abstract && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Abstract</h4>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {selectedPaper.abstract.length > 500 
                      ? selectedPaper.abstract.substring(0, 500) + '...'
                      : selectedPaper.abstract
                    }
                  </p>
                </div>
              )}
              
              {selectedPaper.venue && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Venue</h4>
                  <p className="text-sm text-gray-800">{selectedPaper.venue}</p>
                </div>
              )}
            </div>
            
            {/* Footer with buttons */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                {selectedPaper.pdfUrl && (
                  <a
                    href={selectedPaper.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View PDF
                  </a>
                )}
                <button
                  onClick={() => {
                    window.open(`/paper/${selectedPaper.paperId}`, '_blank');
                  }}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Overlay for mobile */}
      {selectedPaper && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSelectedPaper(null)}
        />
      )}
    </div>
  );
}
