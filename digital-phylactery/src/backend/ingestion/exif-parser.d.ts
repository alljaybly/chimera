declare module 'exif-parser' {
  interface ExifTags {
    Make?: string;
    Model?: string;
    DateTimeOriginal?: number;
    GPSLatitude?: number;
    GPSLongitude?: number;
    ISO?: number;
    FNumber?: number;
    ExposureTime?: number;
    [key: string]: any;
  }

  interface ImageSize {
    width: number;
    height: number;
  }

  interface ParseResult {
    tags?: ExifTags;
    imageSize?: ImageSize;
  }

  interface ExifParser {
    parse(): ParseResult;
  }

  function create(buffer: Buffer): ExifParser;

  export = { create };
}
