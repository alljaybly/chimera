/**
 * Telnet BBS Adapter
 * 
 * Implements a client for connecting to Telnet-based Bulletin Board Systems (BBS).
 * Handles ANSI escape codes and text formatting common in BBS systems.
 */

import { Telnet } from 'telnet-client';

/**
 * ANSI escape code patterns for stripping or parsing
 */
const ANSI_ESCAPE_PATTERN = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
const ANSI_COLOR_PATTERN = /\x1B\[([0-9;]+)m/g;

/**
 * Configuration for BBS connection
 */
export interface TelnetBBSConfig {
  host: string;
  port: number;
  timeout?: number;
  negotiationMandatory?: boolean;
  stripAnsi?: boolean;
}

/**
 * Response from a BBS connection
 */
export interface TelnetBBSResponse {
  content: string;
  rawContent: string;
  host: string;
  port: number;
  hasAnsiCodes: boolean;
}

/**
 * Strip ANSI escape codes from text
 */
export function stripAnsiCodes(text: string): string {
  return text.replace(ANSI_ESCAPE_PATTERN, '');
}

/**
 * Parse ANSI color codes and convert to human-readable format
 */
export function parseAnsiColors(text: string): string {
  const colorMap: Record<string, string> = {
    '30': '[BLACK]',
    '31': '[RED]',
    '32': '[GREEN]',
    '33': '[YELLOW]',
    '34': '[BLUE]',
    '35': '[MAGENTA]',
    '36': '[CYAN]',
    '37': '[WHITE]',
    '0': '[RESET]',
    '1': '[BOLD]',
    '4': '[UNDERLINE]',
    '7': '[REVERSE]',
  };

  return text.replace(ANSI_COLOR_PATTERN, (match, codes) => {
    const codeList = codes.split(';');
    const labels = codeList
      .map((code: string) => colorMap[code] || `[CODE:${code}]`)
      .join('');
    return labels;
  });
}

/**
 * Format BBS content for readability
 */
export function formatBBSContent(rawContent: string, stripAnsi: boolean = true): string {
  let content = rawContent;

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (stripAnsi) {
    // Strip ANSI codes completely
    content = stripAnsiCodes(content);
  } else {
    // Convert ANSI codes to readable labels
    content = parseAnsiColors(content);
  }

  // Remove excessive blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  content = content.trim();

  return content;
}

/**
 * Check if text contains ANSI escape codes
 */
export function hasAnsiCodes(text: string): boolean {
  return ANSI_ESCAPE_PATTERN.test(text);
}

/**
 * Connect to a Telnet BBS and retrieve initial content
 */
export async function connectTelnetBBS(config: TelnetBBSConfig): Promise<TelnetBBSResponse> {
  const {
    host,
    port,
    timeout = 10000,
    negotiationMandatory = false,
    stripAnsi = true,
  } = config;

  const connection = new Telnet();

  try {
    // Connect to the BBS
    await connection.connect({
      host,
      port,
      timeout,
      negotiationMandatory,
      // Enable shell prompt detection to know when to stop reading
      shellPrompt: /.*/, // Match any prompt
      // Read initial data
      initialLFCR: true,
    });

    // Wait a moment for the BBS to send its welcome screen
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Read the initial content (welcome screen, login prompt, etc.)
    let rawContent = '';
    
    try {
      // Try to read available data
      rawContent = await connection.send('', {
        timeout: 3000,
        waitfor: false,
      });
    } catch (error) {
      // If send fails, the connection might have already sent data
      // This is common with BBS systems that immediately display content
      console.error('Note: Could not send empty command, using buffered data');
    }

    // Close the connection
    await connection.end();

    // Check if we have ANSI codes
    const containsAnsi = hasAnsiCodes(rawContent);

    // Format the content
    const formattedContent = formatBBSContent(rawContent, stripAnsi);

    return {
      content: formattedContent,
      rawContent,
      host,
      port,
      hasAnsiCodes: containsAnsi,
    };
  } catch (error) {
    // Ensure connection is closed
    try {
      await connection.end();
    } catch {
      // Ignore errors during cleanup
    }

    throw new Error(
      `Failed to connect to BBS at ${host}:${port}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * TelnetBBSAdapter class for use in MCP server
 */
export class TelnetBBSAdapter {
  private defaultTimeout: number;
  private defaultStripAnsi: boolean;

  constructor(options: { timeout?: number; stripAnsi?: boolean } = {}) {
    this.defaultTimeout = options.timeout || 10000;
    this.defaultStripAnsi = options.stripAnsi !== false; // Default to true
  }

  /**
   * Connect to a BBS and retrieve content
   */
  async connect(
    host: string,
    port: number = 23,
    options: { timeout?: number; stripAnsi?: boolean } = {}
  ): Promise<TelnetBBSResponse> {
    const config: TelnetBBSConfig = {
      host,
      port,
      timeout: options.timeout || this.defaultTimeout,
      stripAnsi: options.stripAnsi !== undefined ? options.stripAnsi : this.defaultStripAnsi,
      negotiationMandatory: false,
    };

    return connectTelnetBBS(config);
  }

  /**
   * Validate BBS connection parameters
   */
  isValidHost(host: string): boolean {
    // Basic validation: not empty and doesn't contain invalid characters
    if (!host || host.trim().length === 0) {
      return false;
    }

    // Check for valid hostname or IP address format
    const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;

    return hostnamePattern.test(host) || ipPattern.test(host);
  }

  /**
   * Validate port number
   */
  isValidPort(port: number): boolean {
    return Number.isInteger(port) && port > 0 && port <= 65535;
  }
}
