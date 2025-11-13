import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../../shared/types/index.js';

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to prevent DoS
  if (sanitized.length > 100000) {
    sanitized = sanitized.substring(0, 100000);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  const sanitized = sanitizeString(url);
  
  try {
    const parsed = new URL(sanitized);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate content type
 */
export function validateContentType(type: string): { valid: boolean; error?: string } {
  const validTypes = ['note', 'image', 'webpage'];
  
  if (!type || typeof type !== 'string') {
    return { valid: false, error: 'Content type is required' };
  }
  
  if (!validTypes.includes(type)) {
    return { valid: false, error: `Invalid content type. Must be one of: ${validTypes.join(', ')}` };
  }
  
  return { valid: true };
}

/**
 * Validate UUID format
 */
export function validateUuid(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID is required' };
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(id)) {
    return { valid: false, error: 'Invalid ID format' };
  }
  
  return { valid: true };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(limit?: any, offset?: any): { 
  valid: boolean; 
  limit?: number; 
  offset?: number; 
  error?: string 
} {
  let limitNum = 50; // default
  let offsetNum = 0; // default
  
  if (limit !== undefined) {
    limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return { valid: false, error: 'Limit must be between 1 and 100' };
    }
  }
  
  if (offset !== undefined) {
    offsetNum = parseInt(offset);
    if (isNaN(offsetNum) || offsetNum < 0) {
      return { valid: false, error: 'Offset must be >= 0' };
    }
  }
  
  return { valid: true, limit: limitNum, offset: offsetNum };
}

/**
 * Validate date string
 */
export function validateDate(dateStr: string): { valid: boolean; date?: Date; error?: string } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { valid: false, error: 'Date is required' };
  }
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format. Use ISO 8601 format.' };
    }
    return { valid: true, date };
  } catch (error) {
    return { valid: false, error: 'Invalid date format' };
  }
}

/**
 * Validate tags array
 */
export function validateTags(tags: any): { valid: boolean; tags?: string[]; error?: string } {
  if (!tags) {
    return { valid: true, tags: [] };
  }
  
  if (!Array.isArray(tags)) {
    return { valid: false, error: 'Tags must be an array' };
  }
  
  // Validate each tag
  const sanitizedTags = tags
    .filter(tag => typeof tag === 'string')
    .map(tag => sanitizeString(tag))
    .filter(tag => tag.length > 0 && tag.length <= 50);
  
  if (sanitizedTags.length > 20) {
    return { valid: false, error: 'Maximum 20 tags allowed' };
  }
  
  return { valid: true, tags: sanitizedTags };
}

/**
 * Middleware to enforce file size limits
 */
export function validateFileSize(maxSize: number = 10 * 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        success: false,
        error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
      } as ApiResponse<never>);
    }
    
    next();
  };
}

/**
 * Middleware to validate JSON body
 */
export function validateJsonBody(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    
    if (contentType && contentType.includes('application/json')) {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON body'
        } as ApiResponse<never>);
      }
    }
  }
  
  next();
}

/**
 * Sanitize request body recursively
 */
export function sanitizeBody(body: any): any {
  if (typeof body === 'string') {
    return sanitizeString(body);
  }
  
  if (Array.isArray(body)) {
    return body.map(item => sanitizeBody(item));
  }
  
  if (body && typeof body === 'object') {
    const sanitized: any = {};
    for (const key in body) {
      if (body.hasOwnProperty(key)) {
        sanitized[key] = sanitizeBody(body[key]);
      }
    }
    return sanitized;
  }
  
  return body;
}

/**
 * Middleware to sanitize all request inputs
 */
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeBody(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    const sanitizedQuery: any = {};
    for (const key in req.query) {
      if (req.query.hasOwnProperty(key)) {
        const value = req.query[key];
        if (typeof value === 'string') {
          sanitizedQuery[key] = sanitizeString(value);
        } else {
          sanitizedQuery[key] = value;
        }
      }
    }
    req.query = sanitizedQuery;
  }
  
  next();
}
