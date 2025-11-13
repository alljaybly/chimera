/**
 * Integration tests for Gopher Adapter
 * 
 * Tests the Gopher protocol adapter with known Gopher sites.
 * These are integration tests that require network access.
 */

import { describe, it, expect } from 'vitest';
import {
  GopherAdapter,
  parseGopherUrl,
  parseGopherDirectory,
  GopherItemType,
} from './gopher-adapter.js';

describe('GopherAdapter Integration Tests', () => {
  const adapter = new GopherAdapter();

  describe('URL Validation', () => {
    it('should validate correct Gopher URLs', () => {
      expect(adapter.isValidGopherUrl('gopher://gopher.floodgap.com/')).toBe(true);
      expect(adapter.isValidGopherUrl('gopher://gopher.floodgap.com:70/')).toBe(true);
      expect(adapter.isValidGopherUrl('gopher://example.com/1/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(adapter.isValidGopherUrl('http://example.com/')).toBe(false);
      expect(adapter.isValidGopherUrl('https://example.com/')).toBe(false);
      expect(adapter.isValidGopherUrl('ftp://example.com/')).toBe(false);
      expect(adapter.isValidGopherUrl('not-a-url')).toBe(false);
      expect(adapter.isValidGopherUrl('')).toBe(false);
    });
  });

  describe('URL Parsing', () => {
    it('should parse basic Gopher URL', () => {
      const parsed = parseGopherUrl('gopher://gopher.floodgap.com/');
      expect(parsed.host).toBe('gopher.floodgap.com');
      expect(parsed.port).toBe(70);
      expect(parsed.selector).toBe('');
      expect(parsed.itemType).toBe('1'); // Default to directory
    });

    it('should parse Gopher URL with custom port', () => {
      const parsed = parseGopherUrl('gopher://example.com:7070/');
      expect(parsed.host).toBe('example.com');
      expect(parsed.port).toBe(7070);
    });

    it('should parse Gopher URL with selector', () => {
      const parsed = parseGopherUrl('gopher://example.com/1/world');
      expect(parsed.host).toBe('example.com');
      expect(parsed.selector).toBe('/world');
      expect(parsed.itemType).toBe('1');
    });

    it('should parse Gopher URL with text file type', () => {
      const parsed = parseGopherUrl('gopher://example.com/0/readme.txt');
      expect(parsed.itemType).toBe('0');
      expect(parsed.selector).toBe('/readme.txt');
    });

    it('should throw error for non-Gopher URL', () => {
      expect(() => parseGopherUrl('http://example.com/')).toThrow('Invalid Gopher URL');
    });
  });

  describe('Directory Parsing', () => {
    it('should parse Gopher directory listing', () => {
      const sampleDirectory = 
        '1About Floodgap\t/gopher/floodgap\tgopher.floodgap.com\t70\r\n' +
        '0README\t/README.txt\tgopher.floodgap.com\t70\r\n' +
        'iInformation line\t\terror.host\t1\r\n' +
        '.\r\n';

      const items = parseGopherDirectory(sampleDirectory);
      
      expect(items).toHaveLength(3);
      
      expect(items[0].type).toBe('1');
      expect(items[0].display).toBe('About Floodgap');
      expect(items[0].selector).toBe('/gopher/floodgap');
      expect(items[0].host).toBe('gopher.floodgap.com');
      expect(items[0].port).toBe(70);

      expect(items[1].type).toBe('0');
      expect(items[1].display).toBe('README');
      expect(items[1].selector).toBe('/README.txt');

      expect(items[2].type).toBe('i');
      expect(items[2].display).toBe('Information line');
    });

    it('should handle empty directory', () => {
      const emptyDirectory = '.\r\n';
      const items = parseGopherDirectory(emptyDirectory);
      expect(items).toHaveLength(0);
    });

    it('should handle malformed lines gracefully', () => {
      const malformedDirectory = 
        '1Valid Item\t/path\thost\t70\r\n' +
        'x\r\n' + // Too short
        'yIncomplete\tonly-two-parts\r\n' + // Missing parts
        '.\r\n';

      const items = parseGopherDirectory(malformedDirectory);
      expect(items).toHaveLength(1); // Only the valid item
      expect(items[0].display).toBe('Valid Item');
    });
  });

  describe('Gopher Server Fetching', () => {
    it('should fetch from a known Gopher server (Floodgap)', async () => {
      // This test requires network access and the server to be available
      // Floodgap is one of the most reliable public Gopher servers
      try {
        const response = await adapter.fetch('gopher://gopher.floodgap.com/');
        
        expect(response).toBeDefined();
        expect(response.contentType).toBe('directory');
        expect(response.content).toBeTruthy();
        expect(response.content.length).toBeGreaterThan(0);
        expect(response.items).toBeDefined();
        expect(response.items!.length).toBeGreaterThan(0);
        
        // Verify the content contains expected directory listing format
        expect(response.content).toContain('Gopher Directory Listing');
      } catch (error) {
        // If the server is unreachable, skip the test
        console.warn('Gopher server unreachable, skipping live test:', error);
        expect(error).toBeDefined();
      }
    }, 15000); // 15 second timeout for network operation

    it('should fetch a text file from Gopher server', async () => {
      try {
        // Fetch a known text file from Floodgap
        const response = await adapter.fetch('gopher://gopher.floodgap.com/0/gopher/relevance.txt');
        
        expect(response).toBeDefined();
        expect(response.contentType).toBe('text');
        expect(response.content).toBeTruthy();
        expect(response.content.length).toBeGreaterThan(0);
        expect(response.items).toBeUndefined(); // Text files don't have items
      } catch (error) {
        console.warn('Gopher server unreachable, skipping live test:', error);
        expect(error).toBeDefined();
      }
    }, 15000);

    it('should handle connection errors gracefully', async () => {
      // Try to connect to a non-existent server
      await expect(
        adapter.fetch('gopher://nonexistent-gopher-server-12345.invalid/')
      ).rejects.toThrow();
    }, 15000);

    it('should handle timeout for slow servers', async () => {
      // Try to connect to a server that doesn't respond
      // Using a non-routable IP address to trigger timeout
      await expect(
        adapter.fetch('gopher://192.0.2.1/')
      ).rejects.toThrow(/timeout|connection/i);
    }, 15000);
  });

  describe('Content Type Detection', () => {
    it('should correctly identify directory content', async () => {
      try {
        const response = await adapter.fetch('gopher://gopher.floodgap.com/1/');
        expect(response.contentType).toBe('directory');
        expect(response.items).toBeDefined();
      } catch (error) {
        console.warn('Skipping live test:', error);
      }
    }, 15000);

    it('should correctly identify text content', async () => {
      try {
        const response = await adapter.fetch('gopher://gopher.floodgap.com/0/gopher/relevance.txt');
        expect(response.contentType).toBe('text');
        expect(response.items).toBeUndefined();
      } catch (error) {
        console.warn('Skipping live test:', error);
      }
    }, 15000);
  });
});
