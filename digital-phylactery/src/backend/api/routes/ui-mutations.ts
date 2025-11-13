import { Router, Request, Response } from 'express';
import { UIMutationRepository } from '../../database/repositories/UIMutationRepository.js';
import { ApiResponse, UIMutation } from '../../../shared/types/index.js';
import { getDatabaseManager } from '../../database/DatabaseManager.js';
import { validateUuid, validateDate } from '../middleware/validation.js';

const router = Router();

/**
 * GET /api/ui-mutations
 * Get mutation history
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const mutationRepository = new UIMutationRepository(db);

    const mutations = mutationRepository.findAll();

    return res.json({
      success: true,
      data: mutations
    } as ApiResponse<UIMutation[]>);
  } catch (error) {
    console.error('Error fetching UI mutations:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/ui-mutations/:id
 * Get a specific UI mutation by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate mutation ID
    const idValidation = validateUuid(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: idValidation.error
      } as ApiResponse<never>);
    }

    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const mutationRepository = new UIMutationRepository(db);

    const mutation = mutationRepository.findById(id);

    if (!mutation) {
      return res.status(404).json({
        success: false,
        error: 'UI mutation not found'
      } as ApiResponse<never>);
    }

    return res.json({
      success: true,
      data: mutation
    } as ApiResponse<UIMutation>);
  } catch (error) {
    console.error('Error fetching UI mutation:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

/**
 * POST /api/ui-mutations/revert
 * Revert to a historical UI state
 */
router.post('/revert', (req: Request, res: Response) => {
  try {
    const { timestamp } = req.body;

    // Validate timestamp
    if (!timestamp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: timestamp'
      } as ApiResponse<never>);
    }

    const dateValidation = validateDate(timestamp);
    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        error: dateValidation.error
      } as ApiResponse<never>);
    }

    const targetDate = dateValidation.date!;

    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const mutationRepository = new UIMutationRepository(db);
    
    // Delete mutations after the target date
    mutationRepository.deleteAfterDate(targetDate);

    // Get the current state after revert
    const currentMutations = mutationRepository.findAll();

    return res.json({
      success: true,
      data: currentMutations,
      message: `Successfully reverted to state at ${targetDate.toISOString()}`
    } as ApiResponse<UIMutation[]>);
  } catch (error) {
    console.error('Error reverting UI state:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

/**
 * DELETE /api/ui-mutations/:id
 * Delete a specific UI mutation
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate mutation ID
    const idValidation = validateUuid(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: idValidation.error
      } as ApiResponse<never>);
    }

    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const mutationRepository = new UIMutationRepository(db);

    // Check if mutation exists
    const mutation = mutationRepository.findById(id);
    if (!mutation) {
      return res.status(404).json({
        success: false,
        error: 'UI mutation not found'
      } as ApiResponse<never>);
    }

    mutationRepository.delete(id);

    return res.json({
      success: true,
      message: 'UI mutation deleted successfully'
    } as ApiResponse<never>);
  } catch (error) {
    console.error('Error deleting UI mutation:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

export default router;
