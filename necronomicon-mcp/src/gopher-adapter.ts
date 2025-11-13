/**
 * Gopher Protocol Adapter
 * 
 * Implements a client for the Gopher protocol (RFC 1436).
 * Gopher is a legacy protocol from the early 1990s that predates HTTP.
 */

import * as net from 'net';
import { URL } from 'url';

/**
 * Gopher item types as defined in RFC 1436
 */
export enum GopherItemType {
  TEXT_FILE = '0',
  DIRECTORY = '1',
  CSO_PHONE_BOOK = '2',
  ERROR = '3',
  BINHEX_FILE = '4',
  DOS_BINARY = '5',
  UUENCODED_FILE = '6',
  INDEX_SEARCH = '7',
  TELNET_SESSION = '8',
  BINARY_FILE = '9',
  REDUNDANT_SERVER = '+',
  GIF_IMAGE = 'g',
  IMAGE = 'I',
  HTML_FILE = 'h',
  INFO = 'i',
}

export interface GopherItem {
  type: string;
  display: string;
  selector: string;
  host: string;
  port: number;
}

export interface GopherResponse {
  content: string;
  items?: GopherItem[];
  contentType: 'text' | 'directory' | 'binary' | 'html' | 'image';
}

/**
 * Parse a Gopher URL into its components
 */
export function parseGopherUrl(urlString: string): {
  host: string;
  port: number;
  selector: string;
  itemType: string;
} {
  const url = new URL(urlString);
  
  if (url.protocol !== 'gopher:') {
    throw new Error('Invalid Gopher URL: must start with gopher://');
  }

  const host = url.hostname;
  const port = url.port ? parseInt(url.port, 10) : 70; // Default Gopher port
  let selector = url.pathname;
  let itemType = '1'; // Default to directory

  // Gopher URLs can encode item type as first character of path
  if (selector.length > 1 && selector[1] !== '/') {
    itemType = selector[1];
    selector = selector.substring(2);
  } else if (selector.length > 0) {
    selector = selector.substring(1); // Remove leading slash
  }

  return { host, port, selector, itemType };
}

/**
 * Parse a Gopher directory listing into structured items
 */
export function parseGopherDirectory(data: string): GopherItem[] {
  const lines = data.split('\r\n').filter(line => line.length > 0 && line !== '.');
  const items: GopherItem[] = [];

  for (const line of lines) {
    if (line.length < 2) continue;

    const type = line[0];
    const parts = line.substring(1).split('\t');

    if (parts.length >= 4) {
      items.push({
        type,
        display: parts[0],
        selector: parts[1],
        host: parts[2],
        port: parseInt(parts[3], 10) || 70,
      });
    }
  }

  return items;
}

/**
 * Fetch content from a Gopher server
 */
export async function fetchGopher(urlString: string): Promise<GopherResponse> {
  const { host, port, selector, itemType } = parseGopherUrl(urlString);

  return new Promise((resolve, reject) => {
    const client = net.createConnection({ host, port }, () => {
      // Send the selector followed by CRLF
      client.write(selector + '\r\n');
    });

    let data = '';

    client.on('data', (chunk) => {
      data += chunk.toString('utf-8');
    });

    client.on('end', () => {
      try {
        const response = processGopherResponse(data, itemType);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });

    client.on('error', (error) => {
      reject(new Error(`Gopher connection error: ${error.message}`));
    });

    // Set timeout to prevent hanging connections
    client.setTimeout(10000, () => {
      client.destroy();
      reject(new Error('Gopher connection timeout'));
    });
  });
}

/**
 * Process the raw Gopher response based on item type
 */
function processGopherResponse(data: string, itemType: string): GopherResponse {
  switch (itemType) {
    case GopherItemType.TEXT_FILE:
    case GopherItemType.INFO:
      // Plain text file
      return {
        content: data.replace(/\r\n/g, '\n'),
        contentType: 'text',
      };

    case GopherItemType.DIRECTORY:
    case GopherItemType.INDEX_SEARCH:
      // Directory listing
      const items = parseGopherDirectory(data);
      return {
        content: formatDirectoryAsText(items),
        items,
        contentType: 'directory',
      };

    case GopherItemType.HTML_FILE:
      // HTML file
      return {
        content: data.replace(/\r\n/g, '\n'),
        contentType: 'html',
      };

    case GopherItemType.GIF_IMAGE:
    case GopherItemType.IMAGE:
      // Image file (binary)
      return {
        content: `[Binary image content, ${data.length} bytes]`,
        contentType: 'image',
      };

    case GopherItemType.BINARY_FILE:
    case GopherItemType.DOS_BINARY:
    case GopherItemType.BINHEX_FILE:
    case GopherItemType.UUENCODED_FILE:
      // Binary file
      return {
        content: `[Binary file content, ${data.length} bytes]`,
        contentType: 'binary',
      };

    case GopherItemType.ERROR:
      throw new Error(`Gopher error: ${data}`);

    default:
      // Unknown type, treat as text
      return {
        content: data.replace(/\r\n/g, '\n'),
        contentType: 'text',
      };
  }
}

/**
 * Format a directory listing as human-readable text
 */
function formatDirectoryAsText(items: GopherItem[]): string {
  const lines: string[] = ['Gopher Directory Listing:', ''];

  for (const item of items) {
    const typeLabel = getItemTypeLabel(item.type);
    lines.push(`[${typeLabel}] ${item.display}`);
    if (item.selector) {
      lines.push(`  → gopher://${item.host}:${item.port}/${item.type}${item.selector}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get a human-readable label for a Gopher item type
 */
function getItemTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    '0': 'TEXT',
    '1': 'DIR',
    '2': 'CSO',
    '3': 'ERR',
    '4': 'BINHEX',
    '5': 'DOS',
    '6': 'UU',
    '7': 'SEARCH',
    '8': 'TELNET',
    '9': 'BIN',
    '+': 'MIRROR',
    'g': 'GIF',
    'I': 'IMG',
    'h': 'HTML',
    'i': 'INFO',
  };
  return labels[type] || 'UNKNOWN';
}

/**
 * GopherAdapter class for use in MCP server
 */
export class GopherAdapter {
  /**
   * Fetch content from a Gopher URL
   */
  async fetch(url: string): Promise<GopherResponse> {
    return fetchGopher(url);
  }

  /**
   * Validate a Gopher URL
   */
  isValidGopherUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'gopher:';
    } catch {
      return false;
    }
  }
}
