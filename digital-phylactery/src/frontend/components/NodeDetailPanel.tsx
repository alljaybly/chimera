import React from 'react';
import { KnowledgeNode, Connection } from '../../shared/types';

interface NodeDetailPanelProps {
  node: KnowledgeNode | null;
  connections: Connection[];
  allNodes: Map<string, KnowledgeNode>;
  onClose: () => void;
  onCreateConnection: (targetNodeId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
  onNodeClick: (nodeId: string) => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  connections,
  allNodes,
  onClose,
  onCreateConnection,
  onDeleteConnection,
  onNodeClick,
}) => {
  const [showCreateConnection, setShowCreateConnection] = React.useState(false);
  const [selectedTargetId, setSelectedTargetId] = React.useState('');

  if (!node) return null;

  const handleCreateConnection = () => {
    if (selectedTargetId && selectedTargetId !== node.id) {
      onCreateConnection(selectedTargetId);
      setSelectedTargetId('');
      setShowCreateConnection(false);
    }
  };

  // Get available nodes for connection (exclude current node and already connected nodes)
  const connectedNodeIds = new Set([
    ...connections.filter(c => c.sourceNodeId === node.id).map(c => c.targetNodeId),
    ...connections.filter(c => c.targetNodeId === node.id).map(c => c.sourceNodeId),
  ]);
  
  const availableNodes = Array.from(allNodes.values()).filter(
    n => n.id !== node.id && !connectedNodeIds.has(n.id)
  );

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      width: '400px',
      height: '100vh',
      background: 'white',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      padding: '20px',
      overflowY: 'auto',
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Node Details</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            width: '30px',
            height: '30px',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>Type:</strong> <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            background: node.type === 'note' ? '#E3F2FD' : node.type === 'image' ? '#FCE4EC' : '#F1F8E9',
            fontSize: '12px',
          }}>{node.type}</span>
        </div>
        
        {node.metadata.title && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Title:</strong> {node.metadata.title}
          </div>
        )}
        
        {node.metadata.source && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Source:</strong> {node.metadata.source}
          </div>
        )}
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Created:</strong> {new Date(node.metadata.createdAt).toLocaleString()}
        </div>
        
        {node.metadata.tags.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Tags:</strong> {node.metadata.tags.map(tag => (
              <span key={tag} style={{
                display: 'inline-block',
                padding: '2px 8px',
                margin: '2px',
                borderRadius: '4px',
                background: '#E0E0E0',
                fontSize: '12px',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
        <strong>Content:</strong>
        <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', fontSize: '14px' }}>
          {typeof node.content === 'string' ? node.content : '[Binary content]'}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Connections ({connections.length})</h3>
          <button
            onClick={() => setShowCreateConnection(!showCreateConnection)}
            style={{
              padding: '4px 12px',
              background: '#4A90E2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            + Add
          </button>
        </div>

        {showCreateConnection && (
          <div style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            >
              <option value="">Select a node...</option>
              {availableNodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.metadata.title || n.id.substring(0, 8)} ({n.type})
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCreateConnection}
                disabled={!selectedTargetId}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: selectedTargetId ? '#4CAF50' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedTargetId ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                }}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateConnection(false);
                  setSelectedTargetId('');
                }}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: '#9E9E9E',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {connections.length === 0 ? (
            <p style={{ color: '#999', fontSize: '14px' }}>No connections yet</p>
          ) : (
            connections.map(conn => {
              const isSource = conn.sourceNodeId === node.id;
              const otherNodeId = isSource ? conn.targetNodeId : conn.sourceNodeId;
              const otherNode = allNodes.get(otherNodeId);
              
              return (
                <div
                  key={conn.id}
                  style={{
                    padding: '10px',
                    marginBottom: '8px',
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div
                        onClick={() => onNodeClick(otherNodeId)}
                        style={{
                          cursor: 'pointer',
                          color: '#4A90E2',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          marginBottom: '4px',
                        }}
                      >
                        {otherNode?.metadata.title || otherNodeId.substring(0, 8)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        Type: {conn.type} | Confidence: {(conn.confidence * 100).toFixed(0)}%
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        {conn.metadata.reason}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteConnection(conn.id)}
                      style={{
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginLeft: '8px',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
