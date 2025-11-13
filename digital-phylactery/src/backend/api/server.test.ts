import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { getDatabaseManager, closeDatabaseManager } from '../database/DatabaseManager.js';
import nodesRouter from './routes/nodes.js';
import connectionsRouter from './routes/connections.js';
import searchRouter from './routes/search.js';
import uiMutationsRouter from './routes/ui-mutations.js';
import { sanitizeRequest, validateJsonBody, validateFileSize } from './middleware/validation.js';
import cors from 'cors';

// Create test app
function createTestApp() {
  const app = express();
  
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(validateFileSize(10 * 1024 * 1024));
  app.use(validateJsonBody);
  app.use(sanitizeRequest);
  
  app.use('/api/nodes', nodesRouter);
  app.use('/api/connections', connectionsRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/ui-mutations', uiMutationsRouter);
  
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  
  return app;
}

describe('API Server Integration Tests', () => {
  let app: express.Application;
  let testNodeId: string;

  beforeEach(() => {
    // Initialize test database
    getDatabaseManager(':memory:');
    app = createTestApp();
  });

  afterEach(() => {
    closeDatabaseManager();
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('POST /api/nodes - Create Knowledge Node', () => {
    it('should create a note node', async () => {
      const response = await request(app)
        .post('/api/nodes')
        .send({
          type: 'note',
          content: 'This is a test note',
          metadata: {
            title: 'Test Note',
            tags: ['test']
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe('note');
      expect(response.body.data.id).toBeDefined();
      
      testNodeId = response.body.data.id;
    });

    it('should reject invalid content type', async () => {
      const response = await request(app)
        .post('/api/nodes')
        .send({
          type: 'invalid',
          content: 'Test content'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid content type');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/nodes')
        .send({
          type: 'note'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should reject invalid URL for webpage', async () => {
      const response = await request(app)
        .post('/api/nodes')
        .send({
          type: 'webpage',
          content: 'not-a-valid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/nodes/:id - Get Node by ID', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/nodes')
        .send({
          type: 'note',
          content: 'Test note for retrieval',
          metadata: { tags: [] }
        });
      testNodeId = response.body.data.id;
    });

    it('should retrieve a node by ID', async () => {
      const response = await request(app).get(`/api/nodes/${testNodeId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testNodeId);
    });

    it('should return 404 for non-existent node', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/nodes/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid UUID format', async () => {
      const response = await request(app).get('/api/nodes/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid ID format');
    });
  });

  describe('GET /api/nodes - List Nodes', () => {
    beforeEach(async () => {
      // Create multiple test nodes
      await request(app).post('/api/nodes').send({
        type: 'note',
        content: 'Note 1',
        metadata: { tags: [] }
      });
      await request(app).post('/api/nodes').send({
        type: 'note',
        content: 'Note 2',
        metadata: { tags: [] }
      });
    });

    it('should list all nodes', async () => {
      const response = await request(app).get('/api/nodes');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by type', async () => {
      const response = await request(app).get('/api/nodes?type=note');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items.every((n: any) => n.type === 'note')).toBe(true);
    });

    it('should respect pagination limits', async () => {
      const response = await request(app).get('/api/nodes?limit=1');

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeLessThanOrEqual(1);
      expect(response.body.data.limit).toBe(1);
    });

    it('should reject invalid pagination parameters', async () => {
      const response = await request(app).get('/api/nodes?limit=200');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/connections - Create Connection', () => {
    let sourceNodeId: string;
    let targetNodeId: string;

    beforeEach(async () => {
      const node1 = await request(app).post('/api/nodes').send({
        type: 'note',
        content: 'Source node',
        metadata: { tags: [] }
      });
      const node2 = await request(app).post('/api/nodes').send({
        type: 'note',
        content: 'Target node',
        metadata: { tags: [] }
      });
      sourceNodeId = node1.body.data.id;
      targetNodeId = node2.body.data.id;
    });

    it('should create a manual connection', async () => {
      const response = await request(app)
        .post('/api/connections')
        .send({
          sourceNodeId,
          targetNodeId,
          type: 'manual'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sourceNodeId).toBe(sourceNodeId);
      expect(response.body.data.targetNodeId).toBe(targetNodeId);
      expect(response.body.data.confidence).toBe(1.0);
    });

    it('should reject connection to same node', async () => {
      const response = await request(app)
        .post('/api/connections')
        .send({
          sourceNodeId,
          targetNodeId: sourceNodeId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('same node');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/connections')
        .send({
          sourceNodeId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid node IDs', async () => {
      const response = await request(app)
        .post('/api/connections')
        .send({
          sourceNodeId: 'invalid-id',
          targetNodeId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/connections/:nodeId - Get Node Connections', () => {
    let nodeId: string;

    beforeEach(async () => {
      const node = await request(app).post('/api/nodes').send({
        type: 'note',
        content: 'Node with connections',
        metadata: { tags: [] }
      });
      nodeId = node.body.data.id;
    });

    it('should get connections for a node', async () => {
      const response = await request(app).get(`/api/connections/${nodeId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject invalid node ID', async () => {
      const response = await request(app).get('/api/connections/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/connections/:id - Delete Connection', () => {
    let connectionId: string;

    beforeEach(async () => {
      const node1 = await request(app).post('/api/nodes').send({
        type: 'note',
        content: 'Node 1',
        metadata: { tags: [] }
      });
      const node2 = await request(app).post('/api/nodes').send({
        type: 'note',
        content: 'Node 2',
        metadata: { tags: [] }
      });
      
      const connection = await request(app).post('/api/connections').send({
        sourceNodeId: node1.body.data.id,
        targetNodeId: node2.body.data.id
      });
      connectionId = connection.body.data.id;
    });

    it('should delete a connection', async () => {
      const response = await request(app).delete(`/api/connections/${connectionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent connection', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).delete(`/api/connections/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/search - Search Nodes', () => {
    beforeEach(async () => {
      await request(app).post('/api/nodes').send({
        type: 'note',
        content: 'JavaScript programming tutorial',
        metadata: { tags: ['programming', 'javascript'] }
      });
      await request(app).post('/api/nodes').send({
        type: 'note',
        content: 'Python data science guide',
        metadata: { tags: ['programming', 'python'] }
      });
    });

    it('should search nodes by text', async () => {
      const response = await request(app).get('/api/search?text=JavaScript');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });

    it('should filter by content type', async () => {
      const response = await request(app).get('/api/search?types=note');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid date format', async () => {
      const response = await request(app).get('/api/search?dateStart=invalid-date');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should respect pagination', async () => {
      const response = await request(app).get('/api/search?limit=1');

      expect(response.status).toBe(200);
      expect(response.body.data.limit).toBe(1);
    });
  });

  describe('GET /api/ui-mutations - Get Mutation History', () => {
    it('should get mutation history', async () => {
      const response = await request(app).get('/api/ui-mutations');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/ui-mutations/revert - Revert UI State', () => {
    it('should revert to a historical state', async () => {
      const timestamp = new Date().toISOString();
      const response = await request(app)
        .post('/api/ui-mutations/revert')
        .send({ timestamp });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid timestamp', async () => {
      const response = await request(app)
        .post('/api/ui-mutations/revert')
        .send({ timestamp: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing timestamp', async () => {
      const response = await request(app)
        .post('/api/ui-mutations/revert')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown');

      expect(response.status).toBe(404);
    });

    it('should sanitize malicious input', async () => {
      const response = await request(app)
        .post('/api/nodes')
        .send({
          type: 'note',
          content: 'Test\0null\0byte',
          metadata: { tags: [] }
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).not.toContain('\0');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent node creations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app).post('/api/nodes').send({
          type: 'note',
          content: `Concurrent note ${i}`,
          metadata: { tags: [] }
        })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify all nodes were created
      const listResponse = await request(app).get('/api/nodes');
      expect(listResponse.body.data.items.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle concurrent connection creations', async () => {
      // Create nodes first
      const nodes = await Promise.all([
        request(app).post('/api/nodes').send({
          type: 'note',
          content: 'Node A',
          metadata: { tags: [] }
        }),
        request(app).post('/api/nodes').send({
          type: 'note',
          content: 'Node B',
          metadata: { tags: [] }
        }),
        request(app).post('/api/nodes').send({
          type: 'note',
          content: 'Node C',
          metadata: { tags: [] }
        })
      ]);

      const nodeIds = nodes.map(n => n.body.data.id);

      // Create connections concurrently
      const connectionPromises = [
        request(app).post('/api/connections').send({
          sourceNodeId: nodeIds[0],
          targetNodeId: nodeIds[1]
        }),
        request(app).post('/api/connections').send({
          sourceNodeId: nodeIds[1],
          targetNodeId: nodeIds[2]
        })
      ];

      const responses = await Promise.all(connectionPromises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
