import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphEdge } from '../../shared/types';

interface KnowledgeGraphVisualizerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  width?: number;
  height?: number;
}

// Cache for layout calculations
const layoutCache = new Map<string, { x: number; y: number }[]>();

export const KnowledgeGraphVisualizer: React.FC<KnowledgeGraphVisualizerProps> = ({
  nodes,
  edges,
  onNodeClick,
  onNodeDoubleClick,
  width = 800,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [isLargeGraph, setIsLargeGraph] = useState(false);

  // Determine if we need virtualization (1000+ nodes)
  useEffect(() => {
    setIsLargeGraph(nodes.length >= 1000);
  }, [nodes.length]);

  // Generate cache key for layout
  const cacheKey = useMemo(() => {
    return `${nodes.map(n => n.id).sort().join(',')}_${edges.length}`;
  }, [nodes, edges]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    
    // Create container group for zoom/pan
    const container = svg.append('g');

    // Set up zoom behavior with controls
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        setTransform(event.transform);
      });

    // Store zoom behavior reference for controls
    zoomBehaviorRef.current = zoom;

    svg.call(zoom);

    // Apply initial transform if exists
    if (transform && !transform.k) {
      svg.call(zoom.transform, transform);
    }

    // Create simulation data with proper typing
    interface SimulationNode extends d3.SimulationNodeDatum {
      id: string;
      label: string;
      type: 'note' | 'image' | 'webpage';
      connectionCount?: number;
    }

    interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
      source: string | SimulationNode;
      target: string | SimulationNode;
      confidence: number;
      type: 'semantic' | 'temporal' | 'manual';
    }

    // Check cache for layout
    const cachedLayout = layoutCache.get(cacheKey);
    
    const simulationNodes: SimulationNode[] = nodes.map((node, index) => {
      const cached = cachedLayout?.[index];
      return {
        ...node,
        connectionCount: node.connectionCount || 0,
        x: cached?.x,
        y: cached?.y,
      };
    });

    const simulationLinks: SimulationLink[] = edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      confidence: edge.confidence,
      type: edge.type,
    }));

    // For large graphs, use simpler forces
    const chargeStrength = isLargeGraph ? -100 : -300;

    // Create force simulation
    const simulation = d3.forceSimulation<SimulationNode>(simulationNodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(simulationLinks)
        .id(d => d.id)
        .distance(isLargeGraph ? 50 : 100))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(isLargeGraph ? 15 : 30))
      .alphaDecay(isLargeGraph ? 0.05 : 0.0228); // Faster convergence for large graphs

    // Create links (edges) with color-coding by confidence
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simulationLinks)
      .join('line')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('stroke', d => {
        // Color-code connections by confidence
        if (d.confidence > 0.8) return '#4CAF50'; // green >0.8
        if (d.confidence >= 0.7) return '#FFC107'; // yellow 0.7-0.8
        return '#9E9E9E'; // gray <0.7
      });

    // Drag functions
    function dragStarted(event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragEnded(event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Create nodes
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simulationNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, SimulationNode>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded) as any);

    // Add circles to nodes with size proportional to connection count
    node.append('circle')
      .attr('r', d => {
        // Node size proportional to connection count
        const baseSize = 8;
        const connectionCount = d.connectionCount || 0;
        // Scale: 8px base + 2px per connection, max 30px
        return Math.min(baseSize + connectionCount * 2, 30);
      })
      .attr('fill', d => {
        // Color by type
        switch (d.type) {
          case 'note': return '#4A90E2';
          case 'image': return '#E24A90';
          case 'webpage': return '#90E24A';
          default: return '#999';
        }
      })
      .attr('stroke', d => selectedNodeId === d.id ? '#FFD700' : '#fff')
      .attr('stroke-width', d => selectedNodeId === d.id ? 3 : 1.5);

    // Add labels to nodes
    node.append('text')
      .text(d => d.label)
      .attr('x', 12)
      .attr('y', 4)
      .attr('font-size', '10px')
      .attr('fill', '#333')
      .attr('pointer-events', 'none');

    // Add click handlers
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNodeId(d.id);
      if (onNodeClick) {
        onNodeClick(d.id);
      }
    });

    node.on('dblclick', (event, d) => {
      event.stopPropagation();
      if (onNodeDoubleClick) {
        onNodeDoubleClick(d.id);
      }
    });

    // Update positions on simulation tick
    let tickCount = 0;
    simulation.on('tick', () => {
      tickCount++;
      
      // For large graphs, only update every few ticks for performance
      if (isLargeGraph && tickCount % 3 !== 0) return;

      link
        .attr('x1', d => (d.source as SimulationNode).x || 0)
        .attr('y1', d => (d.source as SimulationNode).y || 0)
        .attr('x2', d => (d.target as SimulationNode).x || 0)
        .attr('y2', d => (d.target as SimulationNode).y || 0);

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Cache layout when simulation ends
    simulation.on('end', () => {
      const positions = simulationNodes.map(n => ({ x: n.x || 0, y: n.y || 0 }));
      layoutCache.set(cacheKey, positions);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, edges, selectedNodeId, onNodeClick, onNodeDoubleClick, width, height, isLargeGraph, cacheKey]);

  // Zoom control handlers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition()
        .duration(750)
        .call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition()
        .duration(750)
        .call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition()
        .duration(750)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ccc', background: '#fafafa' }}
      />
      
      {/* Zoom controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        background: 'white',
        padding: '5px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <button
          onClick={handleZoomIn}
          style={{
            width: '30px',
            height: '30px',
            border: '1px solid #ccc',
            background: 'white',
            cursor: 'pointer',
            borderRadius: '4px',
            fontSize: '18px',
          }}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            width: '30px',
            height: '30px',
            border: '1px solid #ccc',
            background: 'white',
            cursor: 'pointer',
            borderRadius: '4px',
            fontSize: '18px',
          }}
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleResetZoom}
          style={{
            width: '30px',
            height: '30px',
            border: '1px solid #ccc',
            background: 'white',
            cursor: 'pointer',
            borderRadius: '4px',
            fontSize: '12px',
          }}
          title="Reset Zoom"
        >
          ⟲
        </button>
      </div>

      {/* Performance indicator for large graphs */}
      {isLargeGraph && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(255, 193, 7, 0.9)',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#333',
        }}>
          Large graph mode: {nodes.length} nodes
        </div>
      )}
    </div>
  );
};
