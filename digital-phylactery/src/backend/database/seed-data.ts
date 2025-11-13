/**
 * Seed data for demo purposes
 * Creates sample knowledge nodes and connections
 */

import { v4 as uuidv4 } from 'uuid';
import { KnowledgeNode, Connection } from '../../shared/types/index.js';

export const sampleNodes: KnowledgeNode[] = [
  {
    id: uuidv4(),
    type: 'note',
    content: 'AI Ethics and responsible development are crucial for the future of technology.',
    metadata: {
      title: 'AI Ethics',
      tags: ['AI', 'ethics', 'technology'],
      createdAt: new Date('2024-01-15'),
      modifiedAt: new Date('2024-01-15'),
    },
    searchableText: 'AI Ethics and responsible development are crucial for the future of technology. AI ethics technology',
    embedding: null,
  },
  {
    id: uuidv4(),
    type: 'note',
    content: 'The Gopher protocol was an early internet protocol that predated HTTP.',
    metadata: {
      title: 'Gopher Protocol',
      tags: ['internet', 'history', 'protocols'],
      createdAt: new Date('2024-01-16'),
      modifiedAt: new Date('2024-01-16'),
    },
    searchableText: 'The Gopher protocol was an early internet protocol that predated HTTP. internet history protocols gopher',
    embedding: null,
  },
  {
    id: uuidv4(),
    type: 'note',
    content: 'Self-evolving user interfaces adapt to user behavior patterns automatically.',
    metadata: {
      title: 'Self-Evolving UIs',
      tags: ['UI', 'UX', 'adaptive', 'AI'],
      createdAt: new Date('2024-01-17'),
      modifiedAt: new Date('2024-01-17'),
    },
    searchableText: 'Self-evolving user interfaces adapt to user behavior patterns automatically. UI UX adaptive AI',
    embedding: null,
  },
  {
    id: uuidv4(),
    type: 'note',
    content: 'Knowledge graphs represent information as interconnected nodes and relationships.',
    metadata: {
      title: 'Knowledge Graphs',
      tags: ['data', 'graphs', 'knowledge'],
      createdAt: new Date('2024-01-18'),
      modifiedAt: new Date('2024-01-18'),
    },
    searchableText: 'Knowledge graphs represent information as interconnected nodes and relationships. data graphs knowledge',
    embedding: null,
  },
  {
    id: uuidv4(),
    type: 'note',
    content: 'Telnet BBS systems were popular in the 1980s and 1990s for online communities.',
    metadata: {
      title: 'Telnet BBS',
      tags: ['BBS', 'telnet', 'history', 'internet'],
      createdAt: new Date('2024-01-19'),
      modifiedAt: new Date('2024-01-19'),
    },
    searchableText: 'Telnet BBS systems were popular in the 1980s and 1990s for online communities. BBS telnet history internet',
    embedding: null,
  },
  {
    id: uuidv4(),
    type: 'note',
    content: 'Machine learning models can detect patterns in user behavior for UI optimization.',
    metadata: {
      title: 'ML Pattern Detection',
      tags: ['ML', 'patterns', 'AI', 'optimization'],
      createdAt: new Date('2024-01-20'),
      modifiedAt: new Date('2024-01-20'),
    },
    searchableText: 'Machine learning models can detect patterns in user behavior for UI optimization. ML patterns AI optimization',
    embedding: null,
  },
  {
    id: uuidv4(),
    type: 'note',
    content: 'The Model Context Protocol (MCP) enables AI systems to access external tools and data.',
    metadata: {
      title: 'Model Context Protocol',
      tags: ['MCP', 'AI', 'protocols', 'integration'],
      createdAt: new Date('2024-01-21'),
      modifiedAt: new Date('2024-01-21'),
    },
    searchableText: 'The Model Context Protocol (MCP) enables AI systems to access external tools and data. MCP AI protocols integration',
    embedding: null,
  },
  {
    id: uuidv4(),
    type: 'note',
    content: 'TypeScript provides type safety for large-scale JavaScript applications.',
    metadata: {
      title: 'TypeScript Benefits',
      tags: ['TypeScript', 'JavaScript', 'programming'],
      createdAt: new Date('2024-01-22'),
      modifiedAt: new Date('2024-01-22'),
    },
    searchableText: 'TypeScript provides type safety for large-scale JavaScript applications. TypeScript JavaScript programming',
    embedding: null,
  },
  {
    id: uuidv4(),
    type: 'note',
    content: 'React hooks enable functional components to manage state and side effects.',
    metadata: {
      title: 'React Hooks',
      tags: ['React', 'JavaScript', 'frontend'],
      createdAt: new Date('2024-01-23'),
      modifiedAt: new Date('2024-01-23'),
    },
    searchableText: 'React hooks enable functional components to manage state and side effects. React JavaScript frontend',
    embedding: null,
  },
  {
    id: uuidv4(),
    type: 'note',
    content: 'SQLite is a lightweight database perfect for embedded applications.',
    metadata: {
      title: 'SQLite Database',
      tags: ['database', 'SQLite', 'storage'],
      createdAt: new Date('2024-01-24'),
      modifiedAt: new Date('2024-01-24'),
    },
    searchableText: 'SQLite is a lightweight database perfect for embedded applications. database SQLite storage',
    embedding: null,
  },
];

export function createSampleConnections(nodes: KnowledgeNode[]): Connection[] {
  const connections: Connection[] = [];
  
  // Helper to find node by title
  const findNode = (title: string) => nodes.find(n => n.metadata.title === title);
  
  // Create meaningful connections
  const connectionPairs = [
    ['AI Ethics', 'Self-Evolving UIs', 'semantic'],
    ['AI Ethics', 'ML Pattern Detection', 'semantic'],
    ['Self-Evolving UIs', 'ML Pattern Detection', 'semantic'],
    ['Self-Evolving UIs', 'React Hooks', 'semantic'],
    ['Gopher Protocol', 'Telnet BBS', 'temporal'],
    ['Gopher Protocol', 'Model Context Protocol', 'semantic'],
    ['Knowledge Graphs', 'SQLite Database', 'semantic'],
    ['TypeScript Benefits', 'React Hooks', 'semantic'],
    ['Model Context Protocol', 'TypeScript Benefits', 'semantic'],
    ['ML Pattern Detection', 'Knowledge Graphs', 'semantic'],
  ];
  
  connectionPairs.forEach(([source, target, type]) => {
    const sourceNode = findNode(source);
    const targetNode = findNode(target);
    
    if (sourceNode && targetNode) {
      connections.push({
        id: uuidv4(),
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        type: type as 'semantic' | 'temporal' | 'manual',
        confidence: 0.75 + Math.random() * 0.2, // 0.75-0.95
        metadata: {
          discoveredAt: new Date(),
          reason: `${type} similarity detected`,
        },
      });
    }
  });
  
  return connections;
}
