import React, { useState, useEffect, useCallback } from 'react';
import { KnowledgeGraphVisualizer } from './KnowledgeGraphVisualizer';
import { NodeDetailPanel } from './NodeDetailPanel';
import { GraphNode, GraphEdge, KnowledgeNode, Connection } from '@shared/types';
import { useAppStore } from '../store';

interface KnowledgeGraphContainerProps {
  width?: number;
  height?: number;
}

export const KnowledgeGraphContainer: React.FC<KnowledgeGraphContainerProps> = ({
  width = 800,
  height = 600,
}) => {
  const storeNodes = useAppStore((state) => state.nodes);
  const storeConnections = useAppStore((state) => state.connections);
  const setStoreNodes = useAppStore((state) => state.setNodes);
  const setStoreConnections = useAppStore((state) => state.setConnections);
  const selectedNodeId = useAppStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId);
  
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [allNodesMap, setAllNodesMap] = useState<Map<string, KnowledgeNode>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch graph data from API
  const fetchGraphData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all nodes
      const nodesResponse = await fetch('/api/nodes');
      if (!nodesResponse.ok) throw new Error('Failed to fetch nodes');
      const nodesData = await nodesResponse.json();
      const knowledgeNodes: KnowledgeNode[] = nodesData.data || [];

      // Update store
      setStoreNodes(knowledgeNodes);

      // Build nodes map
      const nodesMap = new Map<string, KnowledgeNode>();
      knowledgeNodes.forEach(node => nodesMap.set(node.id, node));
      setAllNodesMap(nodesMap);

      // Fetch all connections
      const connectionsResponse = await fetch('/api/connections');
      if (!connectionsResponse.ok) throw new Error('Failed to fetch connections');
      const connectionsData = await connectionsResponse.json();
      const allConnections: Connection[] = connectionsData.data || [];
      
      // Update store
      setStoreConnections(allConnections);

      // Calculate connection counts for each node
      const connectionCounts = new Map<string, number>();
      allConnections.forEach(conn => {
        connectionCounts.set(conn.sourceNodeId, (connectionCounts.get(conn.sourceNodeId) || 0) + 1);
        connectionCounts.set(conn.targetNodeId, (connectionCounts.get(conn.targetNodeId) || 0) + 1);
      });

      // Transform to graph nodes
      const graphNodes: GraphNode[] = knowledgeNodes.map(node => ({
        id: node.id,
        label: node.metadata.title || node.id.substring(0, 8),
        type: node.type,
        connectionCount: connectionCounts.get(node.id) || 0,
      }));

      // Transform to graph edges
      const graphEdges: GraphEdge[] = allConnections.map(conn => ({
        source: conn.sourceNodeId,
        target: conn.targetNodeId,
        confidence: conn.confidence,
        type: conn.type,
      }));

      setNodes(graphNodes);
      setEdges(graphEdges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching graph data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Fetch selected node details
  useEffect(() => {
    if (!selectedNodeId) {
      setSelectedNode(null);
      setConnections([]);
      return;
    }

    const fetchNodeDetails = async () => {
      try {
        // Fetch node details
        const nodeResponse = await fetch(`/api/nodes/${selectedNodeId}`);
        if (!nodeResponse.ok) throw new Error('Failed to fetch node details');
        const nodeData = await nodeResponse.json();
        setSelectedNode(nodeData.data);

        // Fetch node connections
        const connectionsResponse = await fetch(`/api/connections/${selectedNodeId}`);
        if (!connectionsResponse.ok) throw new Error('Failed to fetch connections');
        const connectionsData = await connectionsResponse.json();
        setConnections(connectionsData.data || []);
      } catch (err) {
        console.error('Error fetching node details:', err);
      }
    };

    fetchNodeDetails();
  }, [selectedNodeId]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleClosePanel = () => {
    setSelectedNodeId(null);
  };

  const handleCreateConnection = async (targetNodeId: string) => {
    if (!selectedNodeId) return;

    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceNodeId: selectedNodeId,
          targetNodeId,
          type: 'manual',
        }),
      });

      if (!response.ok) throw new Error('Failed to create connection');

      // Refresh graph data and node details
      await fetchGraphData();
      const currentNodeId = selectedNodeId;
      setSelectedNodeId(currentNodeId); // Trigger re-fetch of node details
    } catch (err) {
      console.error('Error creating connection:', err);
      alert('Failed to create connection');
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete connection');

      // Refresh graph data and node details
      await fetchGraphData();
      if (selectedNodeId) {
        const currentNodeId = selectedNodeId;
        setSelectedNodeId(currentNodeId); // Trigger re-fetch of node details
      }
    } catch (err) {
      console.error('Error deleting connection:', err);
      alert('Failed to delete connection');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <p>Loading graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <KnowledgeGraphVisualizer
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        width={width}
        height={height}
      />
      {selectedNodeId && (
        <NodeDetailPanel
          node={selectedNode}
          connections={connections}
          allNodes={allNodesMap}
          onClose={handleClosePanel}
          onCreateConnection={handleCreateConnection}
          onDeleteConnection={handleDeleteConnection}
          onNodeClick={handleNodeClick}
        />
      )}
    </div>
  );
};
