import React from 'react';
import { KnowledgeGraphContainer } from '../components';

export function GraphView() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <KnowledgeGraphContainer 
        width={window.innerWidth - 280} 
        height={window.innerHeight - 80} 
      />
    </div>
  );
}
