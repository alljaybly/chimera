#!/usr/bin/env tsx

/**
 * Database seeding script
 * Run with: npm run seed
 */

import { getDatabaseManager } from './DatabaseManager.js';
import { sampleNodes, createSampleConnections } from './seed-data.js';

async function seed() {
  console.log('🌱 Seeding database with sample data...\n');
  
  try {
    const dbManager = getDatabaseManager();
    const nodeRepo = dbManager.knowledgeNodes;
    const connectionRepo = dbManager.connections;
    
    // Clear existing data
    console.log('Clearing existing data...');
    const existingNodes = nodeRepo.findAll();
    existingNodes.forEach(node => nodeRepo.delete(node.id));
    
    const existingConnections = connectionRepo.findAll();
    existingConnections.forEach(conn => connectionRepo.delete(conn.id));
    
    // Insert sample nodes
    console.log(`\n📝 Creating ${sampleNodes.length} knowledge nodes...`);
    sampleNodes.forEach(node => {
      nodeRepo.create(node);
      console.log(`  ✓ ${node.metadata.title}`);
    });
    
    // Create connections
    const connections = createSampleConnections(sampleNodes);
    console.log(`\n🔗 Creating ${connections.length} connections...`);
    connections.forEach(conn => {
      connectionRepo.create(conn);
      const sourceNode = sampleNodes.find(n => n.id === conn.sourceNodeId);
      const targetNode = sampleNodes.find(n => n.id === conn.targetNodeId);
      console.log(`  ✓ ${sourceNode?.metadata.title} → ${targetNode?.metadata.title}`);
    });
    
    // Summary
    console.log('\n✅ Database seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Nodes: ${sampleNodes.length}`);
    console.log(`   Connections: ${connections.length}`);
    console.log(`\n🚀 Start the server with: npm run dev:backend`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
