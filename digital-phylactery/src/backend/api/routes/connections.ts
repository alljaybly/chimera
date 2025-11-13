import { Router, Request, Response } from 'express';
import { ConnectionRepository } from '../../database/repositories/ConnectionRepository.js';
import { ApiResponse, Connection } from '../../../shared/types/index.js';
import { getDatabaseManager } from '../../database/DatabaseManager.js';
import { v4 as uuidv4 } from 'uuid';
import { validateUuid } from '../middleware/validation.js';

const router = Router();

/**
 * GET /api/connections
 * Get all connections
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const connectionRepository = new ConnectionRepository(db);

    const connections = connectionRepository.findAll();

    return res.json({
      success: true,
      data: connections
    } as ApiResponse<Connection[]>);
  } catch (error) {
    console.error('Error fetching connections:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/connections/:nodeId
 * Get all connections for a specific node
 */
router.get('/:nodeId', (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;

    // Validate node ID
    const idValidation = validateUuid(nodeId);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: idValidation.error
      } as ApiResponse<never>);
    }

    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const connectionRepository = new ConnectionRepository(db);

    const connections = connectionRepository.findByNodeId(nodeId);

    return res.json({
      success: true,
      data: connections
    } as ApiResponse<Connection[]>);
  } catch (error) {
    console.error('Error fetching node connections:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

/**
 * POST /api/connections
 * Create a manual connection between two nodes
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { sourceNodeId, targetNodeId, type } = req.body;

    // Validate required fields
    if (!sourceNodeId || !targetNodeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceNodeId and targetNodeId'
      } as ApiResponse<never>);
    }

    // Validate source node ID
    const sourceValidation = validateUuid(sourceNodeId);
    if (!sourceValidation.valid) {
      return res.status(400).json({
        success: false,
        error: `Invalid sourceNodeId: ${sourceValidation.error}`
      } as ApiResponse<never>);
    }

    // Validate target node ID
    const targetValidation = validateUuid(targetNodeId);
    if (!targetValidation.valid) {
      return res.status(400).json({
        success: false,
        error: `Invalid targetNodeId: ${targetValidation.error}`
      } as ApiResponse<never>);
    }

    // Validate nodes are different
    if (sourceNodeId === targetNodeId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create connection to the same node'
      } as ApiResponse<never>);
    }

    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const connectionRepository = new ConnectionRepository(db);

    // Check if connection already exists
    const existingConnections = connectionRepository.findByNodeId(sourceNodeId);
    const connectionExists = existingConnections.some(
      conn => 
        (conn.sourceNodeId === sourceNodeId && conn.targetNodeId === targetNodeId) ||
        (conn.sourceNodeId === targetNodeId && conn.targetNodeId === sourceNodeId)
    );

    if (connectionExists) {
      return res.status(400).json({
        success: false,
        error: 'Connection already exists between these nodes'
      } as ApiResponse<never>);
    }

    // Create new connection
    const connection: Connection = {
      id: uuidv4(),
      sourceNodeId,
      targetNodeId,
      type: type || 'manual',
      confidence: 1.0, // Manual connections always have confidence 1.0
      metadata: {
        discoveredAt: new Date(),
        reason: 'Manually created by user'
      }
    };

    connectionRepository.create(connection);

    return res.status(201).json({
      success: true,
      data: connection,
      message: 'Connection created successfully'
    } as ApiResponse<Connection>);
  } catch (error) {
    console.error('Error creating connection:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

/**
 * DELETE /api/connections/:id
 * Delete a connection
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate connection ID
    const idValidation = validateUuid(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: idValidation.error
      } as ApiResponse<never>);
    }

    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const connectionRepository = new ConnectionRepository(db);

    // Check if connection exists
    const connection = connectionRepository.findById(id);
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      } as ApiResponse<never>);
    }

    connectionRepository.delete(id);

    return res.json({
      success: true,
      message: 'Connection deleted successfully'
    } as ApiResponse<never>);
  } catch (error) {
    console.error('Error deleting connection:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

export default router;
