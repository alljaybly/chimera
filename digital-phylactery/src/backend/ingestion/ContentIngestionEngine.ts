import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import exifParser from 'exif-parser';
import { KnowledgeNode, KnowledgeNodeMetadata } from '../../shared/types/index.js';

/**
 * Content Ingestion Engine
 * Handles importing and normalizing diverse content types into Knowledge Nodes
 */
export class ContentIngestionEngine {
  private contentDir: string;

  constructor(contentDir: string = join(process.cwd(), 'data', 'content')) {
    this.contentDir = contentDir;
    this.ensureContentDir();
  }

  /**
   * Ensure content directory exists
   */
  private async ensureContentDir(): Promise<void> {
    if (!existsSync(this.contentDir)) {
      await mkdir(this.contentDir, { recursive: true });
    }
  }

  /**
   * Ingest a text note into the knowledge base
   * @param text The note content
   * @param metadata Optional metadata (title, tags, etc.)
   * @returns A KnowledgeNode representing the note
   */
  async ingestNote(
    text: string,
    metadata?: Partial<KnowledgeNodeMetadata>
  ): Promise<KnowledgeNode> {
    const now = new Date();
    const id = randomUUID();

    // Extract metadata from content if not provided
    const extractedMetadata = this.extractNoteMetadata(text, metadata);

    // Create searchable text (for full-text indexing)
    const searchableText = this.createSearchableText(text, extractedMetadata);

    const node: KnowledgeNode = {
      id,
      type: 'note',
      content: text,
      metadata: {
        ...extractedMetadata,
        ...metadata,
        createdAt: metadata?.createdAt || now,
        modifiedAt: metadata?.modifiedAt || now,
        tags: metadata?.tags || extractedMetadata.tags || []
      },
      searchableText
    };

    return node;
  }

  /**
   * Extract metadata from note content
   * Looks for title (first line if short), tags (hashtags), etc.
   */
  private extractNoteMetadata(
    text: string,
    providedMetadata?: Partial<KnowledgeNodeMetadata>
  ): Partial<KnowledgeNodeMetadata> {
    const metadata: Partial<KnowledgeNodeMetadata> = {};

    // Extract title from first line if it's short and no title provided
    if (!providedMetadata?.title) {
      const lines = text.split('\n');
      const firstLine = lines[0]?.trim();
      if (firstLine && firstLine.length < 100 && lines.length > 1) {
        metadata.title = firstLine;
      }
    }

    // Extract hashtags as tags
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [...text.matchAll(hashtagRegex)].map(match => match[1]);
    if (hashtags.length > 0) {
      metadata.tags = [...new Set(hashtags)]; // Remove duplicates
    }

    // Set source
    metadata.source = providedMetadata?.source || 'manual_entry';

    return metadata;
  }

  /**
   * Create searchable text combining content and metadata
   */
  private createSearchableText(
    content: string,
    metadata: Partial<KnowledgeNodeMetadata>
  ): string {
    const parts: string[] = [content];

    if (metadata.title) {
      parts.unshift(metadata.title);
    }

    if (metadata.tags && metadata.tags.length > 0) {
      parts.push(metadata.tags.join(' '));
    }

    return parts.join(' ').trim();
  }

  /**
   * Ingest an image file into the knowledge base
   * @param fileBuffer The image file buffer
   * @param filename Original filename
   * @param metadata Optional metadata
   * @returns A KnowledgeNode representing the image
   */
  async ingestImage(
    fileBuffer: Buffer,
    filename: string,
    metadata?: Partial<KnowledgeNodeMetadata>
  ): Promise<KnowledgeNode> {
    const now = new Date();
    const id = randomUUID();
    const ext = extname(filename);
    const storedFilename = `${id}${ext}`;
    const contentPath = join(this.contentDir, storedFilename);

    // Extract EXIF metadata if available
    const exifMetadata = this.extractExifMetadata(fileBuffer);

    // Save image to filesystem
    await this.ensureContentDir();
    await writeFile(contentPath, fileBuffer);

    // Create searchable text from metadata
    const searchableText = this.createImageSearchableText(filename, exifMetadata, metadata);

    const node: KnowledgeNode = {
      id,
      type: 'image',
      content: fileBuffer,
      content_path: contentPath,
      metadata: {
        title: metadata?.title || filename,
        source: metadata?.source || 'file_upload',
        createdAt: exifMetadata?.createdAt || metadata?.createdAt || now,
        modifiedAt: metadata?.modifiedAt || now,
        tags: metadata?.tags || [],
        ...exifMetadata?.metadata
      },
      searchableText
    };

    return node;
  }

  /**
   * Extract EXIF metadata from image buffer
   */
  private extractExifMetadata(buffer: Buffer): {
    createdAt?: Date;
    metadata: Record<string, any>;
  } | null {
    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();

      const metadata: Record<string, any> = {};
      let createdAt: Date | undefined;

      if (result.tags) {
        // Extract useful EXIF tags
        if (result.tags.Make) metadata.cameraMake = result.tags.Make;
        if (result.tags.Model) metadata.cameraModel = result.tags.Model;
        if (result.tags.DateTimeOriginal) {
          createdAt = new Date(result.tags.DateTimeOriginal * 1000);
          metadata.dateTimeOriginal = createdAt.toISOString();
        }
        if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
          metadata.gpsLatitude = result.tags.GPSLatitude;
          metadata.gpsLongitude = result.tags.GPSLongitude;
        }
        if (result.tags.ISO) metadata.iso = result.tags.ISO;
        if (result.tags.FNumber) metadata.fNumber = result.tags.FNumber;
        if (result.tags.ExposureTime) metadata.exposureTime = result.tags.ExposureTime;
      }

      if (result.imageSize) {
        metadata.width = result.imageSize.width;
        metadata.height = result.imageSize.height;
      }

      return { createdAt, metadata };
    } catch (error) {
      // EXIF parsing failed, return null
      return null;
    }
  }

  /**
   * Create searchable text for image from filename and metadata
   */
  private createImageSearchableText(
    filename: string,
    exifMetadata: { createdAt?: Date; metadata: Record<string, any> } | null,
    providedMetadata?: Partial<KnowledgeNodeMetadata>
  ): string {
    const parts: string[] = [filename];

    if (providedMetadata?.title && providedMetadata.title !== filename) {
      parts.push(providedMetadata.title);
    }

    if (providedMetadata?.tags && providedMetadata.tags.length > 0) {
      parts.push(providedMetadata.tags.join(' '));
    }

    if (exifMetadata?.metadata) {
      const { cameraMake, cameraModel, dateTimeOriginal } = exifMetadata.metadata;
      if (cameraMake) parts.push(cameraMake);
      if (cameraModel) parts.push(cameraModel);
      if (dateTimeOriginal) parts.push(dateTimeOriginal);
    }

    return parts.join(' ').trim();
  }

  /**
   * Ingest a web page into the knowledge base
   * @param url The URL to fetch
   * @param metadata Optional metadata
   * @returns A KnowledgeNode representing the web page
   */
  async ingestWebPage(
    url: string,
    metadata?: Partial<KnowledgeNodeMetadata>
  ): Promise<KnowledgeNode> {
    const now = new Date();
    const id = randomUUID();

    // Dynamically import puppeteer
    const puppeteer = await import('puppeteer');

    // Launch browser and fetch page
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Extract page content and metadata
      const pageData = await page.evaluate(() => {
        // Get title
        const title = document.title;

        // Get meta description
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        // Get meta keywords
        const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';

        // Get main content (try to extract meaningful text)
        const bodyText = document.body.innerText;

        // Get all headings for better context
        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(h => h.textContent?.trim())
          .filter(Boolean)
          .join(' ');

        return {
          title,
          metaDescription,
          metaKeywords,
          bodyText,
          headings
        };
      });

      await browser.close();

      // Create searchable text
      const searchableText = this.createWebPageSearchableText(
        pageData.title,
        pageData.metaDescription,
        pageData.metaKeywords,
        pageData.headings,
        pageData.bodyText,
        metadata
      );

      // Extract tags from keywords
      const tags = metadata?.tags || [];
      if (pageData.metaKeywords) {
        const keywordTags = pageData.metaKeywords
          .split(',')
          .map(k => k.trim())
          .filter(Boolean);
        tags.push(...keywordTags);
      }

      const node: KnowledgeNode = {
        id,
        type: 'webpage',
        content: pageData.bodyText,
        metadata: {
          title: metadata?.title || pageData.title || url,
          source: url,
          createdAt: metadata?.createdAt || now,
          modifiedAt: metadata?.modifiedAt || now,
          tags: [...new Set(tags)], // Remove duplicates
          description: pageData.metaDescription,
          headings: pageData.headings
        },
        searchableText
      };

      return node;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Create searchable text for web page
   */
  private createWebPageSearchableText(
    title: string,
    description: string,
    keywords: string,
    headings: string,
    bodyText: string,
    providedMetadata?: Partial<KnowledgeNodeMetadata>
  ): string {
    const parts: string[] = [];

    if (title) parts.push(title);
    if (description) parts.push(description);
    if (keywords) parts.push(keywords);
    if (headings) parts.push(headings);
    
    // Add a portion of body text (first 1000 chars to keep searchable text reasonable)
    if (bodyText) {
      parts.push(bodyText.substring(0, 1000));
    }

    if (providedMetadata?.tags && providedMetadata.tags.length > 0) {
      parts.push(providedMetadata.tags.join(' '));
    }

    return parts.join(' ').trim();
  }
}
