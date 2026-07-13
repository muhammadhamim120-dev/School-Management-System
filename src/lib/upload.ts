import path from "node:path";

// File upload security utilities

// Magic bytes for common file types
const MAGIC_BYTES: Record<string, number[][]> = {
  // PDF
  pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  // Images
  jpeg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], // PNG
  gif: [[0x47, 0x49, 0x46, 0x38]], // GIF8
  webp: [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF...WEBP
  // Office documents (ZIP-based)
  zip: [[0x50, 0x4b, 0x03, 0x04]], // PK..
  // Text files
  txt: [], // No magic bytes, allow by extension
  csv: [], // No magic bytes, allow by extension
  rtf: [[0x7b, 0x5c, 0x72, 0x74, 0x66]], // {\rtf
  // Archives
  rar: [[0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]], // Rar!..
};

// Allowed file extensions with their expected magic bytes
const ALLOWED_TYPES: Record<string, { extensions: string[]; magic?: number[][] }> = {
  pdf: { extensions: [".pdf"], magic: MAGIC_BYTES.pdf },
  jpeg: { extensions: [".jpg", ".jpeg"], magic: MAGIC_BYTES.jpeg },
  png: { extensions: [".png"], magic: MAGIC_BYTES.png },
  gif: { extensions: [".gif"], magic: MAGIC_BYTES.gif },
  webp: { extensions: [".webp"], magic: MAGIC_BYTES.webp },
  docx: { extensions: [".docx"], magic: MAGIC_BYTES.zip }, // DOCX is ZIP-based
  xlsx: { extensions: [".xlsx"], magic: MAGIC_BYTES.zip }, // XLSX is ZIP-based
  pptx: { extensions: [".pptx"], magic: MAGIC_BYTES.zip }, // PPTX is ZIP-based
  txt: { extensions: [".txt"] },
  csv: { extensions: [".csv"] },
  rtf: { extensions: [".rtf"], magic: MAGIC_BYTES.rtf },
  zip: { extensions: [".zip"], magic: MAGIC_BYTES.zip },
};

// Maximum file sizes by type (in bytes)
const MAX_SIZES: Record<string, number> = {
  default: 10 * 1024 * 1024, // 10 MB
  image: 5 * 1024 * 1024, // 5 MB for images
  document: 20 * 1024 * 1024, // 20 MB for documents
};

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  fileType?: string;
}

/**
 * Validate file extension
 */
export function validateExtension(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase();

  for (const [type, config] of Object.entries(ALLOWED_TYPES)) {
    if (config.extensions.includes(ext)) {
      return type;
    }
  }

  return null;
}

/**
 * Validate file magic bytes (content-based validation)
 */
export function validateMagicBytes(buffer: ArrayBuffer, fileType: string): boolean {
  const config = ALLOWED_TYPES[fileType];
  if (!config?.magic || config.magic.length === 0) {
    // No magic bytes required (text files)
    return true;
  }

  const bytes = new Uint8Array(buffer.slice(0, 16)); // Check first 16 bytes

  // Check if any of the magic byte patterns match
  return config.magic.some((pattern) =>
    pattern.every((byte, index) => bytes[index] === byte)
  );
}

/**
 * Sanitize filename to prevent path traversal
 * Removes all path separators and ensures safe characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path information
  const basename = path.basename(filename);

  // Remove null bytes and other dangerous characters
  let sanitized = basename.replace(/[\x00-\x1f\x7f]/g, "");

  // Replace any remaining problematic characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Remove multiple consecutive dots (prevent .. traversal)
  sanitized = sanitized.replace(/\.{2,}/g, "_");

  // Ensure filename doesn't start with a dot (hidden file)
  if (sanitized.startsWith(".")) {
    sanitized = "_" + sanitized.slice(1);
  }

  // Ensure we have a valid filename
  if (!sanitized || sanitized.length < 1) {
    sanitized = "unnamed_file";
  }

  return sanitized;
}

/**
 * Generate a unique filename with timestamp prefix
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `${timestamp}-${random}-${sanitized}`;
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, fileType: string): boolean {
  const maxSize = fileType.startsWith("image")
    ? MAX_SIZES.image
    : MAX_SIZES.document;

  return size <= maxSize;
}

/**
 * Comprehensive file upload validation
 */
export function validateUpload(
  filename: string,
  buffer: ArrayBuffer,
  size: number
): UploadValidationResult {
  // 1. Validate extension
  const fileType = validateExtension(filename);
  if (!fileType) {
    return {
      valid: false,
      error: "Unsupported file type. Allowed: PDF, Office, text, images.",
    };
  }

  // 2. Validate magic bytes
  if (!validateMagicBytes(buffer, fileType)) {
    return {
      valid: false,
      error: "File content does not match its extension.",
    };
  }

  // 3. Validate file size
  if (!validateFileSize(size, fileType)) {
    const maxSize = fileType.startsWith("image") ? "5 MB" : "20 MB";
    return {
      valid: false,
      error: `File too large. Maximum size for ${fileType}: ${maxSize}.`,
    };
  }

  return { valid: true, fileType };
}

/**
 * Get upload directory path
 */
export function getUploadDir(): string {
  return path.join(process.cwd(), "public", "uploads");
}

/**
 * Get allowed extensions for display
 */
export function getAllowedExtensions(): string[] {
  const extensions: string[] = [];
  for (const config of Object.values(ALLOWED_TYPES)) {
    extensions.push(...config.extensions);
  }
  return extensions;
}
