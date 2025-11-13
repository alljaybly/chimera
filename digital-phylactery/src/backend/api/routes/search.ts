import { Router, Request, Response } from 'express';
import { SearchEngine } from '../../search/SearchEngine.js';
import { SearchQuery, ApiResponse, PaginatedResponse, SearchResult } from '../../../shared/types/index.js';
import { getDatabaseManager } from '../../database/DatabaseManager.js';

const router = Router();

/**
 * GET /api/search
 * Search knowledge nodes with filters
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { text, types, dateStart, dateEnd, tags, limit, offset } = req.query;

    // Build search query
    const searchQuery: SearchQuery = {};

    // Parse text query
    if (text && typeof text === 'string') {
      searchQuery.text = text.trim();
    }

    // Parse types filter
    if (types) {
      const typeArray = typeof types === 'string' ? types.split(',') : types;
      const validTypes = (typeArray as string[]).filter(t => 
        ['note', 'image', 'webpage'].includes(t)
      ) as Array<'note' | 'image' | 'webpage'>;
      
      if (validTypes.length > 0) {
        searchQuery.types = validTypes;
      }
    }

    // Parse date range
    if (dateStart || dateEnd) {
      const dateRange: { start?: Date; end?: Date } = {};
      
      if (dateStart && typeof dateStart === 'string') {
        try {
          dateRange.start = new Date(dateStart);
          if (isNaN(dateRange.start!.getTime())) {
            return res.status(400).json({
              success: false,
              error: 'Invalid dateStart format. Use ISO 8601 format.'
            } as ApiResponse<never>);
          }
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid dateStart format'
          } as ApiResponse<never>);
        }
      }
      
      if (dateEnd && typeof dateEnd === 'string') {
        try {
          dateRange.end = new Date(dateEnd);
          if (isNaN(dateRange.end!.getTime())) {
            return res.status(400).json({
              success: false,
              error: 'Invalid dateEnd format. Use ISO 8601 format.'
            } as ApiResponse<never>);
          }
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid dateEnd format'
          } as ApiResponse<never>);
        }
      }
      
      // Only set dateRange if we have at least one date
      if (dateRange.start || dateRange.end) {
        searchQuery.dateRange = {
          start: dateRange.start,
          end: dateRange.end
        };
      }
    }

    // Parse tags filter
    if (tags) {
      const tagArray = typeof tags === 'string' ? tags.split(',') : tags;
      searchQuery.tags = (tagArray as string[]).map(t => t.trim()).filter(t => t.length > 0);
    }

    // Parse pagination parameters
    const limitNum = limit ? parseInt(limit as string) : 50;
    const offsetNum = offset ? parseInt(offset as string) : 0;

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 100.'
      } as ApiResponse<never>);
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid offset. Must be >= 0.'
      } as ApiResponse<never>);
    }

    // Execute search
    const dbManager = getDatabaseManager();
    const db = dbManager.getDatabase();
    const searchEngine = new SearchEngine(db);

    const results = searchEngine.search(searchQuery, limitNum, offsetNum);
    const total = searchEngine.count(searchQuery);

    return res.json({
      success: true,
      data: {
        items: results,
        total,
        limit: limitNum,
        offset: offsetNum
      } as PaginatedResponse<SearchResult>
    } as ApiResponse<PaginatedResponse<SearchResult>>);
  } catch (error) {
    console.error('Error executing search:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
});

export default router;
