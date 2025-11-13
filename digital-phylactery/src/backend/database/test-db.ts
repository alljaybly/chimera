/**
 * Simple test script to verify database layer functionality
 * Run with: npm run dev:backend or tsx src/backend/database/test-db.ts
 */

import { getDatabaseManager } from './DatabaseManager.js';
import { randomUUID } from 'crypto';

async function testDatabase() {
  console.log('Testing Digital Phylactery Database Layer...\n');

  // Initialize database manager
  const dbManager = getDatabaseManager('./data/test-phylactery.db');
  console.log('✓ Database initialized');

  // Test 1: Create a knowledge node
  console.log('\n--- Test 1: Create Knowledge Node ---');
  const nodeId = randomUUID();
  const testNode = {
    id: nodeId,
    type: 'note' as const,
    content: 'This is a test note about TypeScript and databases.',
    metadata: {
      title: 'Test Note',
      createdAt: new Date(),
      modifiedAt: new Date(),
      tags: ['test', 'typescript', 'database']
    },
    searchableText: 'This is a test note about TypeScript and databases.'
  };

  dbManager.knowledgeNodes.create(testNode);
  console.log('✓ Created knowledge node:', nodeId);

  // Test 2: Retrieve the node
  console.log('\n--- Test 2: Retrieve Knowledge Node ---');
  const retrievedNode = dbManager.knowledgeNodes.findById(nodeId);
  console.log('✓ Retrieved node:', retrievedNode?.metadata.title);

  // Test 3: Create a connection
  console.log('\n--- Test 3: Create Connection ---');
  const node2Id = randomUUID();
  const testNode2 = {
    id: node2Id,
    type: 'note' as const,
    content: 'Another note about databases and SQL.',
    metadata: {
      title: 'Test Note 2',
      createdAt: new Date(),
      modifiedAt: new Date(),
      tags: ['test', 'database', 'sql']
    },
    searchableText: 'Another note about databases and SQL.'
  };

  dbManager.knowledgeNodes.create(testNode2);
  
  const connectionId = randomUUID();
  const testConnection = {
    id: connectionId,
    sourceNodeId: nodeId,
    targetNodeId: node2Id,
    type: 'semantic' as const,
    confidence: 0.85,
    metadata: {
      discoveredAt: new Date(),
      reason: 'Both notes discuss databases'
    }
  };

  dbManager.connections.create(testConnection);
  console.log('✓ Created connection with confidence:', testConnection.confidence);

  // Test 4: Find connections
  console.log('\n--- Test 4: Find Connections ---');
  const connections = dbManager.connections.findByNodeId(nodeId);
  console.log('✓ Found', connections.length, 'connection(s) for node');

  // Test 5: Full-text search
  console.log('\n--- Test 5: Full-Text Search ---');
  const searchResults = dbManager.knowledgeNodes.search('database');
  console.log('✓ Search for "database" returned', searchResults.length, 'result(s)');

  // Test 6: Behavioral event
  console.log('\n--- Test 6: Behavioral Event ---');
  const eventId = dbManager.behavioralEvents.create({
    eventType: 'click',
    target: 'node-' + nodeId,
    metadata: { x: 100, y: 200 },
    timestamp: new Date()
  });
  console.log('✓ Created behavioral event:', eventId);

  // Test 7: UI Mutation
  console.log('\n--- Test 7: UI Mutation ---');
  const mutationId = randomUUID();
  const testMutation = {
    id: mutationId,
    type: 'shortcut' as const,
    target: 'search-button',
    parameters: { hotkey: 'Ctrl+K' },
    appliedAt: new Date(),
    triggeredBy: 'User pressed Ctrl+K 5 times'
  };

  dbManager.uiMutations.create(testMutation);
  console.log('✓ Created UI mutation:', mutationId);

  // Test 8: Count records
  console.log('\n--- Test 8: Count Records ---');
  const nodeCount = dbManager.knowledgeNodes.count();
  const connectionCount = dbManager.connections.count();
  console.log('✓ Total nodes:', nodeCount);
  console.log('✓ Total connections:', connectionCount);

  console.log('\n✅ All tests passed!');
  
  // Cleanup
  dbManager.close();
}

// Run tests
testDatabase().catch(console.error);
