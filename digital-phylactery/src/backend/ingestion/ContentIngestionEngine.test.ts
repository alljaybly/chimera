import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContentIngestionEngine } from './ContentIngestionEngine.js';
import { readFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

describe('ContentIngestionEngine', () => {
  let engine: ContentIngestionEngine;
  const testContentDir = join(process.cwd(), 'data', 'test-content');

  beforeEach(async () => {
    // Create test content directory
    if (!existsSync(testContentDir)) {
      await mkdir(testContentDir, { recursive: true });
    }
    engine = new ContentIngestionEngine(testContentDir);
  });

  afterEach(async () => {
    // Clean up test content directory
    if (existsSync(testContentDir)) {
      await rm(testContentDir, { recursive: true, force: true });
    }
  });

  describe('ingestNote', () => {
    it('should ingest a simple text note', async () => {
      const text = 'This is a test note';
      const node = await engine.ingestNote(text);

      expect(node).toBeDefined();
      expect(node.id).toBeDefined();
      expect(node.type).toBe('note');
      expect(node.content).toBe(text);
      expect(node.searchableText).toContain(text);
      expect(node.metadata.createdAt).toBeInstanceOf(Date);
      expect(node.metadata.modifiedAt).toBeInstanceOf(Date);
    });

    it('should extract title from first line', async () => {
      const text = 'My Note Title\nThis is the content of the note.';
      const node = await engine.ingestNote(text);

      expect(node.metadata.title).toBe('My Note Title');
    });

    it('should extract hashtags as tags', async () => {
      const text = 'This is a note about #javascript and #typescript';
      const node = await engine.ingestNote(text);

      expect(node.metadata.tags).toContain('javascript');
      expect(node.metadata.tags).toContain('typescript');
    });

    it('should use provided metadata', async () => {
      const text = 'Test note';
      const metadata = {
        title: 'Custom Title',
        tags: ['custom', 'tags'],
        source: 'test'
      };
      const node = await engine.ingestNote(text, metadata);

      expect(node.metadata.title).toBe('Custom Title');
      expect(node.metadata.tags).toEqual(['custom', 'tags']);
      expect(node.metadata.source).toBe('test');
    });

    it('should handle notes with special characters', async () => {
      const text = 'Note with special chars: @#$%^&*()';
      const node = await engine.ingestNote(text);

      expect(node.content).toBe(text);
      expect(node.searchableText).toContain(text);
    });

    it('should handle multiline notes', async () => {
      const text = 'Line 1\nLine 2\nLine 3\nLine 4';
      const node = await engine.ingestNote(text);

      expect(node.content).toBe(text);
      expect(node.type).toBe('note');
    });
  });

  describe('ingestImage', () => {
    it('should ingest an image file', async () => {
      // Create a minimal valid JPEG buffer (1x1 pixel)
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
        0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
        0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
        0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
        0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
        0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
        0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x03, 0xFF, 0xDA, 0x00, 0x08,
        0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x37, 0xFF,
        0xD9
      ]);

      const filename = 'test-image.jpg';
      const node = await engine.ingestImage(jpegBuffer, filename);

      expect(node).toBeDefined();
      expect(node.id).toBeDefined();
      expect(node.type).toBe('image');
      expect(node.content_path).toBeDefined();
      expect(node.metadata.title).toBe(filename);
      expect(node.searchableText).toContain(filename);

      // Verify file was saved
      if (node.content_path) {
        expect(existsSync(node.content_path)).toBe(true);
      }
    });

    it('should use provided metadata for images', async () => {
      const buffer = Buffer.from('fake-image-data');
      const filename = 'test.png';
      const metadata = {
        title: 'My Photo',
        tags: ['vacation', 'beach'],
        source: 'camera'
      };

      const node = await engine.ingestImage(buffer, filename, metadata);

      expect(node.metadata.title).toBe('My Photo');
      expect(node.metadata.tags).toEqual(['vacation', 'beach']);
      expect(node.metadata.source).toBe('camera');
    });

    it('should handle different image file extensions', async () => {
      const buffer = Buffer.from('fake-image-data');
      
      const pngNode = await engine.ingestImage(buffer, 'test.png');
      expect(pngNode.content_path).toContain('.png');

      const jpgNode = await engine.ingestImage(buffer, 'test.jpg');
      expect(jpgNode.content_path).toContain('.jpg');

      const gifNode = await engine.ingestImage(buffer, 'test.gif');
      expect(gifNode.content_path).toContain('.gif');
    });
  });

  describe('ingestWebPage', () => {
    it('should ingest a web page from URL', async () => {
      // This test requires network access and a real URL
      // Using a simple HTML page for testing
      const url = 'https://example.com';
      
      const node = await engine.ingestWebPage(url);

      expect(node).toBeDefined();
      expect(node.id).toBeDefined();
      expect(node.type).toBe('webpage');
      expect(node.metadata.source).toBe(url);
      expect(node.content).toBeDefined();
      expect(node.searchableText).toBeDefined();
    }, 60000); // 60 second timeout for network request

    it('should use provided metadata for web pages', async () => {
      const url = 'https://example.com';
      const metadata = {
        title: 'Custom Page Title',
        tags: ['reference', 'documentation']
      };

      const node = await engine.ingestWebPage(url, metadata);

      expect(node.metadata.title).toBe('Custom Page Title');
      expect(node.metadata.tags).toContain('reference');
      expect(node.metadata.tags).toContain('documentation');
    }, 60000);
  });
});
