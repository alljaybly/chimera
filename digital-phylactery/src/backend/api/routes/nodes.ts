import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ContentIngestionEngine } from '../../ingestion/ContentIngestionEngine.js';
import { KnowledgeNodeRepository } from '../../database/repositories/KnowledgeNodeRepository.js';
import { ApiResponse } from '../../../shared/types/index.js';
import { getDatabaseManager } from '../../database/DatabaseManager.js';
import { validateContentType, validateUrl, validateUuid, validatePagination } from '../middleware/validation.js';

const router = Router();

// Configure multer for file uploads (10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * POST /api/nodes
 * Create a new knowledge node (note, image, or webpage)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, content, metadata } = req.body;

    // Validate required fields
    if (!type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type and content'
      } as ApiResponse<never>);
    }

    // Validate type
    const typeValidation = validateContentType(type);
    if (!typeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: typeValidation.error
      } as ApiResponse<never>);
    }

    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const nodeRepository = new KnowledgeNodeRepository(db);
    const ingestionEngine = new ContentIngestionEngine();

    let node;

    // Handle different content types
    switch (type) {
      case 'note':
        node = await ingestionEngine.ingestNote(content, metadata);
        break;
      case 'image':
        return res.status(400).json({
          success: false,
          error: 'Use POST /api/nodes/upload for image uploads'
        } as ApiResponse<never>);
      case 'webpage':
        // Validate URL
        const urlValidation = validateUrl(content);
        if (!urlValidation.valid) {
          return res.status(400).json({
            success: false,
            error: urlValidation.error
          } as ApiResponse<never>);
        }

        node = await ingestionEngine.ingestWebPage(content, metadata);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported content type'
        } as ApiResponse<never>);
    }

    // Store in database
    nodeRepository.create(node);

    return res.status(201).json({
      success: true,
      data: node,
      message: 'Knowledge node created successfully'
    } as ApiResponse<typeof node>);
  } catch (error) {
    console.error('Error creating knowledge node:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/nodes/:id
 * Get a specific knowledge node by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID format
    const idValidation = validateUuid(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: idValidation.error
      } as ApiResponse<never>);
    }

    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const nodeRepository = new KnowledgeNodeRepository(db);

    const node = nodeRepository.findById(id);

    if (!node) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge node not found'
      } as ApiResponse<never>);
    }

    return res.json({
      success: true,
      data: node
    } as ApiResponse<typeof node>);
  } catch (error) {
    console.error('Error fetching knowledge node:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/nodes
 * List/search knowledge nodes with optional filters
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { type, limit, offset } = req.query;

    // Validate pagination
    const paginationValidation = validatePagination(limit, offset);
    if (!paginationValidation.valid) {
      return res.status(400).json({
        success: false,
        error: paginationValidation.error
      } as ApiResponse<never>);
    }

    // Validate type if provided
    if (type) {
      const typeValidation = validateContentType(type as string);
      if (!typeValidation.valid) {
        return res.status(400).json({
          success: false,
          error: typeValidation.error
        } as ApiResponse<never>);
      }
    }

    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const nodeRepository = new KnowledgeNodeRepository(db);

    const filters: any = {};
    if (type) filters.type = type as string;
    filters.limit = paginationValidation.limit;
    filters.offset = paginationValidation.offset;

    const nodes = nodeRepository.findAll(filters);

    // Return nodes array directly in data field for frontend compatibility
    return res.json({
      success: true,
      data: nodes
    });
  } catch (error) {
    console.error('Error listing knowledge nodes:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

export default router;


/**
 * POST /api/nodes/upload
 * Upload an image file
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      } as ApiResponse<never>);
    }

    // Parse metadata if provided
    let metadata;
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid metadata JSON'
        } as ApiResponse<never>);
      }
    }

    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const nodeRepository = new KnowledgeNodeRepository(db);
    const ingestionEngine = new ContentIngestionEngine();

    // Ingest the image
    const node = await ingestionEngine.ingestImage(
      req.file.buffer,
      req.file.originalname,
      metadata
    );

    // Store in database
    nodeRepository.create(node);

    return res.status(201).json({
      success: true,
      data: node,
      message: 'Image uploaded successfully'
    } as ApiResponse<typeof node>);
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});
