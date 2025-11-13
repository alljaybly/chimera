/**
 * Integration tests for Telnet BBS Adapter
 * 
 * Tests the Telnet adapter with test BBS systems.
 * These are integration tests that may require network access.
 */

import { describe, it, expect } from 'vitest';
import {
  TelnetBBSAdapter,
  stripAnsiCodes,
  parseAnsiColors,
  hasAnsiCodes,
  formatBBSContent,
} from './telnet-adapter.js';

describe('TelnetBBSAdapter Integration Tests', () => {
  const adapter = new TelnetBBSAdapter();

  describe('Host Validation', () => {
    it('should validate correct hostnames', () => {
      expect(adapter.isValidHost('bbs.example.com')).toBe(true);
      expect(adapter.isValidHost('telnet.example.org')).toBe(true);
      expect(adapter.isValidHost('bbs-server.net')).toBe(true);
      expect(adapter.isValidHost('localhost')).toBe(true);
    });

    it('should validate IP addresses', () => {
      expect(adapter.isValidHost('192.168.1.1')).toBe(true);
      expect(adapter.isValidHost('10.0.0.1')).toBe(true);
      expect(adapter.isValidHost('127.0.0.1')).toBe(true);
    });

    it('should reject invalid hosts', () => {
      expect(adapter.isValidHost('')).toBe(false);
      expect(adapter.isValidHost('   ')).toBe(false);
      expect(adapter.isValidHost('invalid host with spaces')).toBe(false);
      expect(adapter.isValidHost('http://example.com')).toBe(false);
    });
  });

  describe('Port Validation', () => {
    it('should validate correct port numbers', () => {
      expect(adapter.isValidPort(23)).toBe(true);
      expect(adapter.isValidPort(80)).toBe(true);
      expect(adapter.isValidPort(8080)).toBe(true);
      expect(adapter.isValidPort(1)).toBe(true);
      expect(adapter.isValidPort(65535)).toBe(true);
    });

    it('should reject invalid port numbers', () => {
      expect(adapter.isValidPort(0)).toBe(false);
      expect(adapter.isValidPort(-1)).toBe(false);
      expect(adapter.isValidPort(65536)).toBe(false);
      expect(adapter.isValidPort(100000)).toBe(false);
      expect(adapter.isValidPort(3.14)).toBe(false);
      expect(adapter.isValidPort(NaN)).toBe(false);
    });
  });

  describe('ANSI Code Handling', () => {
    it('should detect ANSI codes in text', () => {
      const textWithAnsi = '\x1B[31mRed Text\x1B[0m';
      expect(hasAnsiCodes(textWithAnsi)).toBe(true);
    });

    it('should detect no ANSI codes in plain text', () => {
      const plainText = 'Plain text without codes';
      expect(hasAnsiCodes(plainText)).toBe(false);
    });

    it('should strip ANSI codes from text', () => {
      const textWithAnsi = '\x1B[31mRed\x1B[0m \x1B[32mGreen\x1B[0m';
      const stripped = stripAnsiCodes(textWithAnsi);
      expect(stripped).toBe('Red Green');
      expect(hasAnsiCodes(stripped)).toBe(false);
    });

    it('should parse ANSI color codes to readable labels', () => {
      const textWithColors = '\x1B[31mRed\x1B[0m \x1B[32mGreen\x1B[0m';
      const parsed = parseAnsiColors(textWithColors);
      expect(parsed).toContain('[RED]');
      expect(parsed).toContain('[RESET]');
      expect(parsed).toContain('[GREEN]');
    });

    it('should handle complex ANSI sequences', () => {
      const complexAnsi = '\x1B[1;31mBold Red\x1B[0m \x1B[4;32mUnderline Green\x1B[0m';
      const stripped = stripAnsiCodes(complexAnsi);
      expect(stripped).toBe('Bold Red Underline Green');
    });

    it('should handle text with no ANSI codes', () => {
      const plainText = 'No ANSI codes here';
      expect(stripAnsiCodes(plainText)).toBe(plainText);
      expect(parseAnsiColors(plainText)).toBe(plainText);
    });
  });

  describe('BBS Content Formatting', () => {
    it('should normalize line endings', () => {
      const content = 'Line 1\r\nLine 2\rLine 3\nLine 4';
      const formatted = formatBBSContent(content);
      expect(formatted).toBe('Line 1\nLine 2\nLine 3\nLine 4');
    });

    it('should strip ANSI codes when requested', () => {
      const content = '\x1B[31mRed Text\x1B[0m\r\n\x1B[32mGreen Text\x1B[0m';
      const formatted = formatBBSContent(content, true);
      expect(formatted).toBe('Red Text\nGreen Text');
      expect(hasAnsiCodes(formatted)).toBe(false);
    });

    it('should preserve ANSI codes as labels when not stripping', () => {
      const content = '\x1B[31mRed Text\x1B[0m';
      const formatted = formatBBSContent(content, false);
      expect(formatted).toContain('[RED]');
      expect(formatted).toContain('[RESET]');
    });

    it('should remove excessive blank lines', () => {
      const content = 'Line 1\n\n\n\n\nLine 2';
      const formatted = formatBBSContent(content);
      expect(formatted).toBe('Line 1\n\nLine 2');
    });

    it('should trim whitespace', () => {
      const content = '   \n\n  Content  \n\n   ';
      const formatted = formatBBSContent(content);
      expect(formatted).toBe('Content');
    });
  });

  describe('BBS Connection', () => {
    it('should handle connection to non-existent BBS', async () => {
      // Try to connect to a non-existent server
      await expect(
        adapter.connect('nonexistent-bbs-12345.invalid', 23)
      ).rejects.toThrow(/Failed to connect/);
    }, 15000);

    it('should handle connection timeout', async () => {
      // Try to connect to a non-routable IP to trigger timeout
      await expect(
        adapter.connect('192.0.2.1', 23, { timeout: 3000 })
      ).rejects.toThrow(/Failed to connect/);
    }, 15000);

    it('should handle invalid port gracefully', async () => {
      // The validation should happen before connection attempt
      expect(adapter.isValidPort(99999)).toBe(false);
    });

    // Note: Testing with a real BBS requires a known, stable test BBS
    // Most public BBS systems are unreliable or require authentication
    // This test is commented out but can be enabled if you have a test BBS
    /*
    it('should connect to a test BBS', async () => {
      try {
        // Example: Connect to a known public BBS (if available)
        const response = await adapter.connect('bbs.example.com', 23);
        
        expect(response).toBeDefined();
        expect(response.host).toBe('bbs.example.com');
        expect(response.port).toBe(23);
        expect(response.content).toBeTruthy();
        expect(typeof response.hasAnsiCodes).toBe('boolean');
      } catch (error) {
        console.warn('BBS unreachable, skipping live test:', error);
        expect(error).toBeDefined();
      }
    }, 20000);
    */
  });

  describe('Adapter Configuration', () => {
    it('should use default timeout', () => {
      const defaultAdapter = new TelnetBBSAdapter();
      expect(defaultAdapter).toBeDefined();
    });

    it('should accept custom timeout', () => {
      const customAdapter = new TelnetBBSAdapter({ timeout: 5000 });
      expect(customAdapter).toBeDefined();
    });

    it('should accept custom stripAnsi setting', () => {
      const noStripAdapter = new TelnetBBSAdapter({ stripAnsi: false });
      expect(noStripAdapter).toBeDefined();
    });

    it('should use custom options in connect', async () => {
      const adapter = new TelnetBBSAdapter({ timeout: 2000 });
      
      await expect(
        adapter.connect('192.0.2.1', 23)
      ).rejects.toThrow();
    }, 15000);
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const formatted = formatBBSContent('');
      expect(formatted).toBe('');
    });

    it('should handle content with only whitespace', () => {
      const formatted = formatBBSContent('   \n\n   \r\n   ');
      expect(formatted).toBe('');
    });

    it('should handle content with only ANSI codes', () => {
      const formatted = formatBBSContent('\x1B[31m\x1B[0m\x1B[32m\x1B[0m');
      expect(formatted).toBe('');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(100000);
      const formatted = formatBBSContent(longContent);
      expect(formatted.length).toBe(100000);
    });
  });
});
