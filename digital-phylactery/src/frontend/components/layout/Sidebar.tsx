import { useState } from 'react';
import { ContentIngestionPanel } from '../ingestion/ContentIngestionPanel';
import { useAppStore } from '../../store';

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<'ingest' | 'info'>('ingest');
  const nodes = useAppStore((state) => state.nodes);
  const connections = useAppStore((state) => state.connections);

  return (
    <aside style={{
      width: '320px',
      minWidth: '280px',
      maxWidth: '400px',
      backgroundColor: 'white',
      borderRight: '1px solid #ddd',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0
    }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #ddd',
        flexShrink: 0
      }}>
        <button
          onClick={() => setActiveTab('ingest')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            backgroundColor: activeTab === 'ingest' ? '#3498db' : 'transparent',
            color: activeTab === 'ingest' ? 'white' : '#333',
            cursor: 'pointer',
            fontWeight: activeTab === 'ingest' ? 'bold' : 'normal',
            transition: 'background-color 0.2s'
          }}
        >
          Add Content
        </button>
        <button
          onClick={() => setActiveTab('info')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            backgroundColor: activeTab === 'info' ? '#3498db' : 'transparent',
            color: activeTab === 'info' ? 'white' : '#333',
            cursor: 'pointer',
            fontWeight: activeTab === 'info' ? 'bold' : 'normal',
            transition: 'background-color 0.2s'
          }}
        >
          Info
        </button>
      </div>
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px'
      }}>
        {activeTab === 'ingest' && <ContentIngestionPanel />}
        {activeTab === 'info' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#2c3e50' }}>
              About Digital Phylactery
            </h3>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              A self-evolving knowledge management system that discovers connections between your content.
            </p>
            
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#2c3e50', fontSize: '14px' }}>
                Knowledge Base Stats
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#666' }}>Total Nodes:</span>
                  <strong style={{ color: '#2c3e50' }}>{nodes.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#666' }}>Connections:</span>
                  <strong style={{ color: '#2c3e50' }}>{connections.length}</strong>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
              <p style={{ marginBottom: '8px' }}>Features:</p>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Automatic connection discovery</li>
                <li>Adaptive UI that learns from usage</li>
                <li>Full-text search</li>
                <li>Visual knowledge graph</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
